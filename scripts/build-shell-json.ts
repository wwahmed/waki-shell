/**
 * Build dist/shell.json: the published contract that consuming apps
 * fetch on boot and apply at runtime. Mirrors the waki-themes
 * pattern (`dist/themes.json`).
 *
 * Consumers fetch:
 *   https://raw.githubusercontent.com/wwahmed/waki-shell/main/dist/shell.json
 *
 * The shape:
 *   {
 *     version: "<pkg.version>",
 *     gitSha: "<short-sha-or-unknown>",
 *     builtAt: "<ISO timestamp>",
 *     config: {
 *       breakpoints: {...},
 *       header: {...},
 *       bottomTabNav: {...},
 *       sidebar: {...},
 *       splash: {...},
 *       updateBanner: {...},
 *       animations: {...},
 *       tapTargets: {...},
 *       states: {...}
 *     },
 *     components: ["Header", "BottomTabNav", ...]   // names shipped at this version
 *   }
 *
 * Run: `npm run build` (from waki-shell repo root)
 * Output: `dist/shell.json`
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { breakpoints } from "../src/config/breakpoints.ts";
import { header } from "../src/config/header.ts";
import { bottomTabNav } from "../src/config/bottomTabNav.ts";
import { sidebar } from "../src/config/sidebar.ts";
import { splash } from "../src/config/splash.ts";
import { updateBanner } from "../src/config/updateBanner.ts";
import { animations } from "../src/config/animations.ts";
import { tapTargets } from "../src/config/tapTargets.ts";
import { states } from "../src/config/states.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function gitSha(): string {
  try {
    const out = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1500,
    });
    return out.toString().trim() || "unknown";
  } catch {
    return "unknown";
  }
}

function pkgVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"));
    if (typeof pkg.version === "string") return pkg.version;
  } catch {
    // fall through
  }
  return "0.0.0";
}

const COMPONENTS = [
  "AppShell",
  "Header",
  "BottomTabNav",
  "Sidebar",
  "Splash",
  "UpdateBanner",
  "UserMenu",
  "EmptyState",
  "LoadingSkeleton",
  "ErrorState",
  "ThemePickerOverlay",
];

const HOOKS = ["useTheme", "useFullscreen", "useVersionWatcher"];

const STYLES = [
  "styles/animations.css",
  "styles/utilities.css",
  "styles/dark-mode-safety.css",
  "styles/index.css",
];

const TEMPLATES = ["templates/theme-bootstrap.html"];

const VITE_PLUGINS = ["versionPlugin"];

const payload = {
  version: pkgVersion(),
  gitSha: gitSha(),
  builtAt: new Date().toISOString(),
  config: {
    breakpoints,
    header,
    bottomTabNav,
    sidebar,
    splash,
    updateBanner,
    animations,
    tapTargets,
    states,
  },
  components: COMPONENTS,
  hooks: HOOKS,
  styles: STYLES,
  templates: TEMPLATES,
  vitePlugins: VITE_PLUGINS,
};

const distDir = resolve(repoRoot, "dist");
try {
  mkdirSync(distDir, { recursive: true });
} catch {
  // already exists
}
const outPath = resolve(distDir, "shell.json");
writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");

console.log(`[waki-shell] wrote ${outPath}`);
console.log(`[waki-shell] version=${payload.version} gitSha=${payload.gitSha} components=${COMPONENTS.length}`);
