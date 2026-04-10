Use bun for package management.

## Stack

- **Frontend:** Vite + React + TypeScript + TanStack Router + Tailwind CSS
- **Backend:** Convex (queries, mutations, actions)
- **Auth:** Clerk (magic link sign-in)
- **Real-time presence:** Liveblocks (cursor overlay, avatars)
- **Map:** Mapbox GL JS + mapbox-gl-geocoder
- **Rich text:** Tiptap with markdown toggle
- **Mood board:** tldraw v4 (lazy-loaded)
- **AI ingestion:** Claude API via Convex action (uses Jina Reader for URL fetching)
- **AI chat:** Vercel AI SDK v6 (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`) via Convex HTTP endpoint
- **Toasts:** Sonner
- **Linting:** oxlint + ESLint (`bun run lint`)
- **Full check:** `bun run check` (typecheck + lint — matches CI)
- **Deploy:** Cloudflare Pages

## Workflow

- Run `bun run check` before committing to catch type errors and lint issues locally (same as CI)

## Key patterns

- Conditional Convex queries use `"skip"` as the second arg (not ternary around the hook)
- tiptap `setContent` takes options object: `setContent(html, { emitUpdate: false })`
- Ref assignments happen in `useEffect`, not during render (React hooks/refs rule)
- All `useEffect`/`useCallback` hooks must appear before any early returns

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
