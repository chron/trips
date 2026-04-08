# Trips — Design Language

A warm, tactile aesthetic that feels like a shared travel journal — not a SaaS dashboard. The map and content are the stars; the UI chrome recedes.

## Principles

- **Warm over clinical.** No pure whites, no pure blacks. Everything has a hint of warmth.
- **Tactile.** Cards feel like layered paper. Pins feel hand-placed. The scratchpad feels like writing in a notebook.
- **Content-forward.** The map bleeds wide. The UI gets out of the way.
- **One mode.** Light only — no dark mode. One cohesive palette.

## Colour Palette

All colours are defined as CSS custom properties via Tailwind's theme system. shadcn/ui's CSS variable approach maps directly to this.

### Core

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAF8F5` | Page background, warm off-white |
| `--foreground` | `#2C2825` | Primary text, warm charcoal |
| `--card` | `#FFFFFF` | Card surfaces, slightly lifted |
| `--card-foreground` | `#2C2825` | Text on cards |
| `--popover` | `#FFFFFF` | Dropdowns, dialogs |
| `--popover-foreground` | `#2C2825` | Text in popovers |
| `--muted` | `#F0EDE8` | Subtle backgrounds, disabled states |
| `--muted-foreground` | `#8A8279` | Secondary text, placeholders |
| `--border` | `#E8E3DC` | Card borders, dividers — warm, not grey |
| `--input` | `#E8E3DC` | Input borders |
| `--ring` | `#C4654A` | Focus rings (uses primary accent) |

### Accent Colours

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#C4654A` | Terracotta — buttons, active states, primary pins |
| `--primary-foreground` | `#FFFAF7` | Text on primary |
| `--secondary` | `#7C9A82` | Sage green — secondary actions, success, nature pins |
| `--secondary-foreground` | `#FAFDF7` | Text on secondary |
| `--accent` | `#E8DDD3` | Warm highlight — hover states, selected cards |
| `--accent-foreground` | `#2C2825` | Text on accent |
| `--destructive` | `#D4483B` | Delete, errors |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |

### Extended Palette (pins, categories, user cursors)

| Name | Value | Usage |
|------|-------|-------|
| `--pin-food` | `#C4654A` | Terracotta — restaurants, cafes, bars |
| `--pin-activity` | `#D4923B` | Amber — things to do |
| `--pin-hotel` | `#5B7FC4` | Dusty blue — accommodation |
| `--pin-landmark` | `#7C9A82` | Sage — sights, landmarks |
| `--pin-transport` | `#8A8279` | Warm grey — airports, stations |
| `--pin-other` | `#A68B7C` | Tan — uncategorised |
| `--cursor-1` | `#C4654A` | Terracotta — first user's cursor |
| `--cursor-2` | `#7C9A82` | Sage — second user's cursor |

## Typography

Two font families, loaded via Google Fonts.

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headings | DM Serif Display | 400 | Trip titles, page headings, the logo. Warm editorial feel. |
| Body | DM Sans | 400, 500, 600 | Everything else. Friendly, legible, pairs naturally with DM Serif. |

```css
/* Tailwind config */
fontFamily: {
  serif: ['"DM Serif Display"', 'Georgia', 'serif'],
  sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
}
```

Headings use `font-serif`. Body, UI, and controls use `font-sans` (set as the default).

### Scale

Use Tailwind's default type scale. Key sizes:

- Page titles: `text-3xl font-serif`
- Section headings: `text-xl font-serif`
- Card titles: `text-lg font-serif`
- Body: `text-sm` (14px — keeps the UI compact)
- Captions/labels: `text-xs text-muted-foreground`

## Spacing & Layout

- **Border radius:** `--radius: 0.625rem` (10px) — slightly more rounded than shadcn default, feels softer
- **Card shadows:** `shadow-sm` with a warm tint — `0 1px 3px rgba(44, 40, 37, 0.06), 0 1px 2px rgba(44, 40, 37, 0.04)`
- **Sidebar:** 280px, warm `--muted` background, trip list lives here
- **Main content:** fills remaining width, map/scratchpad/detail views
- **Generous padding:** `p-6` on main content areas, `p-4` on cards

## Components — shadcn/ui Overrides

shadcn/ui generates components into `src/components/ui/`. These notes capture where we diverge from defaults.

### Buttons

- **Primary:** solid `--primary` background, `--primary-foreground` text. Slightly more rounded (`rounded-lg`).
- **Secondary/outline:** `--border` stroke, `--foreground` text. On hover, fill with `--accent`.
- **Ghost:** no border, text only. On hover, `--accent` background.
- No uppercase. Sentence case labels.

### Cards

- Warm white `--card` background with `--border` stroke.
- The warm shadow defined above.
- On hover (if clickable): subtle lift — `hover:shadow-md transition-shadow`.

### Inputs

- `--input` border, `--background` fill.
- On focus: `--ring` (terracotta) focus ring, 2px offset.
- Rounded to match buttons (`rounded-lg`).

### Dialogs

- Soft backdrop blur (`backdrop-blur-sm`).
- Centered, `rounded-xl`, generous padding.

## Map — Mapbox Style

Use a custom Mapbox style or start from `mapbox://styles/mapbox/light-v11` and adjust:

- Desaturate water to a soft grey-blue
- Warm up land areas toward `--background`
- Mute labels, reduce road prominence
- The map should feel like it belongs in the app's palette, not like an embedded Google Map

### Pin Markers

Custom SVG markers, not default Mapbox pins. Design:

- Rounded pin/teardrop shape, filled with category colour
- Small white icon inside (fork for food, bed for hotel, camera for landmark, etc.)
- Selected state: slightly larger with a `--ring` glow
- Suggested/unconfirmed pins (from URL ingestion): dashed border or reduced opacity

## Scratchpad

- Tiptap editor styled to feel like a notebook
- Slightly warmer background than cards — could use a very subtle paper texture via CSS (`background-image` with a low-opacity noise pattern)
- Comfortable line height (`leading-relaxed`)
- Placeholder text in `--muted-foreground`: "Drop ideas, links, notes…"

## Presence & Collaboration

- **Cursor:** small circle (12px) in user's colour + name label on hover
- **Presence avatars:** small stack in the top-right of the trip view, showing who's currently viewing
- **Collaborative text cursors:** thin vertical line in user's colour within the scratchpad (standard Yjs/Tiptap collab cursor style)

## Motion

Keep it subtle — this isn't a marketing site.

- **Transitions:** 150ms ease for hovers, focus, colour changes
- **Card reorder:** smooth drag animation via dnd-kit (already provides this)
- **Map fly-to:** Mapbox's built-in `flyTo` with moderate duration (~1.5s)
- **Pin drop:** gentle scale-up from 0.8 → 1.0 on creation
- **No page transitions** for now — keep it snappy

## Responsive Behaviour

Desktop-first, but usable on mobile:

- **≥1024px:** sidebar + main content side by side
- **<1024px:** sidebar collapses to a top nav or hamburger menu, main content fills width
- **Map:** always fills available width, min-height 400px on mobile
- **Pin panel:** slides up as a bottom sheet on mobile, side panel on desktop
