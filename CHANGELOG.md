# waki-shell changelog

All notable changes to this repo. Versions follow semver: patch for
bug fixes, minor for new components or new config keys, major for
breaking shape changes to existing config keys.

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
