# Trips — Vision

A collaborative web app for planning international holidays. Built for couples (and eventually small groups) who want to go from "wouldn't it be cool to visit…" all the way through to a concrete travel plan — together, in real time.

## Core Principles

- **Real-time first.** Both people see changes instantly — cursors, pins, edits, everything.
- **Low friction capture.** Getting an idea into the app should take seconds, whether it's a pasted Instagram Reel, a dropped map pin, or a quick text note.
- **Progressive detail.** Trips start as vague ideas and gradually become concrete plans. The app should support every stage without forcing structure too early.
- **Spatial thinking.** Maps and mood boards are first-class surfaces, not afterthoughts. Planning a trip is inherently spatial.
- **Agent-first.** Every user action should also be performable by an AI agent. The UI is one interface to a shared action layer — chat, MCP, and automation are equally valid entry points.

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

### V5 — Agent Interfaces

- **In-app chat panel** — slide-out AI assistant with access to all Convex functions as tools
- **MCP server** — expose trip/pin/scratchpad operations for external agents
- **Bulk agent operations** — "research 10 restaurants near our hotel and add them as pins"

### V6 — Social & Sharing

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

## Agent-First Architecture

Every action a user can take through the UI should be equally available to an AI agent. This informs how we structure the codebase:

### Design Principles

1. **Convex functions are the action layer.** All business logic lives in Convex queries, mutations, and actions — never in React components. Components are thin views over the action layer. If a React component is doing something an agent would also need to do, that logic belongs in a Convex function.

2. **Typed, self-describing operations.** Convex functions already have typed args via `v.` validators. This makes them naturally suitable as tool definitions for an LLM — each function is a named operation with a typed schema.

3. **Composable primitives.** Keep Convex functions granular (e.g. `pins.create`, `trips.updateStatus`) rather than building monolithic "do everything" functions. Agents can compose primitives; they can't decompose monoliths.

4. **Context-rich responses.** Queries should return enough context for an agent to make decisions. For example, `trips.list` returns status, destination, pin count — not just IDs.

### Agent Surfaces (planned)

- **In-app chat panel** — a slide-out panel where users can chat with an AI assistant that has access to all Convex functions as tools. "Add a pin for the best ramen in Tokyo to our Japan trip." Lives alongside the existing UI.
- **MCP server** — expose Convex functions as MCP tools so external agents (Claude Code, IDE assistants, etc.) can interact with trip data. Useful for bulk operations, scripting, and integration with other tools.
- **Convex actions for AI workflows** — server-side Convex actions that call Claude API for tasks like URL ingestion, pin enrichment, discovery, and season analysis. These are agent-to-agent: the system's own AI capabilities, not user-facing chat.

### What This Means for Development

- When adding a new feature, write the Convex function first. Make sure it's usable without any UI context (no implicit state from React).
- Avoid putting decision logic in event handlers. A click handler should call a Convex mutation, not compute what the mutation args should be.
- Mutation args should be explicit and complete — avoid relying on server-side "current user" context for business logic where possible (auth checks are fine).
- Think about how an agent would describe the operation: if it takes a tripId and a destination string, an agent can call it. If it takes a complex nested object derived from UI state, it probably can't.

## Open Questions

- What rich text editor for scratchpads? (Tiptap, BlockNote, Plate — all work with Liveblocks for collab editing)
- How to handle Liveblocks + Convex interplay cleanly? (Liveblocks for presence/awareness, Convex for persistent data)
- Instagram API limitations — scraping Reels may require a proxy or browser automation; initial approach will be AI extraction from page content
- tldraw licensing — verify the license terms work for this use case
