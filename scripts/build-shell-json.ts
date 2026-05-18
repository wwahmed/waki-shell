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
 *     config: { breakpoints, header, bottomTabNav, ... },
 *     // Flat string arrays for v0.2.0 consumers reading the simple list.
 *     components: ["AppShell", "Header", ...],
 *     hooks: [...],
 *     styles: [...],
 *     templates: [...],
 *     vitePlugins: [...],
 *     // Per-export metadata. v0.2.2-shaped consumers can read the
 *     // `addedIn` field to drive "new in this version" UI / docs
 *     // highlights without keeping a parallel changelog parser.
 *     exports: {
 *       components: { [name]: { addedIn: string } },
 *       hooks:      { [name]: { addedIn: string } },
 *       styles:     { [path]: { addedIn: string } },
 *       templates:  { [path]: { addedIn: string } },
 *       vitePlugins:{ [name]: { addedIn: string } }
 *     }
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
import {
  HOSTNAMES,
  DEV_HOSTNAMES,
  INTERNAL_HOSTNAMES,
} from "../src/config/hostnames.ts";

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

interface ExportMeta {
  addedIn: string;
}

const COMPONENTS: Record<string, ExportMeta> = {
  AppShell: { addedIn: "0.1.0" },
  Header: { addedIn: "0.1.0" },
  BottomTabNav: { addedIn: "0.1.0" },
  Sidebar: { addedIn: "0.1.0" },
  Splash: { addedIn: "0.1.0" },
  UpdateBanner: { addedIn: "0.1.0" },
  UserMenu: { addedIn: "0.1.0" },
  EmptyState: { addedIn: "0.1.0" },
  LoadingSkeleton: { addedIn: "0.1.0" },
  ErrorState: { addedIn: "0.1.0" },
  ThemePickerOverlay: { addedIn: "0.2.0" },
  LookSwitcher: { addedIn: "0.3.1" },
  WakiShellFrame: { addedIn: "0.4.0" },
  WakiSurface: { addedIn: "0.4.0" },
  WakiToolbar: { addedIn: "0.4.0" },
  Modal: { addedIn: "0.2.2" },
  Spinner: { addedIn: "0.2.2" },
  Badge: { addedIn: "0.2.2" },
  Tooltip: { addedIn: "0.2.2" },
  Breadcrumb: { addedIn: "0.2.2" },
  PageTransition: { addedIn: "0.2.2" },
  Toaster: { addedIn: "0.2.2" },
  ErrorDialog: { addedIn: "0.2.2" },
};

const COMPONENT_FAMILIES = {
  legacy: {
    name: "Legacy Shell",
    description: "Original extracted app shell components kept for existing consumers.",
    introducedIn: "0.1.0",
    components: [
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
    ],
  },
  primitives: {
    name: "Shell Primitives",
    description: "Reusable modal, toast, badge, tooltip, breadcrumb, state, and transition pieces.",
    introducedIn: "0.2.2",
    components: [
      "Modal",
      "Spinner",
      "Badge",
      "Tooltip",
      "Breadcrumb",
      "PageTransition",
      "Toaster",
      "ErrorDialog",
    ],
  },
  material: {
    name: "Waki Material Shell",
    description: "New gradual-adoption shell family designed for waki-themes material families and hue variants.",
    introducedIn: "0.4.0",
    components: [
      "WakiShellFrame",
      "WakiSurface",
      "WakiToolbar",
      "LookSwitcher",
    ],
  },
};

const HOOKS: Record<string, ExportMeta> = {
  useTheme: { addedIn: "0.2.0" },
  useFullscreen: { addedIn: "0.2.0" },
  useVersionWatcher: { addedIn: "0.2.0" },
  useMediaQuery: { addedIn: "0.2.2" },
  useDebounce: { addedIn: "0.2.2" },
  useLocalStorage: { addedIn: "0.2.2" },
  useToast: { addedIn: "0.2.2" },
  useErrorDialog: { addedIn: "0.2.2" },
};

const STYLES: Record<string, ExportMeta> = {
  "styles/animations.css": { addedIn: "0.2.0" },
  "styles/utilities.css": { addedIn: "0.2.0" },
  "styles/dark-mode-safety.css": { addedIn: "0.2.0" },
  "styles/index.css": { addedIn: "0.2.0" },
  "styles/forms.css": { addedIn: "0.2.2" },
};

const TEMPLATES: Record<string, ExportMeta> = {
  "templates/theme-bootstrap.html": { addedIn: "0.2.0" },
};

const VITE_PLUGINS: Record<string, ExportMeta> = {
  versionPlugin: { addedIn: "0.2.0" },
};

const LIBS: Record<string, ExportMeta> = {
  "lib/version": { addedIn: "0.2.0" },
  "lib/api": { addedIn: "0.2.2" },
};

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
  // Backward-compatible flat lists (the v0.2.0 schema). Consumers
  // that read the raw arrays keep working unchanged.
  components: Object.keys(COMPONENTS),
  hooks: Object.keys(HOOKS),
  styles: Object.keys(STYLES),
  templates: Object.keys(TEMPLATES),
  vitePlugins: Object.keys(VITE_PLUGINS),
  componentFamilies: COMPONENT_FAMILIES,
  // v0.2.2 schema addition: per-export metadata keyed by name.
  // Each entry tracks the version that introduced it so consumers
  // can drive "new in this release" docs / changelog views without
  // a side-channel parser.
  exports: {
    components: COMPONENTS,
    hooks: HOOKS,
    styles: STYLES,
    templates: TEMPLATES,
    vitePlugins: VITE_PLUGINS,
    libs: LIBS,
  },
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
console.log(`[waki-shell] version=${payload.version} gitSha=${payload.gitSha} components=${payload.components.length} hooks=${payload.hooks.length}`);

// Sibling artifact: dist/hostnames.json. Standalone so consumers
// (bash deploy scripts, reconcile-domains.sh, jq pipelines) can curl
// the registry directly instead of grepping it out of shell.json.
const hostnamesPayload = {
  version: payload.version,
  gitSha: payload.gitSha,
  builtAt: payload.builtAt,
  schema: 1,
  hostnames: HOSTNAMES,
  devHostnames: DEV_HOSTNAMES,
  internalHostnames: INTERNAL_HOSTNAMES,
};
const hostnamesPath = resolve(distDir, "hostnames.json");
writeFileSync(hostnamesPath, JSON.stringify(hostnamesPayload, null, 2) + "\n", "utf-8");
console.log(`[waki-shell] wrote ${hostnamesPath}`);
console.log(`[waki-shell] hostnames=${hostnamesPayload.hostnames.length} devHostnames=${hostnamesPayload.devHostnames.length}`);
