/** Hostname registry — single source of truth for every public hostname
 *  that serves one of Waqas's apps.
 *
 *  Why this exists: URLs change. Cloudflare Pages custom-domain
 *  attachments drift. OAuth callback lists fall out of sync. A
 *  silently mis-attached domain has served the wrong app before
 *  (mail.3dbypixel.com served the Memso onboarding wizard for hours
 *  because the custom domain was on the wrong Pages project).
 *
 *  Adding or changing a hostname is a one-line edit here. Every
 *  consumer derives from this registry:
 *    - frontend boot guards (refuse to render the wrong app on the wrong host)
 *    - backend KNOWN_HOSTS + OAuth callback construction + cookie domain
 *    - cross-app navigation (getCounterpartUrl)
 *    - Cloudflare Pages reconcile script (which project should each host be on?)
 *    - deploy smoke checks (does each URL serve the expected app's identity marker?)
 *
 *  Build emits `dist/hostnames.json` so non-TS consumers (bash deploy
 *  scripts, reconcile script, jq pipelines) read from the same data.
 *  Consumer apps either depend on `waki-shell` directly or sync the
 *  JSON via `scripts/sync-hostnames.sh` from this repo's published
 *  `dist/hostnames.json`. */

export type AppKind = "memso" | "mail";
export type Brand = "memso.ai" | "3dbypixel.com";

export interface HostnameEntry {
  /** Browser-facing host. Includes port for dev entries. Lowercase. */
  hostname: string;
  /** Which app this host serves. */
  app: AppKind;
  /** Brand axis (memso.ai vs 3dbypixel.com). null for dev. */
  brand: Brand | null;
  /** Sibling host that serves the OTHER app on the same brand.
   *  Cross-app nav button on this host points here. */
  counterpartHostname: string | null;
  /** Cloudflare Pages project name. `null` for dev. */
  cloudflarePagesProject: string | null;
  /** Origin used to construct OAuth redirect URIs and other absolute
   *  URLs the daemon emits for this host. */
  origin: string;
  /** Cookie scope for the portable session JWT. `null` for dev (the
   *  cookie binds to the literal localhost host). */
  cookieDomain: string | null;
}

/** Production hostnames. EDIT THIS LIST to add or change a URL. */
export const HOSTNAMES: readonly HostnameEntry[] = [
  {
    hostname: "app.memso.ai",
    app: "memso",
    brand: "memso.ai",
    counterpartHostname: "mail.memso.ai",
    cloudflarePagesProject: "memso-app",
    origin: "https://app.memso.ai",
    cookieDomain: ".memso.ai",
  },
  {
    hostname: "mail.memso.ai",
    app: "mail",
    brand: "memso.ai",
    counterpartHostname: "app.memso.ai",
    cloudflarePagesProject: "wakioutlookviewer",
    origin: "https://mail.memso.ai",
    cookieDomain: ".memso.ai",
  },
  {
    hostname: "app.3dbypixel.com",
    app: "memso",
    brand: "3dbypixel.com",
    counterpartHostname: "mail.3dbypixel.com",
    cloudflarePagesProject: "memso-app",
    origin: "https://app.3dbypixel.com",
    cookieDomain: ".3dbypixel.com",
  },
  {
    hostname: "mail.3dbypixel.com",
    app: "mail",
    brand: "3dbypixel.com",
    counterpartHostname: "app.3dbypixel.com",
    cloudflarePagesProject: "wakioutlookviewer",
    origin: "https://mail.3dbypixel.com",
    cookieDomain: ".3dbypixel.com",
  },
] as const;

/** Local-dev hostnames. Vite dev servers, daemon dev ports. */
export const DEV_HOSTNAMES: readonly HostnameEntry[] = [
  {
    hostname: "localhost:5173",
    app: "memso",
    brand: null,
    counterpartHostname: "localhost:5174",
    cloudflarePagesProject: null,
    origin: "http://localhost:5173",
    cookieDomain: null,
  },
  {
    hostname: "localhost:5174",
    app: "mail",
    brand: null,
    counterpartHostname: "localhost:5173",
    cloudflarePagesProject: null,
    origin: "http://localhost:5174",
    cookieDomain: null,
  },
  {
    hostname: "localhost:8190",
    app: "memso",
    brand: null,
    counterpartHostname: "localhost:8290",
    cloudflarePagesProject: null,
    origin: "http://localhost:8190",
    cookieDomain: null,
  },
  {
    hostname: "localhost:8290",
    app: "mail",
    brand: null,
    counterpartHostname: "localhost:8190",
    cloudflarePagesProject: null,
    origin: "http://localhost:8290",
    cookieDomain: null,
  },
] as const;

/** Internal tunnel hostnames that are NOT served to browsers but
 *  may legitimately appear as `Host` headers when traffic arrives
 *  via cloudflared. Whitelisted so the daemon's Host-aware OAuth
 *  redirect logic doesn't blow up — the daemon falls back to the
 *  `X-Forwarded-Host` (which IS a public hostname above). */
export const INTERNAL_HOSTNAMES: readonly string[] = [
  "brain2.3dbypixel.com",
  "waqas.memso.ai",
  "wov.3dbypixel.com",
];

export const ALL_HOSTNAMES: readonly HostnameEntry[] = [
  ...HOSTNAMES,
  ...DEV_HOSTNAMES,
];

/** Lookup the registry entry for a host. Accepts the `Host` header
 *  shape (lowercased, may include port). Returns undefined if the
 *  host is unknown — callers decide whether to fall back, reject,
 *  or hard-redirect. */
export function findHostnameEntry(host: string): HostnameEntry | undefined {
  if (!host) return undefined;
  const h = host.toLowerCase();
  return ALL_HOSTNAMES.find((e) => e.hostname === h);
}

/** Production-only host check, used by deploy / reconcile tooling. */
export function findProdHostnameEntry(host: string): HostnameEntry | undefined {
  if (!host) return undefined;
  const h = host.toLowerCase();
  return HOSTNAMES.find((e) => e.hostname === h);
}

/** All public + dev hostnames as a Set of strings. Replaces the
 *  scattered KNOWN_HOSTS env-string-splitting in each daemon. */
export function knownHostsSet(): Set<string> {
  const s = new Set<string>();
  for (const e of ALL_HOSTNAMES) s.add(e.hostname);
  for (const h of INTERNAL_HOSTNAMES) s.add(h);
  return s;
}

/** Hostnames an app should accept ownership of. The boot guard uses
 *  this to detect "I'm the Memso bundle but I've been served on a
 *  mail.* host" and hard-redirect (or fail). */
export function hostnamesForApp(app: AppKind): HostnameEntry[] {
  return ALL_HOSTNAMES.filter((e) => e.app === app);
}

/** Hostnames attached to a given Cloudflare Pages project. Used by
 *  reconcile-domains.sh to assert the live attachments match. */
export function hostnamesForPagesProject(project: string): HostnameEntry[] {
  return HOSTNAMES.filter((e) => e.cloudflarePagesProject === project);
}

/** All distinct Cloudflare Pages projects in the registry. */
export function allPagesProjects(): string[] {
  const s = new Set<string>();
  for (const e of HOSTNAMES) {
    if (e.cloudflarePagesProject) s.add(e.cloudflarePagesProject);
  }
  return [...s].sort();
}

/** Cookie name used on a given brand. Mirrors the existing
 *  COOKIE_NAMES split in @waki/wov-contract/session-cookie. */
export function sessionCookieNameForBrand(brand: Brand): string {
  return brand === "memso.ai" ? "memso_session" : "memso_session_3dbp";
}

/** Resolve cross-app counterpart for a host. Returns `null` if the
 *  host has no sibling (e.g. an unconfigured custom domain or dev). */
export interface CounterpartResolution {
  currentApp: AppKind;
  counterpartApp: AppKind;
  counterpartHostname: string;
  counterpartUrl: string;
}
export function getCounterpartUrl(host: string): CounterpartResolution | null {
  const entry = findHostnameEntry(host);
  if (!entry || !entry.counterpartHostname) return null;
  const sib = findHostnameEntry(entry.counterpartHostname);
  if (!sib) return null;
  return {
    currentApp: entry.app,
    counterpartApp: sib.app,
    counterpartHostname: sib.hostname,
    counterpartUrl: sib.origin.endsWith("/") ? sib.origin : `${sib.origin}/`,
  };
}

/** Map an app kind to the matching identity marker string. The
 *  boot guard reads `<meta name="waki-app">` from index.html and
 *  compares; the deploy verifier curls each URL and compares. */
export function appIdentityMarker(app: AppKind): string {
  return app;
}
