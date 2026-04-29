# waki-shell

Shared shell scaffolding for Waqas's apps. Component scaffolds (Header, BottomTabNav, Splash, UpdateBanner, UserMenu, EmptyState, LoadingSkeleton, ErrorState, AppShell, Sidebar) plus a versioned JSON config bundle published at `dist/shell.json`. Sibling repo to [waki-themes](https://github.com/wwahmed/waki-themes).

| | |
|---|---|
| Repo | https://github.com/wwahmed/waki-shell (private) |
| Local | `~/workspaces/waki-shell/` |
| Tech | TypeScript + React (no bundler — components ship as `.tsx` source for consumers to copy or import directly) |
| Published config | `dist/shell.json` (committed to `main`). Consumed via backend proxy while the repo is private; once public, fetchable directly at `https://raw.githubusercontent.com/wwahmed/waki-shell/main/dist/shell.json`. |
| Consumers | [printer-dashboard](https://github.com/wwahmed/printer-dashboard), [waki-brain](https://github.com/wwahmed/waki-brain) |

## What's in here

```
waki-shell/
  src/
    components/         # React component scaffolds (.tsx source, no build step)
      AppShell.tsx
      Header.tsx
      BottomTabNav.tsx
      Sidebar.tsx
      Splash.tsx
      UpdateBanner.tsx
      UserMenu.tsx
      EmptyState.tsx
      LoadingSkeleton.tsx
      ErrorState.tsx
    config/             # layer-1 runtime config (gets serialised into dist/shell.json)
      breakpoints.ts
      header.ts
      bottomTabNav.ts
      sidebar.ts
      splash.ts
      updateBanner.ts
      animations.ts
      tapTargets.ts
      states.ts
    index.ts            # barrel export
  scripts/
    build-shell-json.ts # builds dist/shell.json from src/config/*
  dist/
    shell.json          # generated; checked in for raw.githubusercontent consumption
  .github/workflows/
    publish.yml         # auto-rebuilds dist/shell.json on push to main
  CHANGELOG.md
```

## How it's consumed (v1)

Two consumption modes:

1. **Component scaffolds** are React `.tsx` source files. Consuming apps copy them into their own `frontend/src/components/shell/` directory once and customise as needed. v1 is a manual `cp` workflow; an automated `sync-into-app.ts` CLI is a follow-up. The components are intentionally app-agnostic: every app-specific bit (logo, wordmark, nav entries, theme picker, attention badges) is a prop or render slot, so the same component file works across apps.

2. **Runtime config** lives in `dist/shell.json`. Consuming apps fetch it on boot, cache it locally, and apply the latest values (tap-target minimum, splash timing, animation tokens, etc.) without rebuilding. Mirrors the [waki-themes](https://github.com/wwahmed/waki-themes) `dist/themes.json` pattern.

   While the repo is private, consumers proxy the file through their own backend — same shape that waki-brain already uses for `dist/themes.json` (`GET /api/themes/bundle` → reads `~/workspaces/waki-themes/dist/themes.json` off disk). Once the repo goes public, consumers can fetch `https://raw.githubusercontent.com/wwahmed/waki-shell/main/dist/shell.json` directly.

## Components

Every component is built so the consuming app supplies its own:
- icons (Lucide-style components passed via props — the shell doesn't ship an icon library)
- branding (logo + wordmark via render slots)
- nav structure (tab entries, link targets, active-state styling)
- side-effect handlers (refresh routine, sign-out URL, version watcher)

Defaults match [printer-dashboard](https://github.com/wwahmed/printer-dashboard) v0.15.1 since the components are extracted from there. See each component's JSDoc header for the API.

## Layer-1 config

Each `src/config/*.ts` exports a typed object that gets merged into `dist/shell.json` under `config.<key>`. Edits propagate to consumers within their next `shell.json` poll (typically minutes, not deploys).

Currently shipping:

| Key | Purpose |
|---|---|
| `breakpoints` | sm / md / lg / xl + the mobile-nav threshold |
| `header` | h-14 height, z-30, padding tokens |
| `bottomTabNav` | hide-at-md, max 5 tabs, safe-area inset |
| `sidebar` | width / hide-below tokens (unused by printer-dashboard for now) |
| `splash` | min-display 700ms, 4s hard timeout, 280ms fade |
| `updateBanner` | 30s idle auto-refresh, 60s post-refresh cooldown, 60s poll, z-55 |
| `animations` | keyframe + class names + durations + reduced-motion opt-out |
| `tapTargets` | 44px minimum + 28px default icon size |
| `states` | three-state-rule reference (loading / empty / error / success) |

## Building locally

```bash
cd ~/workspaces/waki-shell
npm install
npm run build       # writes dist/shell.json
npm run typecheck   # tsc --noEmit
```

## Auto-publishing

`.github/workflows/publish.yml` re-runs `npm run build` on every push to `main` whose changes touch `src/config/**`, `package.json`, or `scripts/build-shell-json.ts`. If `dist/shell.json` actually changed, the workflow commits the regenerated file back to `main` with `[skip ci]` to prevent recursion.

**No secret setup required.** The workflow uses the built-in `GITHUB_TOKEN` with `permissions: contents: write`. No Personal Access Token needed in repo Settings → Secrets.

Limitation: built-in `GITHUB_TOKEN` commits do not trigger downstream workflows. If we ever wire a sibling repo's CI to react to a `shell.json` publish (e.g. printer-dashboard rebuilds when the shell config changes), we'll switch to a PAT then. For v1 there's no downstream automation, so this is fine.

## Versioning

Bumps follow semver — patch for bug fixes, minor for new components or new config keys, major for breaking shape changes to existing config keys. The version, git short SHA, and build timestamp are all stamped into `dist/shell.json` so consumers can log what they're applying.

## Cross-repo

- Sibling design-system repo: [waki-themes](https://github.com/wwahmed/waki-themes) (CSS theme bundle).
- Reference consumer: [printer-dashboard](https://github.com/wwahmed/printer-dashboard) — components were extracted from there.
- Pending consumer: [waki-brain](https://github.com/wwahmed/waki-brain) — adopts the components after v1.
- Project brief in the homelab context: `~/workspaces/waki-homelab/projects/waki-shell.md`.
