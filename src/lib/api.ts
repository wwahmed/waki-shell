import { noteServerVersion } from "./version";

/** Centralised API client.
 *
 *  Built around the patterns printer-dashboard's `lib/api.ts`
 *  evolved through v0.14.x:
 *
 *  1. **Response type sniffing.** A 5xx page from the upstream proxy
 *     comes back as `text/html`, not JSON. Parsing it as JSON gave
 *     "Unexpected token '<' " errors that buried the real failure.
 *     The client checks the Content-Type header before reading and
 *     surfaces an `ApiError` with the original status when the
 *     response isn't JSON.
 *
 *  2. **401 auto-redirect.** Backends commonly return 401 with a
 *     JSON body like `{ loginUrl: "/auth/google" }` when the
 *     session has expired. The client honours that contract: on a
 *     401 with a `loginUrl`, it stamps the current pathname into
 *     localStorage (so the user lands back where they were after
 *     login) and `window.location.href = loginUrl`. The
 *     localStorage key is configurable per app.
 *
 *  3. **`X-App-Version` feed.** Every response is read for
 *     `X-App-Version` and forwarded to `noteServerVersion()` so the
 *     `useVersionWatcher` hook picks up server bumps without any
 *     extra wiring on the consumer side.
 *
 *  4. **Friendly status messages.** The client maps common HTTP
 *     statuses to short user-facing messages on the `ApiError`'s
 *     `message` field, keeping the original status / code on the
 *     error for programmatic handling.
 *
 *  5. **JSON parse safety.** A truncated response or an empty body
 *     no longer kills the whole call: parse failure becomes a
 *     specific `ApiError` so the caller can tell network blips
 *     apart from bad responses.
 *
 *  Usage:
 *
 *    import { createApiClient } from "waki-shell";
 *
 *    export const api = createApiClient({
 *      baseUrl: "/api",
 *      returnPathStorageKey: "myapp:postLoginReturnPath",
 *    });
 *
 *    const items = await api.get<Item[]>("/items");
 *    await api.post("/items", { name: "..." });
 */

export interface ApiClientOptions {
  /** Base URL prepended to every relative request path. Default "" (no
   *  prefix); typical value is "/api". */
  baseUrl?: string;
  /** localStorage key used to store the path the user was on before a
   *  401 redirect to login. Each app should pick a unique key so
   *  cross-app redirects don't collide. Default "ws:postLoginReturnPath". */
  returnPathStorageKey?: string;
  /** When true, a 401 with a `loginUrl` in the body navigates the
   *  page to that URL after stamping the return path. Default true. */
  autoRedirectOnUnauthorized?: boolean;
  /** Optional default headers merged into every request. */
  defaultHeaders?: Record<string, string>;
  /** Optional fetch override (for tests / Node SSR). Default
   *  `globalThis.fetch`. */
  fetchImpl?: typeof fetch;
}

export type ApiKind =
  | "network"
  | "non_json"
  | "parse"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server"
  | "http";

export class ApiError extends Error {
  status: number;
  kind: ApiKind;
  body: unknown;

  constructor(opts: { message: string; status: number; kind: ApiKind; body?: unknown }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.kind = opts.kind;
    this.body = opts.body;
  }
}

const DEFAULT_RETURN_PATH_KEY = "ws:postLoginReturnPath";

const FRIENDLY_BY_STATUS: Record<number, string> = {
  400: "The request was invalid.",
  401: "You need to sign in again.",
  403: "You do not have access to this.",
  404: "We could not find what you were looking for.",
  408: "The request timed out. Try again.",
  409: "This conflicts with the current state. Refresh and retry.",
  413: "That payload is too large.",
  415: "That content type is not supported.",
  422: "The data was rejected by the server.",
  429: "Too many requests. Slow down and try again.",
  500: "The server hit an error. Try again in a moment.",
  502: "Bad gateway. The upstream is unhappy.",
  503: "The service is temporarily unavailable.",
  504: "The server took too long to respond.",
};

function friendlyMessage(status: number, fallback: string): string {
  return FRIENDLY_BY_STATUS[status] ?? fallback;
}

function kindForStatus(status: number): ApiKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "http";
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  /** Optional JSON body. The client serialises it and sets
   *  `Content-Type: application/json` for you. */
  json?: unknown;
  /** Optional raw body (FormData, Blob, string). Mutually exclusive
   *  with `json`. */
  body?: BodyInit | null;
  /** Optional URL search params, appended to the path. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiClient {
  request: <T = unknown>(method: string, path: string, options?: ApiRequestOptions) => Promise<T>;
  get: <T = unknown>(path: string, options?: ApiRequestOptions) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) => Promise<T>;
  delete: <T = unknown>(path: string, options?: ApiRequestOptions) => Promise<T>;
}

export function createApiClient(opts: ApiClientOptions = {}): ApiClient {
  const baseUrl = opts.baseUrl ?? "";
  const returnPathStorageKey = opts.returnPathStorageKey ?? DEFAULT_RETURN_PATH_KEY;
  const autoRedirect = opts.autoRedirectOnUnauthorized ?? true;
  const defaultHeaders = opts.defaultHeaders ?? {};
  const fetchImpl: typeof fetch =
    opts.fetchImpl ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : (() => {
      throw new ApiError({
        message: "fetch is not available in this environment.",
        status: 0,
        kind: "network",
      });
    }) as typeof fetch);

  function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
    const joined = path.startsWith("http") || baseUrl === ""
      ? path
      : `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    if (!query) return joined;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    if (!qs) return joined;
    return `${joined}${joined.includes("?") ? "&" : "?"}${qs}`;
  }

  async function request<T = unknown>(
    method: string,
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const url = buildUrl(path, options.query);
    const headers = new Headers({ ...defaultHeaders, ...(options.headers as HeadersInit | undefined) });
    let body: BodyInit | null | undefined = options.body;
    if (options.json !== undefined) {
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.json);
    }
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    let res: Response;
    try {
      res = await fetchImpl(url, {
        ...options,
        method,
        headers,
        body,
        credentials: options.credentials ?? "same-origin",
      });
    } catch (err) {
      throw new ApiError({
        message: "Network error. Check your connection and retry.",
        status: 0,
        kind: "network",
        body: err,
      });
    }

    // Forward X-App-Version every time, even on error responses.
    const headerVersion = res.headers.get("X-App-Version");
    if (headerVersion) noteServerVersion(headerVersion);

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    // 401 with a JSON loginUrl: redirect to login.
    if (res.status === 401 && autoRedirect) {
      let loginUrl: string | null = null;
      if (isJson) {
        try {
          const body401 = (await res.clone().json()) as { loginUrl?: string };
          if (typeof body401?.loginUrl === "string" && body401.loginUrl.length > 0) {
            loginUrl = body401.loginUrl;
          }
        } catch {
          // ignore parse errors and fall through
        }
      }
      if (loginUrl) {
        try {
          if (typeof window !== "undefined") {
            const here = window.location.pathname + window.location.search + window.location.hash;
            window.localStorage.setItem(returnPathStorageKey, here);
            window.location.href = loginUrl;
          }
        } catch {
          // continue to throw if we couldn't redirect
        }
      }
      throw new ApiError({
        message: friendlyMessage(401, "Unauthorized."),
        status: 401,
        kind: "unauthorized",
      });
    }

    if (!res.ok) {
      let parsedBody: unknown = undefined;
      let serverMessage: string | undefined;
      if (isJson) {
        try {
          parsedBody = await res.json();
          if (
            parsedBody &&
            typeof parsedBody === "object" &&
            "message" in parsedBody &&
            typeof (parsedBody as { message: unknown }).message === "string"
          ) {
            serverMessage = (parsedBody as { message: string }).message;
          }
        } catch {
          // fall through; handled below
        }
      } else {
        // HTML-from-proxy etc; keep body for diagnostics but don't
        // try to parse.
        try {
          parsedBody = await res.text();
        } catch {
          // ignore
        }
        throw new ApiError({
          message: friendlyMessage(res.status, "Unexpected response from server."),
          status: res.status,
          kind: "non_json",
          body: parsedBody,
        });
      }
      throw new ApiError({
        message: serverMessage ?? friendlyMessage(res.status, `Request failed (${res.status}).`),
        status: res.status,
        kind: kindForStatus(res.status),
        body: parsedBody,
      });
    }

    // 204 / empty body
    if (res.status === 204) return undefined as T;
    if (!isJson) {
      // 2xx but not JSON: return text-as-T to be safe.
      try {
        return (await res.text()) as unknown as T;
      } catch (err) {
        throw new ApiError({
          message: "Could not read response body.",
          status: res.status,
          kind: "parse",
          body: err,
        });
      }
    }

    try {
      const parsed = (await res.json()) as T;
      return parsed;
    } catch (err) {
      throw new ApiError({
        message: "The server returned a malformed response.",
        status: res.status,
        kind: "parse",
        body: err,
      });
    }
  }

  return {
    request,
    get: <T = unknown>(path: string, options?: ApiRequestOptions) =>
      request<T>("GET", path, options),
    post: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>("POST", path, { ...(options ?? {}), json: body }),
    put: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>("PUT", path, { ...(options ?? {}), json: body }),
    patch: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
      request<T>("PATCH", path, { ...(options ?? {}), json: body }),
    delete: <T = unknown>(path: string, options?: ApiRequestOptions) =>
      request<T>("DELETE", path, options),
  };
}

/** Read and clear the post-login return path. Call this from the
 *  consumer's auth-callback page to bounce the user back to wherever
 *  they were before the 401 redirect. */
export function consumePostLoginReturnPath(
  storageKey: string = DEFAULT_RETURN_PATH_KEY
): string | null {
  try {
    if (typeof window === "undefined") return null;
    const path = window.localStorage.getItem(storageKey);
    if (!path) return null;
    window.localStorage.removeItem(storageKey);
    return path;
  } catch {
    return null;
  }
}

/* Example:
 *
 * // src/lib/api.ts (consumer)
 * import { createApiClient } from "waki-shell";
 *
 * export const api = createApiClient({
 *   baseUrl: "/api",
 *   returnPathStorageKey: "brain:postLoginReturnPath",
 * });
 *
 * // anywhere
 * try {
 *   const captures = await api.get<Capture[]>("/captures", { query: { limit: 20 } });
 * } catch (err) {
 *   if (err instanceof ApiError && err.kind === "rate_limited") { ... }
 * }
 */
