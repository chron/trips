"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import Anthropic from "@anthropic-ai/sdk";

const categoryValues = [
  "food",
  "activity",
  "hotel",
  "landmark",
  "transport",
  "other",
] as const;

type Category = (typeof categoryValues)[number];

type ExtractionResult = {
  name: string;
  lat: number | null;
  lng: number | null;
  locationQuery: string | null;
  category: Category;
  notes: string;
};

// Public action: user pastes a URL, we extract info and return it for confirmation
export const extractFromUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    // 1. Fetch the page
    const pageContent = await fetchPageContent(args.url);

    // 2. Extract structured data with Claude
    const extraction = await extractWithClaude(pageContent);

    // 3. Geocode if we got a location query but no coordinates
    let lat = extraction.lat;
    let lng = extraction.lng;
    if (lat === null || lng === null) {
      if (extraction.locationQuery) {
        const coords = await geocode(extraction.locationQuery);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }
    }

    return {
      name: extraction.name,
      lat,
      lng,
      category: extraction.category,
      notes: extraction.notes,
      sourceUrl: args.url,
    };
  },
});

async function fetchPageContent(url: string): Promise<string> {
  // Use Jina Reader to fetch and extract clean content from the page.
  // This handles JS-rendered pages, anti-bot measures, and returns markdown.
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: {
      Accept: "text/plain",
      "X-Return-Format": "text",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch URL via Jina Reader: ${res.status} ${res.statusText}`,
    );
  }

  const text = await res.text();
  // Truncate to keep the Claude prompt reasonable
  return `URL: ${url}\n\n${text.slice(0, 8000)}`;
}

async function extractWithClaude(
  pageContent: string,
): Promise<ExtractionResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are helping plan a trip. Extract location information from this web page.

Return a JSON object with these fields:
- "name": The name of the place/restaurant/hotel/attraction (short, human-friendly)
- "lat": Latitude as a number, or null if not found on the page
- "lng": Longitude as a number, or null if not found on the page
- "locationQuery": A search query to geocode this place (e.g. "Blue Bottle Coffee, Tokyo, Japan"). Include city/country for disambiguation. Set to null only if lat/lng are already provided.
- "category": One of: "food", "activity", "hotel", "landmark", "transport", "other"
- "notes": A 1-2 sentence summary of what this place is and why it might be interesting for a trip. Keep it concise.

Page content:
${pageContent}

Respond with ONLY the JSON object, no markdown fences or extra text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return {
      name: parsed.name ?? "Unknown place",
      lat: typeof parsed.lat === "number" ? parsed.lat : null,
      lng: typeof parsed.lng === "number" ? parsed.lng : null,
      locationQuery: parsed.locationQuery ?? null,
      category: categoryValues.includes(parsed.category)
        ? parsed.category
        : "other",
      notes: parsed.notes ?? "",
    };
  } catch {
    throw new Error("Failed to parse AI extraction result");
  }
}

async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    console.warn("MAPBOX_TOKEN not set, skipping geocoding");
    return null;
  }

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`,
  );

  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    lng: feature.center[0],
    lat: feature.center[1],
  };
}
