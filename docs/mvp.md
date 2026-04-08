# Trips — MVP Build Plan

The first shippable cut. Goal: two people can sign in, manage a list of trip ideas, drop pins on a map, take freeform notes, paste URLs for AI extraction, and see each other's presence in real time.

## Milestone 1: Project Scaffold & Auth

**Goal:** App boots, deploys to Cloudflare Pages, users can sign in.

- [ ] Init Vite + React + TypeScript project
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Install and configure TanStack Router (file-based or code-based routes)
- [ ] Set up Convex (`npx convex dev`)
- [ ] Integrate Clerk auth with Convex (`@clerk/clerk-react` + Convex auth adapter)
- [ ] Magic link sign-in flow
- [ ] Basic layout shell (sidebar + main content area)
- [ ] Deploy to Cloudflare Pages (Vite build → `dist/`)
- [ ] Workspace creation on first sign-in (auto-create, invite partner by email)

**Routes after this milestone:**
- `/` → redirect to `/trips`
- `/trips` → trip list (empty state)

## Milestone 2: Trip List

**Goal:** Users can create, view, reorder, and manage trip ideas.

- [ ] Convex schema: `trips` table (title, destination, status, sortOrder, workspaceId)
- [ ] Trip list page with empty state
- [ ] Create trip dialog (title + destination)
- [ ] Trip cards showing title, destination, status badge
- [ ] Drag-to-reorder (use `@dnd-kit/core` or similar)
- [ ] Status transitions: draft → planning → booked (simple dropdown or button)
- [ ] Delete trip (with confirmation)

**Routes after this milestone:**
- `/trips` → trip list
- `/trips/:id` → trip detail (placeholder)

## Milestone 3: Trip Map

**Goal:** Each trip has a Mapbox map where users can drop and manage pins.

- [ ] Convex schema: `pins` table (tripId, lat, lng, name, category, notes, sourceUrl, createdBy)
- [ ] Mapbox GL JS integration on trip detail page
- [ ] Click-to-place pin on map
- [ ] Pin popup/panel: edit name, category (food/activity/hotel/landmark/transport/other), notes, source URL
- [ ] Pin markers styled by category (icon + colour)
- [ ] Pin list sidebar (click to fly-to on map)
- [ ] Delete pin
- [ ] Pins sync in real-time between users via Convex

## Milestone 4: Scratchpads

**Goal:** Freeform text areas for dumping ideas, per-trip and globally.

- [ ] Choose and integrate a rich text editor (Tiptap recommended — good Liveblocks integration story)
- [ ] Per-trip scratchpad tab/panel on trip detail page
- [ ] Convex schema: scratchpad content stored per trip
- [ ] Global scratchpad accessible from sidebar (always available, not tied to a trip)
- [ ] Convex schema: global scratchpad per workspace
- [ ] Real-time sync of text content via Convex

## Milestone 5: Real-Time Presence

**Goal:** See your partner's cursor and what they're looking at.

- [ ] Integrate Liveblocks (`@liveblocks/react`) alongside Convex
- [ ] Room-per-trip: when viewing a trip, join a Liveblocks room
- [ ] Show collaborator cursors on the map surface
- [ ] Show collaborator presence indicator (avatar + "viewing this trip" in sidebar)
- [ ] Show collaborator cursor/selection in scratchpad (if using Tiptap + Liveblocks Yjs)
- [ ] Presence on trip list page (who's online)

## Milestone 6: URL Ingestion

**Goal:** Paste a URL, AI extracts location and info, creates a draft pin.

- [ ] "Add from URL" button/input on trip detail page
- [ ] Convex action: fetch URL content (server-side)
- [ ] Convex action: send page content to Claude API with extraction prompt
  - Extract: location name, coordinates (or city/country for geocoding), description, category
  - Handle Instagram Reel URLs: extract from page metadata + any available content
- [ ] Geocode extracted location if needed (Mapbox Geocoding API)
- [ ] Create pin from extracted data, mark as "suggested" so user can review/confirm
- [ ] Show extraction result in a confirmation dialog before creating pin
- [ ] Handle failures gracefully (URL unreachable, no location found, etc.)

## Milestone 7: Polish & Ship

**Goal:** Make it feel good enough to use daily.

- [ ] Loading states and skeletons
- [ ] Error boundaries and toast notifications
- [ ] Empty states with helpful CTAs
- [ ] Responsive layout (usable on mobile, optimised for desktop)
- [ ] Keyboard shortcuts (N for new trip, P for new pin, etc.)
- [ ] Page titles and basic meta tags
- [ ] Final deploy and smoke test with both users

---

## Technical Decisions

### Convex + Liveblocks boundary

- **Convex** owns all persistent data (trips, pins, scratchpads, users, workspaces)
- **Liveblocks** owns ephemeral collaboration state (cursor positions, presence, collaborative text editing cursors)
- Scratchpad content is persisted to Convex but edited via Tiptap + Liveblocks Yjs for real-time collaborative editing
- This means Liveblocks rooms are "views" over Convex data — they don't store anything that needs to survive a page reload

### AI / URL Extraction

- Use Claude API (called from Convex actions) for URL content extraction
- Prompt design: give the model the raw HTML/metadata, ask for structured JSON output (location, description, coordinates, category)
- For Instagram Reels: initially extract from `<meta>` tags and page content; video frame analysis is a V3 feature
- Geocoding fallback: if AI returns a place name but no coordinates, hit Mapbox Geocoding API

### File Structure (approximate)

```
src/
  routes/
    __root.tsx          # layout shell
    index.tsx           # redirect to /trips
    trips/
      index.tsx         # trip list
      $tripId.tsx       # trip detail (map + scratchpad + pins)
  components/
    trip-list/          # trip cards, create dialog, dnd
    trip-detail/        # map, pin panel, scratchpad
    presence/           # cursor overlays, avatars
    ingestion/          # URL input, confirmation dialog
    ui/                 # shadcn components
  lib/
    convex.ts           # convex client setup
    liveblocks.ts       # liveblocks client setup
    clerk.ts            # clerk setup
convex/
  schema.ts             # database schema
  trips.ts              # trip queries and mutations
  pins.ts               # pin queries and mutations
  scratchpads.ts        # scratchpad queries and mutations
  ingestion.ts          # URL fetch + AI extraction actions
  auth.config.ts        # Clerk integration
```
