# Trips — MVP Build Plan

The first shippable cut. Goal: two people can sign in, manage a list of trip ideas, drop pins on a map, take freeform notes, paste URLs for AI extraction, and see each other's presence in real time.

## Milestone 1: Project Scaffold & Auth ✓

**Goal:** App boots, deploys to Cloudflare Pages, users can sign in.

- [x] Init Vite + React + TypeScript project
- [x] Set up Tailwind CSS + shadcn/ui
- [x] Install and configure TanStack Router (code-based routes)
- [x] Set up Convex (`npx convex dev`)
- [x] Integrate Clerk auth with Convex (`@clerk/clerk-react` + Convex auth adapter)
- [x] Magic link sign-in flow
- [x] Basic layout shell (sidebar + main content area)
- [x] Deploy to Cloudflare Pages (Vite build → `dist/`)
- [x] Workspace creation on first sign-in (auto-create)
- [ ] Invite partner by email (deferred)

**Routes after this milestone:**
- `/` → redirect to `/trips`
- `/trips` → trip list (empty state)

## Milestone 2: Trip List ✓

**Goal:** Users can create, view, reorder, and manage trip ideas.

- [x] Convex schema: `trips` table (title, destination, status, sortOrder, workspaceId)
- [x] Trip list page with empty state + loading skeleton
- [x] Create trip dialog (title + destination) with toast
- [x] Trip cards showing title, destination, status badge
- [x] Drag-to-reorder (dnd-kit)
- [x] Status transitions: draft → planning → booked (dropdown)
- [x] Delete trip (with confirmation + toast)

**Routes after this milestone:**
- `/trips` → trip list
- `/trips/:id` → trip detail (placeholder)

## Milestone 3: Trip Map ✓

**Goal:** Each trip has a Mapbox map where users can drop and manage pins.

- [x] Convex schema: `pins` table (tripId, lat, lng, name, category, notes, sourceUrl, createdBy)
- [x] Mapbox GL JS integration on trip detail page
- [x] Click-to-place pin on map
- [x] Pin popup/panel: edit name, category, notes, source URL
- [ ] Pin markers styled by category (icon + colour) — deferred
- [x] Pin list sidebar (click to fly-to on map)
- [x] Delete pin
- [x] Pins sync in real-time between users via Convex
- [x] Auto-fit map bounds on first pin load
- [x] Geocoder search (mapbox-gl-geocoder)

## Milestone 4: Scratchpads ✓

**Goal:** Freeform text areas for dumping ideas, per-trip and globally.

- [x] Tiptap rich text editor with markdown toggle
- [x] Per-trip scratchpad ("Notes" tab on trip detail)
- [x] Convex schema: scratchpad content stored per trip
- [x] Global scratchpad accessible from sidebar
- [x] Convex schema: global scratchpad per workspace
- [x] Debounced save to Convex with conflict-safe sync
- [ ] Collaborative cursors via Liveblocks Yjs — deferred

## Milestone 5: Real-Time Presence ✓

**Goal:** See your partner's cursor and what they're looking at.

- [x] Integrate Liveblocks (`@liveblocks/react`) alongside Convex
- [x] Room-per-trip: when viewing a trip, join a Liveblocks room
- [x] Show collaborator cursors on the page (cursor overlay)
- [x] Show collaborator presence indicator (avatars in header)
- [ ] Show collaborator cursor/selection in scratchpad (Liveblocks Yjs) — deferred
- [ ] Presence on trip list page — deferred

## Milestone 6: URL Ingestion ✓

**Goal:** Paste a URL, AI extracts location and info, creates a draft pin.

- [x] "Add from URL" input on pins tab
- [x] Convex action: fetch URL content via Jina Reader (server-side)
- [x] Convex action: send content to Claude API with extraction prompt
- [x] Geocode extracted location via Mapbox Geocoding API fallback
- [x] Show editable confirmation card before creating pin
- [x] Map flies to new pin after creation
- [ ] Instagram Reel URLs — deferred

## Milestone 7: Polish & Ship ✓

**Goal:** Make it feel good enough to use daily.

- [x] Loading states and skeletons
- [x] Error boundary
- [x] Toast notifications (Sonner)
- [x] Empty states with helpful CTAs
- [x] Responsive sidebar (hamburger toggle on mobile)
- [x] Keyboard shortcuts with discoverable meta-key hints (⌘N)
- [x] Page titles (dynamic per trip)
- [x] Meta tags + OG image
- [x] Code splitting (lazy-loaded tldraw)
- [x] Linting (oxlint + ESLint)
- [x] Landing page illustration
- [x] Favicon
- [ ] Final production deploy and smoke test with both users

### Bonus: Mood Board (tldraw) ✓

- [x] Per-trip freeform canvas using tldraw v4
- [x] Snapshot persistence to Convex (debounced save)
- [x] "Board" tab on trip detail page
- [x] Lazy-loaded to keep bundle lean
- [x] Convex file storage for uploaded images (replaces base64-in-JSON)
- [x] Save indicator (unsaved → spinner → check) in trip header

### Bonus: AI Chat Sidebar ✓

- [x] Collapsible right-hand panel with floating toggle button
- [x] Multiple conversation threads with tab bar (create/delete/switch)
- [x] Streaming responses via Vercel AI SDK v6 + Convex HTTP endpoints
- [x] Agent tools: create trips, add/list/remove pins, read/write scratchpads, navigate to trips
- [x] Tool call display (expandable, like Claude.ai) with input/output
- [x] Markdown rendering in assistant messages (react-markdown + Tailwind typography)
- [x] Auto-titling threads via Haiku after first exchange
- [x] Client-side navigation when agent uses navigateToTrip tool
- [x] Clerk JWT auth for HTTP streaming endpoint
- [x] Message persistence to Convex (survives page reload)

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
    __root.tsx          # layout shell + chat sidebar integration
    index.tsx           # redirect to /trips
    trips/
      index.tsx         # trip list
      $tripId.tsx       # trip detail (map + scratchpad + pins)
  components/
    chat/               # AI chat sidebar (sidebar, tabs, messages, input, tool display)
    trip-list/          # trip cards, create dialog, dnd
    trip-detail/        # map, pin panel, scratchpad
    moodboard/          # tldraw canvas with Convex asset storage
    presence/           # cursor overlays, avatars
    ingestion/          # URL input, confirmation dialog
    save-indicator.tsx  # save state context + indicator component
  lib/
    chat.ts             # AI SDK useChat hook with Clerk auth + Convex persistence
    workspace.tsx       # workspace context provider
    liveblocks.tsx      # liveblocks client setup
    hotkeys.tsx         # keyboard shortcut system
convex/
  schema.ts             # database schema
  trips.ts              # trip queries and mutations
  pins.ts               # pin queries and mutations
  scratchpads.ts        # scratchpad queries and mutations
  ingestion.ts          # URL fetch + AI extraction actions
  aiChat.ts             # HTTP streaming endpoint (AI SDK + Anthropic)
  chat.ts               # chat thread/message persistence
  chatTools.ts          # internal wrappers for agent tool calls
  http.ts               # HTTP router for streaming endpoint
  moodboardAssets.ts    # Convex file storage for tldraw images
  auth.config.ts        # Clerk integration
```
