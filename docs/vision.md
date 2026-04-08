# Trips — Vision

A collaborative web app for planning international holidays. Built for couples (and eventually small groups) who want to go from "wouldn't it be cool to visit…" all the way through to a concrete travel plan — together, in real time.

## Core Principles

- **Real-time first.** Both people see changes instantly — cursors, pins, edits, everything.
- **Low friction capture.** Getting an idea into the app should take seconds, whether it's a pasted Instagram Reel, a dropped map pin, or a quick text note.
- **Progressive detail.** Trips start as vague ideas and gradually become concrete plans. The app should support every stage without forcing structure too early.
- **Spatial thinking.** Maps and mood boards are first-class surfaces, not afterthoughts. Planning a trip is inherently spatial.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vite + React + TanStack Router | Fast DX, client-side routing, no SSR overhead |
| Backend / DB | Convex | Real-time reactivity, serverless functions, built-in DB |
| Auth | Clerk (magic link) | Minimal friction login, first-class Convex integration |
| Real-time presence | Liveblocks | Cursor presence, selection awareness, polished React SDK |
| Maps | Mapbox GL JS | Design flexibility, free tier, existing API key |
| Mood board / Canvas | tldraw | Zoomable freeform canvas, React-native, extensible |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, copy-paste components, easy to customise |
| Hosting | Cloudflare Pages | Edge-deployed, fast, simple |

## Trip Lifecycle

```
Draft → Planning → Booked → In Progress → Complete
```

- **Draft**: an idea on the list. Minimal info — just a destination name and maybe some vibes.
- **Planning**: actively researching. Map pins, scratchpad notes, mood board, calendar.
- **Booked**: flights/accommodation confirmed. Route planning, day-by-day itinerary.
- **In Progress**: currently on the trip. (Future: live checklist, expense tracking.)
- **Complete**: archive. (Future: trip summary / shareable keepsake.)

MVP focuses on **Draft** and **Planning**. Later stages are designed for but not built yet.

## Feature Map

### V1 — MVP (what we build first)

- **Auth** — Clerk magic link sign-in, shared workspace
- **Trip list** — ordered list of trips, drag to reorder priority, status badges (draft/planning/booked)
- **Trip detail — Map** — Mapbox surface per trip, drop pins with name/category/notes/source URL
- **Trip detail — Scratchpad** — rich text area per trip for freeform notes
- **Global scratchpad** — a catch-all inbox for half-formed ideas, links, deals
- **Real-time sync** — all data syncs live via Convex
- **Presence** — see collaborator's cursor and selection via Liveblocks
- **URL ingestion** — paste a URL (including Instagram Reels), AI extracts location/description, creates a draft pin

### V2 — Planning Depth

- **Calendar** — per-trip calendar to mark potential travel windows, overlay local events/holidays
- **Smart season picker** — AI suggests best months for a destination (weather, crowds, cost, events)
- **Route planning** — drag a line between pins to define city-to-city order, auto-suggest transport
- **Pin enrichment** — pull photos, ratings, hours from Google Places when a pin is near a known POI
- **AI discovery agent** — "find me nightclubs in Berlin" → suggested pins with descriptions

### V3 — Mood Board & Capture

- **Spatial mood board** — tldraw-based canvas per trip for arranging images, links, pins, and notes visually
- **Quick capture** — share target / bookmarklet for firing links into the app from mobile or desktop
- **Reel video analysis** — multimodal AI model interprets video content from Reels, not just metadata

### V4 — On-Trip & Post-Trip

- **Day-by-day itinerary** — assign pins to specific days, reorderable within each day
- **Trip summary** — generate a beautiful shareable page of a planned or completed trip
- **Basic budgeting** — per-trip budget, categorised expenses, running total

### V5 — Social & Sharing

- **Multi-user trips** — invite friends/family to collaborate on a trip
- **Public trip pages** — share a read-only view of a trip
- **Trip templates** — save and share trip structures others can clone

## Data Model (Conceptual)

```
User
  - id, email, name, avatar

Workspace
  - id, members[]

Trip
  - id, workspaceId
  - title, destination, status (draft|planning|booked|in_progress|complete)
  - sortOrder
  - scratchpad (rich text)

Pin
  - id, tripId
  - lat, lng
  - name, category (food|activity|hotel|landmark|transport|other)
  - notes, sourceUrl
  - createdBy

GlobalScratchpad
  - id, workspaceId
  - content (rich text)
```

This will evolve — route planning adds edges between pins, itinerary adds day assignments, budgeting adds expense records, etc.

## Open Questions

- What rich text editor for scratchpads? (Tiptap, BlockNote, Plate — all work with Liveblocks for collab editing)
- How to handle Liveblocks + Convex interplay cleanly? (Liveblocks for presence/awareness, Convex for persistent data)
- Instagram API limitations — scraping Reels may require a proxy or browser automation; initial approach will be AI extraction from page content
- tldraw licensing — verify the license terms work for this use case
