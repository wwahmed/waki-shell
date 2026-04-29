import { useEffect, useRef, useState } from "react";

/** Top-of-screen banner that appears when the running server reports a
 *  build version that differs from the one the bundle was built with.
 *  One tap on Refresh runs a host-supplied force-refresh routine, so
 *  the user picks up the new bundle without having to remember the
 *  old "hard-refresh on your phone" handoff.
 *
 *  Originally extracted from printer-dashboard's UpdateBanner.tsx
 *  (v0.15.1). All app-specific bits (hook to drive the version watch,
 *  refresh routine) are now props so this component is reusable across
 *  apps without code change. The v0.14.4 to v0.15.1 history of bugs
 *  this banner exists to prevent: stale-PWA-after-deploy, banner-loop
 *  on version mismatch, accidental yank-while-user-is-tapping.
 *
 *  Defaults match printer-dashboard's tested values:
 *  - 30 s idle auto-refresh, paused while tab hidden.
 *  - Real interaction (pointerdown / keydown / scroll) resets the
 *    countdown so an active user is never refreshed mid-tap.
 *  - Dismiss X hides for the rest of the session; a further deploy
 *    will pop the banner again because it's tied to the version
 *    watcher's mismatch flag, not a localStorage suppression. */
export interface UpdateBannerProps {
  /** Whether the banner should be visible. Caller derives this from
   *  their version-watcher hook (typically `mismatch && !cooldown`). */
  visible: boolean;
  /** Triggered when the user taps Refresh OR when the idle timer
   *  reaches zero. Should run the SW-unregister + cache-wipe + reload
   *  routine the consuming app already implements. */
  onRefresh: () => void | Promise<void>;
  /** Server-reported version string, surfaced as a tooltip on the
   *  caption. Optional — banner still works without it. */
  serverVersion?: string | null;
  /** Bundle's baked-in version string, surfaced alongside server in
   *  the tooltip. Optional. */
  builtVersion?: string | null;
  /** Idle window before auto-refresh fires. 0 disables auto-refresh
   *  entirely (banner only refreshes on tap). Default 30 s. */
  idleAutoRefreshMs?: number;
  /** Lucide-react icons (or any compatible React component) so the
   *  shell doesn't ship its own icon dependency. Pass `RefreshCw`
   *  and `X` from your app's icon set. */
  RefreshIcon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  CloseIcon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const DEFAULT_IDLE_AUTO_REFRESH_MS = 30_000;

export function UpdateBanner({
  visible,
  onRefresh,
  serverVersion,
  builtVersion,
  idleAutoRefreshMs = DEFAULT_IDLE_AUTO_REFRESH_MS,
  RefreshIcon,
  CloseIcon,
}: UpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const refreshLockRef = useRef(false);

  // Reset dismissed when visibility flips from false to true. A new
  // mismatch (newer deploy) deserves a fresh banner even if the user
  // dismissed the previous one.
  useEffect(() => {
    if (visible) setDismissed(false);
  }, [visible]);

  const showing = visible && !dismissed;

  useEffect(() => {
    if (!showing || idleAutoRefreshMs <= 0) {
      setSecondsLeft(null);
      return;
    }
    let remainingMs = idleAutoRefreshMs;
    setSecondsLeft(Math.ceil(remainingMs / 1000));
    let lastTick = Date.now();
    const tick = () => {
      if (document.visibilityState !== "visible") {
        lastTick = Date.now();
        return;
      }
      const now = Date.now();
      remainingMs -= now - lastTick;
      lastTick = now;
      if (remainingMs <= 0) {
        triggerRefresh();
        return;
      }
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };
    const interval = window.setInterval(tick, 1000);
    const resetCountdown = () => {
      remainingMs = idleAutoRefreshMs;
      lastTick = Date.now();
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "scroll"];
    for (const e of events) document.addEventListener(e, resetCountdown, { passive: true });
    return () => {
      window.clearInterval(interval);
      for (const e of events) document.removeEventListener(e, resetCountdown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showing, idleAutoRefreshMs]);

  const triggerRefresh = async () => {
    if (refreshLockRef.current) return;
    refreshLockRef.current = true;
    setRefreshing(true);
    await onRefresh();
  };

  if (!showing) return null;

  const tooltip =
    serverVersion || builtVersion
      ? `server ${serverVersion ?? "?"} / built ${builtVersion ?? "?"}`
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[55] mx-auto max-w-2xl px-3 pt-2 pointer-events-none"
    >
      <div className="pointer-events-auto rounded-xl border-2 border-sky-400 dark:border-sky-500/70 bg-sky-50 dark:bg-sky-900/70 backdrop-blur-md shadow-lg shadow-sky-300/30 dark:shadow-black/40 px-3 py-2.5 flex items-center gap-3 animate-modalIn motion-reduce:animate-none">
        <div className="w-9 h-9 rounded-full bg-sky-500/20 dark:bg-sky-500/30 flex items-center justify-center flex-shrink-0">
          <RefreshIcon className={`w-4 h-4 text-sky-700 dark:text-sky-200 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-sky-900 dark:text-sky-100 truncate">
            New version available
          </div>
          <div className="text-[11px] text-sky-800 dark:text-sky-200/80 truncate" title={tooltip}>
            {refreshing
              ? "Refreshing…"
              : secondsLeft !== null && secondsLeft > 0
                ? `Auto-refresh in ${secondsLeft}s — tap to refresh now`
                : "Tap to refresh now"}
          </div>
        </div>
        <button
          type="button"
          onClick={triggerRefresh}
          disabled={refreshing}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-sm font-semibold px-3 py-2 transition-colors disabled:opacity-60"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          disabled={refreshing}
          aria-label="Dismiss for now"
          className="flex-shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center text-sky-700 dark:text-sky-200 hover:bg-sky-200/60 dark:hover:bg-sky-700/60 transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
