<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules (BreatheEasy)

- Air quality and weather come from Open-Meteo (`src/lib/aqi.ts`); it is free and keyless, so the same fetcher runs in the browser and in the chat server route.
- All user data (place, family, trips, impact, chat threads) lives in localStorage via `createStore` in `src/lib/store.ts`; it uses `useSyncExternalStore` so SSR renders defaults without hydration mismatches.
- The AI chat streams from `src/routes/api/chat.ts` → `src/lib/chat.server.ts`, which re-fetches live air server-side and injects it plus family profiles into the instructions; keep model calls and the key there.
- Chat threads use real URLs (`/assistant/$threadId`); queued first questions go through sessionStorage and are sent in a deferred effect so StrictMode sends once.
- Business rules are pure functions in `src/lib/*` with one test file per module in `src/test/` (shared fixtures in `src/test/fixtures.ts`); change the tests with the rules, and keep UI files thin so logic stays testable.
- `bun run check` (lint + typecheck + coverage with thresholds in `vitest.config.ts`) is the quality gate and runs in `.github/workflows/ci.yml`; keep it green.
- Clean-air alerts run in the open tab only (`AlertWatcher` in the app shell + browser Notification API); there is no push server, to keep the app free. Trigger rule lives in `src/lib/alerts.ts`.
- Saved places, alert settings and diary entries are localStorage stores in `src/lib/store.ts`; the diary pattern rule is `src/lib/diary.ts`.
- Page files stay thin: big page sections live in `src/components/<page>/` (e.g. `src/components/planner/`), and their numbers come from `src/lib/*` helpers, so files stay small and rules stay testable.
- Every server response gets baseline security headers from `src/lib/security-headers.ts` (wired in `src/server.ts`); never add a frame-blocking header, because the editor previews the app in a frame.
- `/api/chat` is public, so `bodySchema` in `src/lib/chat.server.ts` caps request size, text length, roles (no client "system" messages) and value ranges; keep those limits when changing the chat payload.
- Vulnerable transitive packages are pinned through `overrides` in `package.json`; re-run the dependency scan after changing dependencies.
