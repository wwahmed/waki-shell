/** Version-watch primitives shared by every consumer app.
 *  ----------------------------------------------------------------------------
 *  The shape: each consumer bakes a `__APP_VERSION__` define into its
 *  bundle (see `src/vite/version-plugin.ts`) and exposes a
 *  `/api/version` endpoint that returns the live server version. The
 *  hook (`useVersionWatcher`) compares the two and flips a
 *  `mismatch` flag the UpdateBanner consumes.
 *
 *  Originally lived in printer-dashboard's lib/version.ts. Promoted
 *  here in v0.2.0 since every consumer app needs the same primitives.
 *
 *  The consumer is expected to:
 *    - Call `setBuiltVersion("1.2.3+abc1234")` once at module init
 *      with whatever its Vite plugin baked in.
 *    - Call `noteServerVersion(headerValue)` from its API helper on
 *      every `X-App-Version` header it sees.
 *    - Call `setVersionEndpoint("/api/version")` if the default
 *      doesn't match its backend route.
 *    - Call `setRefreshCooldownStorageKey("myapp:lastRefreshAt")` if
 *      it wants a non-default cooldown key.
 *  All four have working defaults so a basic consumer can skip them. */

let builtVersion: string | null = null;

/** Set the bundle's baked-in version string. Call once at module
 *  init from the consumer (typically `setBuiltVersion(__APP_VERSION__)`). */
export function setBuiltVersion(v: string | null | undefined): void {
  builtVersion = typeof v === "string" && v.length > 0 ? v : null;
}

export function getBuiltVersion(): string | null {
  return builtVersion;
}

let versionEndpoint = "/api/version";

/** Override the version-probe endpoint. Default `/api/version`. */
export function setVersionEndpoint(path: string): void {
  if (typeof path === "string" && path.length > 0) versionEndpoint = path;
}

let refreshCooldownStorageKey = "ws:lastRefreshAt";

/** Override the localStorage key used to stamp the post-refresh
 *  cooldown. Each app should pick a unique key so cross-app
 *  cooldowns don't suppress each other on shared origins. */
export function setRefreshCooldownStorageKey(key: string): void {
  if (typeof key === "string" && key.length > 0) refreshCooldownStorageKey = key;
}

const REFRESH_COOLDOWN_MS = 60_000;

type VersionListener = (v: string | null) => void;
const versionListeners = new Set<VersionListener>();
let lastSeenServerVersion: string | null = null;

/** Publish a server-version observation. The consumer's API helper
 *  calls this with the `X-App-Version` header on every response;
 *  `useVersionWatcher` also calls it from its `/api/version` poll. */
export function noteServerVersion(version: string): void {
  if (!version) return;
  if (version === lastSeenServerVersion) return;
  lastSeenServerVersion = version;
  for (const fn of versionListeners) {
    try {
      fn(version);
    } catch {
      // listener errors don't break dispatch
    }
  }
}

export function getLastServerVersion(): string | null {
  return lastSeenServerVersion;
}

export function subscribeServerVersion(fn: VersionListener): () => void {
  versionListeners.add(fn);
  // Replay the most recent value so a late subscriber doesn't have to
  // wait for the next API call to learn the current server version.
  if (lastSeenServerVersion) {
    try {
      fn(lastSeenServerVersion);
    } catch {
      // ignore
    }
  }
  return () => {
    versionListeners.delete(fn);
  };
}

export interface ServerVersion {
  version: string;
  pkgVersion?: string;
  gitSha?: string;
  buildTime?: string;
}

/** Probe the running server's version. Returns null on any failure
 *  (network, non-2xx, malformed JSON). Callers treat null as "no
 *  signal" and don't act. */
export async function fetchServerVersion(): Promise<ServerVersion | null> {
  try {
    const res = await fetch(versionEndpoint, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    const body = (await res.json()) as Partial<ServerVersion>;
    if (typeof body?.version !== "string") return null;
    return body as ServerVersion;
  } catch {
    return null;
  }
}

/** True when the live server reports a different version than the
 *  bundle the page was loaded with. The "+<sha>" tail is what
 *  catches commits that don't bump package.json. */
export function isVersionMismatch(serverVersion: string | null | undefined): boolean {
  if (!serverVersion || !builtVersion) return false;
  return serverVersion !== builtVersion;
}

export function markRefreshAttempt(): void {
  try {
    localStorage.setItem(refreshCooldownStorageKey, Date.now().toString());
  } catch {
    // localStorage can throw in private mode. The cooldown is a
    // backstop, not the primary defence; losing it doesn't recreate
    // the loop on its own.
  }
}

export function isInRefreshCooldown(): boolean {
  try {
    const raw = localStorage.getItem(refreshCooldownStorageKey);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    const elapsed = Date.now() - ts;
    if (elapsed < 0 || elapsed > REFRESH_COOLDOWN_MS) return false;
    return true;
  } catch {
    return false;
  }
}

export function refreshCooldownRemainingMs(): number {
  try {
    const raw = localStorage.getItem(refreshCooldownStorageKey);
    if (!raw) return 0;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return 0;
    return Math.max(0, REFRESH_COOLDOWN_MS - (Date.now() - ts));
  } catch {
    return 0;
  }
}

/** Hard reload that drops every layer of cache the PWA might have
 *  accumulated:
 *   - service-worker registrations (the precache that's caused every
 *     "you need to hard-refresh on your phone" handoff)
 *   - the Cache Storage API entries the workbox precache lives in
 *   - the page itself, with `location.replace(...)` and a cache-bust
 *     query string
 *
 *  All steps are best-effort: a failure in one shouldn't block the
 *  others. The reload always runs, even if the SW / cache wipes
 *  silently throw, so the user is never left stuck in "Refreshing..." */
export async function applyForceRefresh(): Promise<void> {
  // Stamp the cooldown FIRST so the post-reload watcher has a
  // localStorage entry to read regardless of how the rest goes.
  markRefreshAttempt();
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* ignore */
  }
  // Cache-bust query string so the SPA shell itself bypasses any
  // intermediate proxy / browser disk cache that doesn't honour
  // no-store.
  const url = new URL(window.location.href);
  url.searchParams.set("v", Date.now().toString(36));
  window.location.replace(url.toString());
}
