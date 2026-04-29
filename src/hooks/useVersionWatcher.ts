import { useEffect, useState } from "react";
import {
  fetchServerVersion,
  getBuiltVersion,
  getLastServerVersion,
  isInRefreshCooldown,
  isVersionMismatch,
  refreshCooldownRemainingMs,
  subscribeServerVersion,
} from "../lib/version";

/** Polls the consumer's `/api/version` endpoint on a slow interval AND
 *  subscribes to whatever server-version values its API helper has
 *  already observed via `X-App-Version` header reads. The combination
 *  means an active user picks up a deploy as soon as the next API
 *  call returns; an idle tab parked on a chrome-only view picks it up
 *  at most one poll interval later (60 s default).
 *
 *  Returns the live server version string (when known) and a
 *  `mismatch` flag the UpdateBanner uses to decide when to render.
 *  Originally lived in printer-dashboard's hooks/useVersionWatcher.ts;
 *  promoted in v0.2.0 as the natural pair to UpdateBanner. */
export interface VersionWatcherState {
  serverVersion: string | null;
  builtVersion: string | null;
  mismatch: boolean;
}

const POLL_INTERVAL_MS = 60_000;

export function useVersionWatcher(): VersionWatcherState {
  const [serverVersion, setServerVersion] = useState<string | null>(getLastServerVersion);
  const [cooldownActive, setCooldownActive] = useState<boolean>(isInRefreshCooldown);

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const v = await fetchServerVersion();
      if (cancelled) return;
      if (v?.version) setServerVersion(v.version);
    };

    // First probe runs immediately so the server version is known
    // within the first paint cycle, not after a 60 s delay.
    probe();

    // Re-probe on visibility change as well: the polling timer is
    // throttled in backgrounded tabs, so a phone returning from
    // sleep would otherwise sit on a stale value for up to a minute.
    const onVisible = () => {
      if (document.visibilityState === "visible") probe();
    };
    document.addEventListener("visibilitychange", onVisible);

    const t = window.setInterval(probe, POLL_INTERVAL_MS);

    const unsub = subscribeServerVersion((v) => {
      if (!cancelled) setServerVersion(v);
    });

    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      unsub();
    };
  }, []);

  // Tick every second while the cooldown is active so the banner
  // re-evaluates and unhides the moment the cooldown expires.
  useEffect(() => {
    if (!cooldownActive) return;
    const interval = window.setInterval(() => {
      if (refreshCooldownRemainingMs() <= 0) {
        setCooldownActive(false);
        window.clearInterval(interval);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownActive]);

  const rawMismatch = isVersionMismatch(serverVersion);
  const mismatch = rawMismatch && !cooldownActive;

  return {
    serverVersion,
    builtVersion: getBuiltVersion(),
    mismatch,
  };
}
