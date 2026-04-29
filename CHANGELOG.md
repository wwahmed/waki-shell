# waki-shell changelog

All notable changes to this repo. Versions follow semver: patch for
bug fixes, minor for new components or new config keys, major for
breaking shape changes to existing config keys.

## v0.2.1 — 2026-04-29 — Header right-alignment regression fix

`Header.tsx` was placing the actions cluster directly after the
brand on mobile because the `ml-auto` / `ml-0` heuristic keyed off
"is the desktopNav prop supplied" rather than "is the desktopNav
currently visible". Consumers always pass desktopNav (the shell
hides it at `< md`), so the actions wrapper got `ml-0` and the
mobile layout became `[brand][palette][avatar] ............` with
no spacer pushing the icons to the right edge. Pre-extraction
printer-dashboard had `ml-auto md:ml-0` directly on the palette
button, which is what broke during v0.1.0's extraction.

Fix: actions wrapper now uses `ml-auto` unconditionally. At
md+ the desktopNav's `flex-1 justify-center` already pushes
actions to the right edge, so the auto margin is a no-op there.
At mobile, the auto margin is what restores right-alignment.

No API change; consumers re-sync the file and rebuild.

Reported by Waqas via printer-dashboard. Worth checking against
the shell-test prototype too as a regression baseline.

## v0.2.0 — 2026-04-29 — extraction-gap promotions

Surfaced by the shell-test extraction-validator prototype. Side-by-
side parity check against printer-dashboard turned up several
foundation pieces every consumer needs that v0.1.0 left behind in the
consumer tree. v0.2.0 promotes them upstream so a fresh consumer can
mount the full chrome by importing waki-shell alone.

### Components

- **ThemePickerOverlay** — full-screen frosted overlay for switching
  visual theme + light/dark mode. Originally in printer-dashboard.
  Now app-agnostic via `themes` / `Miniature` / `icons` slots.

### Hooks

- **useTheme** — light/dark toggle with localStorage persistence and
  system-preference fallback. Storage key configurable per app via
  `setThemeStorageKey`.
- **useFullscreen** — kiosk-mode helper. Tracks document fullscreen
  state, acquires + re-acquires a screen Wake Lock so wall-mounted
  tablets do not dim mid-task.
- **useVersionWatcher** — polls the consumer's `/api/version`
  endpoint, drives the UpdateBanner's `visible` flag.

### Library

- **lib/version** — version-watch primitives shared by the API
  helper and the watcher hook. Configurable endpoint and cooldown
  storage key. Includes `applyForceRefresh()` for the
  service-worker-and-cache-wipe routine the banner triggers.

### Styles (NEW)

- **styles/animations.css** — keyframes + `.animate-X` classes the
  shell components reference (modalIn / overlayIn / shimmer /
  splashBounce / cardIn / etc.). Drop-in via
  `@import "waki-shell/styles/animations.css"`.
- **styles/utilities.css** — `.surface-page`, `.surface-1`,
  `.text-strong`, `.btn-primary`, `.card`, `.input` family — the
  foundation atoms every consumer composes.
- **styles/dark-mode-safety.css** — the "nuclear" `.dark .bg-white`
  override that closes Tailwind's dark-mode source-order loophole.
- **styles/index.css** — convenience barrel that pulls all three.

### Tooling

- **tailwind.config.shared.js** — slate palette tuning + sans-serif
  stack + `darkMode: "class"`. Spread into a consumer's tailwind
  config so the dark-mode safety net's literal RGB values stay
  aligned with Tailwind's resolved tokens.
- **templates/theme-bootstrap.html** — inline `<script>` snippet for
  the consumer's index.html `<head>` that sets `dark` / `light` on
  `<html>` synchronously before paint, mirroring useTheme's
  precedence rules.
- **vite/version-plugin** — Vite plugin pair that bakes
  `__APP_VERSION__` into the bundle and writes `dist/version.json`
  on `closeBundle`. Pairs with `lib/version` so client and backend
  agree on which build is running.

### `dist/shell.json` schema additions

- `hooks: string[]` — names of hooks shipped at this version.
- `styles: string[]` — relative paths of the bundled stylesheets.
- `templates: string[]` — relative paths of the bundled HTML
  templates (e.g. theme-bootstrap).
- `vitePlugins: string[]` — names of the Vite plugins exported.

The `config` shape is unchanged; pre-v0.2.0 consumers reading only
`config` keep working.

## v0.1.0 — 2026-04-29 — initial scaffold

First public version. Components extracted from
[printer-dashboard](https://github.com/wwahmed/printer-dashboard)
v0.15.1 with app-specific bits (Maltipoo logo, "3dByPixel" wordmark,
the printer-shop nav entries, the theme-picker palette icon, the
shop-attention badge poller) refactored into props and render slots.

### Components

- **AppShell** — convenience layout that composes Header / Sidebar /
  BottomTabNav around an app's main content. Honours kiosk mode.
- **Header** — top-of-screen bar. Brand on the left, optional desktop
  nav in the centre, action slot on the right. Default treatment is
  the printer-dashboard amber gradient; override via `barClassName`.
- **BottomTabNav** — mobile bottom-tab strip. Hidden at md+. Honours
  iOS safe-area inset.
- **Sidebar** — vertical nav at md+ for apps that opt in (printer-
  dashboard does not).
- **Splash** — full-screen launch overlay with brand slot + bootstrap
  probes. 700 ms minimum display, 4 s hard timeout, 280 ms fade.
- **UpdateBanner** — top-of-screen "New version available" pill on
  server / bundle version mismatch. 30 s idle auto-refresh paused
  while tab hidden, real interaction resets the countdown.
- **UserMenu** — tap-the-avatar account menu. Popover on desktop,
  full-width sheet on mobile. User name + email header, danger Sign
  out item. Avatar and icons supplied by host.
- **EmptyState** / **LoadingSkeleton** / **ErrorState** — the three
  legs of the three-state rule. New in v1; printer-dashboard had
  ad-hoc inline treatments per page.

### Config (layer-1 → `dist/shell.json`)

- `breakpoints`, `header`, `bottomTabNav`, `sidebar`, `splash`,
  `updateBanner`, `animations`, `tapTargets`, `states`. See README
  for the per-key purpose.

### Build / publish

- `scripts/build-shell-json.ts` writes `dist/shell.json` with the
  full config bundle, package version, git short SHA, and build
  timestamp.
- `.github/workflows/publish.yml` re-builds on push to `main` whose
  changes touch `src/config/**`, `package.json`, or the build
  script. Commits the regenerated `dist/shell.json` back with
  `[skip ci]`. Uses the built-in `GITHUB_TOKEN` with `contents:
  write` — no PAT setup required.

### Known v1 limitations

- No `sync-into-app.ts` CLI yet. Consumers copy component files
  manually for v1.
- printer-dashboard does not yet consume from waki-shell. The
  refactor is a planned follow-up; the shell components were
  extracted from it in v0.1.0 but the dashboard's in-tree copies
  are unchanged for this version.
- The `.github/workflows/publish.yml` workflow ships ready to run,
  but `dist/shell.json` for v0.1.0 was committed from a local
  build (not the action) since it's the initial seed.
