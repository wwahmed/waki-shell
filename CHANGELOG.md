# waki-shell changelog

All notable changes to this repo. Versions follow semver: patch for
bug fixes, minor for new components or new config keys, major for
breaking shape changes to existing config keys.

## v0.2.2 - 2026-04-29 - shadcn-style primitives + global surfaces + API client

Second batch of EXTRACTION-GAPS.md follow-ups. The v0.2.0 round
covered foundation pieces (animations, utilities, version
plumbing); this round fills in the day-to-day primitives every app
in the family ends up reinventing: a toast surface, a modal error
dialog, a generic Modal primitive, plus the small utility set
(Spinner / Badge / Tooltip / Breadcrumb / PageTransition) and a
centralised API client that wires the version watcher in for free.

No existing component, hook, or stylesheet was modified. Worker B
(brain-v2) and Worker P (printer-dashboard) own the existing
files and will promote any fixes upstream concurrently; this
release is purely additive.

### Components

- **Modal** - generic dialog primitive. Glass-themed backdrop,
  focus trap, Esc + click-outside close (both opt-out via props),
  size tiers `sm` / `md` / `lg` / `xl` / `full`. Restores focus to
  the previously focused element on close. ErrorDialog is built on
  top of it; ThemePickerOverlay predates it but could collapse
  onto Modal in a future pass.
- **Spinner** - small inline loading indicator for buttons and
  tight spaces. Sizes `xs` / `sm` / `md` / `lg`, tones `current` /
  `primary` / `muted` / `white`. Honours `prefers-reduced-motion`.
  Distinct from `LoadingSkeleton` (page-level) by intent.
- **Badge** - status / count / label pill. Variants `default` /
  `outline` / `primary` / `success` / `warning` / `danger` /
  `info`, sizes `sm` / `md`, optional leading dot indicator.
- **Tooltip** - accessible floating label. Hover (desktop) and
  long-press (mobile) triggers. Auto-flips to the opposite side
  on viewport overflow and clamps horizontally to stay on-screen.
  Wires up `aria-describedby` on the trigger.
- **Breadcrumb** - generic trail. Truncates middle items on
  mobile, marks the last item with `aria-current="page"`,
  optional router-aware `LinkComponent` slot so apps using
  react-router or similar can swap in `NavLink`.
- **PageTransition** - wraps page content with a fade or slide
  animation between routes. Configurable duration (default
  200 ms) and direction (`fade` / `right` / `left`). Respects
  `prefers-reduced-motion`.
- **Toaster + useToast** - toast notification surface. A `<Toaster>`
  provider near the app root, plus `useToast()` returning
  `{ toast, dismiss, clear }`. Variants `default` / `success` /
  `warning` / `danger` / `info`, hover-pause auto-dismiss timer,
  bottom-right stack on desktop, top-center on mobile, glass
  treatment.
- **ErrorDialog + ErrorDialogProvider + useErrorDialog** - modal
  error dialog for caught exceptions that warrant user attention.
  Title, description, optional error code chip, primary +
  secondary actions. Built on Modal. Provider mounts a single
  dialog and queues subsequent calls so two failures don't open
  two stacked modals.

### Hooks

- **useMediaQuery** - subscribe to a CSS media query and re-render
  on match-state change. SSR-safe (returns `false` during SSR and
  hydrates after mount). Used everywhere consumers need an
  `isMobile` / `prefersReducedMotion` runtime check.
- **useDebounce** - debounce a value over time. Standard helper
  for search-as-you-type / autosave inputs. Default 250 ms delay.
- **useLocalStorage** - typed localStorage hook. Mirrors
  `useState` shape, persists writes, syncs across tabs via the
  `storage` event, SSR-safe, tolerant of broken JSON / private-mode
  failures.

### Library

- **lib/api** - centralised API client. Lifted from
  printer-dashboard's v0.14.5 `lib/api.ts` and generalised:
  - Response type sniffing: HTML 5xx pages no longer crash JSON
    parsing; the client surfaces an `ApiError` with `kind:
    "non_json"` instead.
  - 401 auto-redirect: when the body has a `loginUrl`, the
    client stamps the current path into a configurable
    localStorage key and navigates to login. Pair with
    `consumePostLoginReturnPath()` on the auth-callback page.
  - `X-App-Version` feed: every response is read for the header
    and forwarded to `noteServerVersion()` so the existing
    `useVersionWatcher` picks up server bumps without extra
    wiring.
  - Friendly status messages: `ApiError.message` carries a short
    user-facing string mapped from the HTTP status; the
    raw status / kind / body are kept for programmatic handling.
  - JSON parse safety: malformed JSON becomes a specific
    `kind: "parse"` error rather than killing the whole call.

### Styles

- **styles/forms.css** - shared form-control styling so brain-v2's
  Capture forms and printer-dashboard's Settings forms look
  consistent. Builds on the existing `.input` atom from
  utilities.css with `.textarea`, `.select` (with painted caret),
  `.checkbox`, `.radio`, `.switch` (+ `.switch-thumb`,
  `.switch-on`), validation modifiers (`.input-error` /
  `.input-warning` / `.input-success`), `.input-group` with
  prefix / suffix slots, `.fieldset` + `.fieldset-legend`, and a
  `.field` / `.field-label` / `.field-helper` / `.field-error`
  triplet for the standard label-input-helper layout. Opt-in via
  `@import "waki-shell/styles/forms.css"` after Tailwind's
  component layer (not added to the styles/index.css barrel; it's
  optional).

### `dist/shell.json` schema additions

Backward-compatible. v0.2.0 consumers reading the flat
`components` / `hooks` / `styles` arrays continue to work
unchanged. New in v0.2.2:

- `exports.components: { [name]: { addedIn: string } }` - per
  component metadata keyed by name.
- `exports.hooks: { [name]: { addedIn: string } }`
- `exports.styles: { [path]: { addedIn: string } }`
- `exports.templates: { [path]: { addedIn: string } }`
- `exports.vitePlugins: { [name]: { addedIn: string } }`
- `exports.libs: { [path]: { addedIn: string } }` - new field;
  tracks `lib/version` and the new `lib/api`.

Drives "new in this release" badges in the consumer's about /
help surface without needing a parallel changelog parser.

### Package.json

- `version` bumped to `0.2.2`.
- `exports["./styles/forms.css"]` added so the new stylesheet is
  importable without poking into `src/`.

## v0.2.1 - 2026-04-29 - Header right-alignment regression fix

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
