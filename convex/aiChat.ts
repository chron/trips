import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  streamText,
  generateText,
  tool,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
} from "ai";
import type { UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { Id } from "./_generated/dataModel";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const chatStream = httpAction(async (ctx, request) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = await request.json();
  const { messages: uiMessages, threadId, workspaceId, tripId } = body as {
    messages: UIMessage[];
    threadId: string;
    workspaceId: string;
    tripId?: string;
  };

  // Convert UI messages (parts-based) to model messages (content-based)
  const clientMessages = await convertToModelMessages(uiMessages);

  // Build system prompt with trip context
  let systemPrompt = `You are a helpful travel planning assistant for the "Trips" app. You help users plan trips by creating and managing trips, pins (places to visit), and notes.

You have access to tools that let you create trips, add pins to maps, manage scratchpad notes, and more. Use them proactively when the user asks you to do something — don't just describe what you would do, actually do it.

When creating pins, always provide realistic coordinates. If you're not sure of exact coordinates, use your best estimate for the location.

After creating a trip or adding pins, use the navigateToTrip tool to show the user the result.

Keep responses concise and friendly.`;

  if (tripId) {
    const trip = await ctx.runQuery(internal.chatTools.getTrip, {
      id: tripId as Id<"trips">,
    });
    if (trip) {
      const pins = await ctx.runQuery(internal.chatTools.listPins, {
        tripId: tripId as Id<"trips">,
      });
      const scratchpad = await ctx.runQuery(internal.chatTools.getScratchpad, {
        tripId: tripId as Id<"trips">,
      });
      systemPrompt += `\n\nCurrent trip context:
- Trip: "${trip.title}" to ${trip.destination} (status: ${trip.status})
- Trip ID: ${trip._id}
- Workspace ID: ${workspaceId}
- ${pins.length} pins: ${pins.map((p) => `${p.name} (${p.category})`).join(", ") || "none yet"}
${scratchpad ? `- Scratchpad notes: ${scratchpad.slice(0, 500)}` : "- No scratchpad notes yet"}`;
    }
  } else {
    const trips = await ctx.runQuery(internal.chatTools.listTrips, {
      workspaceId: workspaceId as Id<"workspaces">,
    });
    systemPrompt += `\n\nCurrent context:
- Workspace ID: ${workspaceId}
- No specific trip selected
- ${trips.length} trips in workspace: ${trips.map((t) => `"${t.title}" (${t.destination}, ${t.status})`).join(", ") || "none yet"}`;
  }

  const agentTools = {
    createTrip: tool({
      description:
        "Create a new trip. Use this when the user wants to plan a new trip to a destination.",
      inputSchema: z.object({
        title: z.string().describe("A short, catchy title for the trip"),
        destination: z.string().describe("The destination (city, country, or region)"),
      }),
      execute: async ({ title, destination }: { title: string; destination: string }) => {
        const id = await ctx.runMutation(internal.chatTools.createTrip, {
          title,
          destination,
          workspaceId: workspaceId as Id<"workspaces">,
        });
        return { success: true, tripId: id, title, destination };
      },
    }),
    updateTripStatus: tool({
      description: "Update a trip's status to draft, planning, or booked.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID"),
        status: z.enum(["draft", "planning", "booked"]),
      }),
      execute: async ({ tripId: tid, status }: { tripId: string; status: "draft" | "planning" | "booked" }) => {
        await ctx.runMutation(internal.chatTools.updateTripStatus, {
          id: tid as Id<"trips">,
          status,
        });
        return { success: true, tripId: tid, status };
      },
    }),
    listTrips: tool({
      description: "List all trips in the workspace.",
      inputSchema: z.object({}),
      execute: async () => {
        const trips = await ctx.runQuery(internal.chatTools.listTrips, {
          workspaceId: workspaceId as Id<"workspaces">,
        });
        return trips.map((t) => ({
          id: t._id,
          title: t.title,
          destination: t.destination,
          status: t.status,
        }));
      },
    }),
    createPin: tool({
      description:
        "Add a pin (place to visit) to a trip's map. Use this when the user mentions a specific place, restaurant, hotel, or activity they want to visit.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID to add the pin to"),
        name: z.string().describe("Name of the place"),
        lat: z.number().describe("Latitude"),
        lng: z.number().describe("Longitude"),
        category: z.enum(["food", "activity", "hotel", "landmark", "transport", "other"]),
        notes: z.string().optional().describe("Brief description or notes about this place"),
      }),
      execute: async ({ tripId: tid, name, lat, lng, category, notes }: {
        tripId: string; name: string; lat: number; lng: number;
        category: "food" | "activity" | "hotel" | "landmark" | "transport" | "other";
        notes?: string;
      }) => {
        const id = await ctx.runMutation(internal.chatTools.createPin, {
          tripId: tid as Id<"trips">,
          name, lat, lng, category, notes,
        });
        return { success: true, pinId: id, name, category };
      },
    }),
    listPins: tool({
      description: "List all pins for a trip.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID"),
      }),
      execute: async ({ tripId: tid }: { tripId: string }) => {
        const pins = await ctx.runQuery(internal.chatTools.listPins, {
          tripId: tid as Id<"trips">,
        });
        return pins.map((p) => ({
          id: p._id, name: p.name, category: p.category,
          lat: p.lat, lng: p.lng, notes: p.notes,
        }));
      },
    }),
    removePin: tool({
      description: "Remove a pin from a trip.",
      inputSchema: z.object({
        pinId: z.string().describe("The pin ID to remove"),
      }),
      execute: async ({ pinId }: { pinId: string }) => {
        await ctx.runMutation(internal.chatTools.removePin, {
          id: pinId as Id<"pins">,
        });
        return { success: true, pinId };
      },
    }),
    saveScratchpad: tool({
      description: "Save or update the scratchpad notes for a trip. The content is HTML.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID"),
        content: z.string().describe("The scratchpad content (can be HTML)"),
      }),
      execute: async ({ tripId: tid, content }: { tripId: string; content: string }) => {
        await ctx.runMutation(internal.chatTools.saveScratchpad, {
          tripId: tid as Id<"trips">,
          workspaceId: workspaceId as Id<"workspaces">,
          content,
        });
        return { success: true };
      },
    }),
    getScratchpad: tool({
      description: "Read the scratchpad notes for a trip.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID"),
      }),
      execute: async ({ tripId: tid }: { tripId: string }) => {
        const content = await ctx.runQuery(internal.chatTools.getScratchpad, {
          tripId: tid as Id<"trips">,
        });
        return { content };
      },
    }),
    navigateToTrip: tool({
      description:
        "Navigate the user to a specific trip page in the app. Use this after creating a trip, adding pins, or when the user asks to see a trip.",
      inputSchema: z.object({
        tripId: z.string().describe("The trip ID to navigate to"),
      }),
      execute: async ({ tripId: tid }: { tripId: string }) => {
        // The result is interpreted client-side to trigger navigation
        return { action: "navigate", tripId: tid };
      },
    }),
  };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = await streamText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: systemPrompt,
        messages: clientMessages,
        tools: agentTools,
        stopWhen: stepCountIs(5),
        onFinish: async ({ text, steps }) => {
          // Collect tool calls from all steps
          const toolCalls = steps.flatMap((step) =>
            step.toolCalls.map((tc) => {
              const result = step.toolResults.find(
                (tr) => tr.toolCallId === tc.toolCallId,
              );
              return {
                id: tc.toolCallId,
                name: tc.toolName,
                args: JSON.stringify("args" in tc ? tc.args : {}),
                result: result
                  ? JSON.stringify("result" in result ? result.result : result)
                  : undefined,
              };
            }),
          );

          await ctx.runMutation(internal.chat.addMessage, {
            threadId: threadId as Id<"chatThreads">,
            role: "assistant",
            content: text,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          });

          // Auto-title: if this is the first exchange, generate a title
          const msgCount = await ctx.runQuery(
            internal.chatTools.countMessages,
            { threadId: threadId as Id<"chatThreads"> },
          );
          if (msgCount <= 2) {
            const firstUserMsg = uiMessages.find((m) => m.role === "user");
            const userText = firstUserMsg?.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join(" ");
            if (userText) {
              try {
                const titleResult = await generateText({
                  model: anthropic("claude-haiku-4-5-20251001"),
                  prompt: `Generate a very short title (3-5 words, no quotes) for a chat that starts with: "${userText.slice(0, 200)}"`,
                });
                await ctx.runMutation(internal.chatTools.updateThreadTitle, {
                  id: threadId as Id<"chatThreads">,
                  title: titleResult.text.trim(),
                });
              } catch (e) {
                console.error("Auto-title failed:", e);
              }
            }
          }
        },
      });

      result.consumeStream();

      const uiStream = result.toUIMessageStream();
      for await (const chunk of uiStream) {
        writer.write(chunk);
      }
    },
    onError: (error) => {
      console.error("Chat stream error:", error);
      return "An error occurred while generating the response.";
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: corsHeaders,
  });
});

export const chatOptions = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});
