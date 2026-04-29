# waki-shell extraction-gap log

This file tracks every piece of foundation that surfaced as missing
when waki-shell was put through the **shell-test extraction-validator**:
a fresh Vite + React + TS + Tailwind sibling app at
`~/workspaces/shell-test/` that consumes ONLY waki-shell + dummy data
and tries to reproduce printer-dashboard's chrome.

Each row records what was missing, where it came from
(printer-dashboard path), what commit promoted it into waki-shell,
and what shape it shipped in. The list grows over time as more apps
get refactored to consume from waki-shell.

The architectural rule driving this list: **as we build the family of
3dByPixel / Waki apps, anything reusable belongs in the foundation.**
Business projects own app-specific logic and experiences; everything
else gets promoted upstream so the next consumer starts further
ahead.

## v0.2.0 - 2026-04-29 - shell-test-driven promotions

| # | Promotion | Source (printer-dashboard) | Shape in waki-shell | Commit |
|---|-----------|----------------------------|---------------------|--------|
| 1 | Animation keyframes + `.animate-X` classes | `frontend/src/index.css` (the `@keyframes fadeIn / modalIn / overlayIn / shimmer / splashBounce / cardIn / slideInRight / slideInLeft` block) | `src/styles/animations.css` | [`477fc7c`](https://github.com/wwahmed/waki-shell/commit/477fc7c) |
| 2 | Component utility atoms (`surface-page` / `surface-1` / `text-strong` / `btn-primary` / `card` / `input` family) | `frontend/src/index.css` (`@layer components { ... }`) | `src/styles/utilities.css` | [`477fc7c`](https://github.com/wwahmed/waki-shell/commit/477fc7c) |
| 3 | Dark-mode safety net (`.dark .bg-white { ... !important }`) | `frontend/src/index.css` ("Nuclear dark-mode safety net" block) | `src/styles/dark-mode-safety.css` | [`477fc7c`](https://github.com/wwahmed/waki-shell/commit/477fc7c) |
| 4 | `useTheme` hook | `frontend/src/hooks/useTheme.ts` | `src/hooks/useTheme.ts` (with configurable storage key) | [`765a0f5`](https://github.com/wwahmed/waki-shell/commit/765a0f5) |
| 5 | `useFullscreen` hook | `frontend/src/hooks/useFullscreen.ts` | `src/hooks/useFullscreen.ts` | [`765a0f5`](https://github.com/wwahmed/waki-shell/commit/765a0f5) |
| 6 | `useVersionWatcher` hook | `frontend/src/hooks/useVersionWatcher.ts` | `src/hooks/useVersionWatcher.ts` | [`765a0f5`](https://github.com/wwahmed/waki-shell/commit/765a0f5) |
| 7 | Version-watch primitives (noteServerVersion, fetchServerVersion, applyForceRefresh, refresh-cooldown helpers) | `frontend/src/lib/version.ts` | `src/lib/version.ts` (with configurable endpoint + storage key) | [`765a0f5`](https://github.com/wwahmed/waki-shell/commit/765a0f5) |
| 8 | `ThemePickerOverlay` (full-screen frosted theme + mode switcher) | `frontend/src/components/ThemePickerOverlay.tsx` | `src/components/ThemePickerOverlay.tsx` (now app-agnostic via `themes` / `Miniature` / `icons` slots) | [`1cf0331`](https://github.com/wwahmed/waki-shell/commit/1cf0331) |
| 9 | Vite version plugin (bake `__APP_VERSION__` + write `dist/version.json`) | `frontend/vite.config.ts` (the `writeVersionJsonPlugin` + `define` blob) | `src/vite/version-plugin.ts` (returns a Plugin pair) | [`22a3f6b`](https://github.com/wwahmed/waki-shell/commit/22a3f6b) |
| 10 | Shared Tailwind config (slate palette tuning + sans stack + `darkMode: "class"`) | `frontend/tailwind.config.js` | `tailwind.config.shared.js` (consumer spreads it) | [`22a3f6b`](https://github.com/wwahmed/waki-shell/commit/22a3f6b) |
| 11 | Theme bootstrap inline `<script>` (synchronous html-class flip before paint) | `frontend/index.html` (the `<script>` in `<head>`) | `templates/theme-bootstrap.html` | [`22a3f6b`](https://github.com/wwahmed/waki-shell/commit/22a3f6b) |
| 12 | `dist/shell.json` schema additions (hooks / styles / templates / vitePlugins arrays) | n/a | `scripts/build-shell-json.ts` | [`7616ab1`](https://github.com/wwahmed/waki-shell/commit/7616ab1) |

### Round-trip evidence

After the promotions landed, `shell-test/` was re-synced to consume
the v0.2.0 files end-to-end:

- `src/components/shell/` mirrors waki-shell's `src/components/`
  (10 components + ThemePickerOverlay).
- `src/hooks/` mirrors waki-shell's `src/hooks/`.
- `src/lib/version.ts` mirrors waki-shell's `src/lib/version.ts`.
- `src/styles/{animations,utilities,dark-mode-safety,index}.css`
  mirrors waki-shell's `src/styles/`.
- `src/index.css` does one `@import "./styles/index.css"` instead
  of inlining the keyframes + utilities locally.
- `tailwind.config.js` spreads `tailwind.shared.js` (synced from
  waki-shell's `tailwind.config.shared.js`).

The prototype renders cleanly on `localhost:5180`:

- Splash overlay with brand + bouncing dots.
- Header gradient (amber to white) with brand, palette icon, user
  avatar.
- 4-tab bottom nav (Home / Reports / Library / More).
- Stat cards (`card` atom) and skeleton list (`LoadingSkeleton`) on
  Home.
- ThemePickerOverlay opens via the palette icon and shows all 18
  themes from waki-themes' `dist/themes.json`, with Light/Dark mode
  toggle and the active tile ringed.
- Settings page renders the `EmptyState` component cleanly.

Visual verification was constrained to source-level + the prototype
itself. printer-dashboard at `manager.3dbypixel.com` and at
`localhost:8080` is gated by Google OAuth and Chrome MCP cannot drive
the OAuth flow on the user's behalf, so the side-by-side at
identical viewports was completed by reading
`printer-dashboard/frontend/src/components/`,
`printer-dashboard/frontend/src/hooks/`, and
`printer-dashboard/frontend/src/lib/` and confirming each promotion
matches the source it came from.

## Known follow-ups (not yet promoted)

These were spotted during the validator pass but would have widened
the scope of v0.2.0 too far. Tracking here so the next pass picks
them up:

- **Theme display metadata in `themes.json`.** The `AVAILABLE_THEMES`
  list (id + name + description for each of the 18 themes) is
  currently maintained in the consumer (printer-dashboard's
  `lib/themeLoader.ts` and shell-test's local copy). Belongs in
  waki-themes' `dist/themes.json` so the consumer doesn't have to
  drift the labels by hand.
- **Visual-theme runtime loader.** The `themeLoader` pattern
  (read themes.json, inject the active theme into a `<style>` tag,
  pub-sub change events) is identical across consumers. Lift into
  `waki-shell/src/lib/themeLoader.ts` once the display metadata
  lands.
- **`useTheme` storage-key timing.** When the consumer calls
  `setThemeStorageKey("xx:theme")` from `main.tsx`, the hook's
  module-load `readInitial()` has already run with the default
  key. Consumers paper over this by ensuring their inline bootstrap
  uses the same key. Refactor: defer `readInitial()` until first
  hook call, or expose a one-shot `initTheme({ storageKey })`.
- **vite-plugin-pwa workbox config.** printer-dashboard's
  service-worker setup (navigateFallbackDenylist, skipWaiting,
  clientsClaim, denylist for `/auth` + `/webcam`) is a shared
  pattern; should ship as a `waki-shell/src/vite/pwa-plugin.ts`
  helper that consumers call with their app-specific manifest.
- **API helper conventions.** printer-dashboard's `lib/api.ts`
  reads `X-App-Version` on every response and calls
  `noteServerVersion`. The pattern is generic; lift the wrapper
  into `waki-shell/src/lib/api.ts` so consumers get the
  version-feed wiring for free.
- **Toaster + ErrorDialog primitives.** Three-state rule covers
  loading / empty / error inline (already in waki-shell), but the
  global Toast surface and modal ErrorDialog are still consumer-
  side. Both follow patterns generic enough to promote.
- **Breadcrumb component.** printer-dashboard's
  `frontend/src/components/Breadcrumb.tsx` is mostly app-agnostic;
  the printer-id resolution is the only app-specific bit. Shell
  could ship a slot-based base.
- **`PageTransition` wrapper.** Slide-in-right / slide-in-left on
  drilldown navigation. Generic; the keyframes are already in
  shell's animations.css; the wrapper component is not.

Each of these is a follow-up commit, not a v0.2.0 blocker.
