import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

/** waki-shell / Vite version plugin
 *  ----------------------------------------------------------------------------
 *  Bakes a `__APP_VERSION__` define into the bundle and writes
 *  `dist/version.json` at the end of every build. The matching
 *  consumer-side primitives live in `waki-shell/src/lib/version.ts`
 *  — drop both into the same app and the deploy-detection +
 *  UpdateBanner contract works end-to-end.
 *
 *  Originally lived inline in printer-dashboard's vite.config.ts.
 *  Promoted in v0.2.0 since every consuming app needs the same
 *  bake-then-write pair to keep the client and the backend honest
 *  about which build they're talking about.
 *
 *  Version string format: `<pkg.version>+<git-short-sha>`.
 *  - `pkg.version` is read from package.json at the configured root
 *    (default: the directory `vite.config.ts` lives in, walked up
 *    once if a `frontend/`-style monorepo).
 *  - `git-short-sha` honours `APP_GIT_SHA` from the environment
 *    first (handy for CI builds that already export the SHA), then
 *    falls back to `git rev-parse --short HEAD`. */

export interface VersionPluginOptions {
  /** Directory to walk back to when reading `package.json`. Default
   *  walks up one level from `vite.config.ts` (the printer-dashboard
   *  shape: `frontend/vite.config.ts` reads `../package.json`).
   *  Set to `"."` for repos that keep `package.json` next to
   *  `vite.config.ts`. */
  pkgDir?: string;
  /** Output filename inside the build outDir. Default
   *  `"version.json"`. */
  outFilename?: string;
  /** Override the version string entirely (escape hatch for unusual
   *  CI setups). When supplied, `pkgDir` is ignored. */
  version?: string;
}

function readPkgVersion(pkgDir: string): string {
  try {
    const json = JSON.parse(readFileSync(resolve(pkgDir, "package.json"), "utf-8"));
    if (typeof json.version === "string") return json.version;
  } catch {
    /* fall through */
  }
  return "0.0.0";
}

function readGitSha(pkgDir: string): string {
  if (process.env.APP_GIT_SHA && process.env.APP_GIT_SHA.length >= 7) {
    return process.env.APP_GIT_SHA.slice(0, 7);
  }
  try {
    const out = execSync("git rev-parse --short HEAD", {
      cwd: pkgDir,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1500,
    });
    const trimmed = out.toString().trim();
    if (trimmed.length >= 7) return trimmed.slice(0, 7);
  } catch {
    /* fall through */
  }
  return "unknown";
}

/** Returns a plugin pair: (1) a `define` plugin that bakes
 *  `__APP_VERSION__` into the bundle, and (2) a `closeBundle` hook
 *  that writes `dist/version.json` so the backend can reply on
 *  `/api/version` with the same string the client baked.
 *
 *  Returns an array of plugins so the consumer can spread it
 *  directly into their `plugins:` config. */
export function versionPlugin(options: VersionPluginOptions = {}): Plugin[] {
  const pkgDir = options.pkgDir ? resolve(options.pkgDir) : resolve(process.cwd(), "..");
  const pkgVersion = readPkgVersion(pkgDir);
  const gitSha = readGitSha(pkgDir);
  const appVersion = options.version ?? `${pkgVersion}+${gitSha}`;
  const builtAt = new Date().toISOString();
  const outFilename = options.outFilename ?? "version.json";

  const define: Plugin = {
    name: "waki-shell:version-define",
    config() {
      return {
        define: {
          __APP_VERSION__: JSON.stringify(appVersion),
          __BUILD_TIME__: JSON.stringify(builtAt),
        },
      };
    },
  };

  const writeJson: Plugin = {
    name: "waki-shell:version-write",
    apply: "build",
    closeBundle() {
      const distDir = resolve(process.cwd(), "dist");
      try {
        mkdirSync(distDir, { recursive: true });
      } catch {
        /* already exists */
      }
      const payload = {
        version: appVersion,
        pkgVersion,
        gitSha,
        builtAt,
      };
      writeFileSync(
        join(distDir, outFilename),
        JSON.stringify(payload, null, 2) + "\n",
        "utf-8",
      );
    },
  };

  return [define, writeJson];
}
