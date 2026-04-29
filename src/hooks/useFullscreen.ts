import { useCallback, useEffect, useState } from "react";

/** Tracks document fullscreen state and exposes `enter` / `exit` /
 *  `toggle`. Also acquires a screen Wake Lock while fullscreen, so a
 *  tablet mounted as a wall dashboard does not dim or sleep mid-task.
 *
 *  Originally lived in printer-dashboard's hooks/useFullscreen.ts.
 *  Promoted here in v0.2.0 since every kiosk-style consumer hits the
 *  same Wake Lock + visibilitychange dance and the printer-dashboard
 *  copy already tracked the Safari quirks. */
export interface FullscreenApi {
  isFullscreen: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => void;
  /** True when the browser exposes the standard Fullscreen API. iOS
   *  Safari returns false here. Use this to hide a fullscreen toggle
   *  button instead of letting it fail silently. */
  supported: boolean;
}

export function useFullscreen(): FullscreenApi {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Acquire a wake lock while fullscreen, release when leaving.
  useEffect(() => {
    if (!isFullscreen) return;
    let lock: { release?: () => Promise<void> } | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // Wake lock may be denied (low battery, no support) — non-fatal.
      }
    };
    acquire();
    // Re-acquire if the page becomes visible again. Safari drops the
    // lock on tab change, so without this the second time the user
    // tabs away and back the screen would dim again.
    const onVis = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock && typeof lock.release === "function") lock.release().catch(() => {});
    };
  }, [isFullscreen]);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore — Safari on iOS doesn't support standard fullscreen on
      // <body>, only on <video>.
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) exit();
    else enter();
  }, [enter, exit]);

  const supported =
    typeof document !== "undefined" && !!document.documentElement.requestFullscreen;

  return { isFullscreen, enter, exit, toggle, supported };
}
