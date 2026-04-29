import { useEffect, useRef, useState, type ReactNode } from "react";

/** Wraps the app shell so the user never sees the auth-redirect / WS-
 *  reconnect flicker on launch. The splash mounts FIRST, runs a small
 *  set of bootstrap probes in parallel, holds for at least 700 ms even
 *  when the probes finish faster, then crossfades into whatever the
 *  app would have rendered anyway.
 *
 *  Originally extracted from printer-dashboard's Splash.tsx. The
 *  branding (logo + wordmark) is now a `brand` slot so each consuming
 *  app supplies its own. Bootstrap probes are caller-supplied so the
 *  shell doesn't assume any particular auth / version protocol.
 *
 *  Bootstrap probes are intentionally non-blocking: a probe that
 *  fails or times out doesn't gate the splash from clearing. The
 *  splash is a smoothing layer, not a gate — auth redirects, WebSocket
 *  connects, etc. all keep working underneath. We just don't render
 *  them until the splash has had its visible moment. */
export interface SplashProps {
  children: ReactNode;
  /** App-specific branding rendered in the centre of the splash.
   *  Typically a logo + wordmark. */
  brand: ReactNode;
  /** Promises that should settle before the splash clears (subject to
   *  the hard timeout). Failures are swallowed; the splash clears
   *  regardless. Pass an empty array if there's nothing to wait for. */
  bootstrapProbes?: Promise<unknown>[];
  /** Optional callback invoked after probes settle and before the
   *  fade-out begins. Use this to resolve auth state, swap URLs via
   *  history.replaceState, etc. — anything that benefits from
   *  happening while the splash is still covering the screen. */
  onBootstrapSettled?: () => void;
  /** Minimum splash display time. Default 700 ms. Even with instant
   *  probes the splash is held this long so the launch doesn't
   *  sub-100 ms flicker. */
  minDurationMs?: number;
  /** Hard timeout for the bootstrap. Default 4 s. The splash always
   *  clears by this time even if a probe pathologically hangs. */
  hardTimeoutMs?: number;
  /** Background classes for the splash overlay. Default leans on
   *  Tailwind's amber/sky gradient — override per app. */
  backgroundClassName?: string;
}

const DEFAULT_MIN_MS = 700;
const DEFAULT_HARD_TIMEOUT_MS = 4_000;
const DEFAULT_BG =
  "bg-gradient-to-br from-amber-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800";

export function Splash({
  children,
  brand,
  bootstrapProbes = [],
  onBootstrapSettled,
  minDurationMs = DEFAULT_MIN_MS,
  hardTimeoutMs = DEFAULT_HARD_TIMEOUT_MS,
  backgroundClassName = DEFAULT_BG,
}: SplashProps) {
  const [phase, setPhase] = useState<"showing" | "fading" | "gone">("showing");
  const startedAt = useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await Promise.race([
        Promise.allSettled(bootstrapProbes),
        new Promise((r) => setTimeout(r, hardTimeoutMs)),
      ]);
      if (cancelled) return;
      try {
        onBootstrapSettled?.();
      } catch {
        // host callback errors don't block fade-out
      }
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const elapsed = now - startedAt.current;
      const remaining = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("fading");
        window.setTimeout(() => {
          if (!cancelled) setPhase("gone");
        }, 280);
      }, remaining);
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Children mount immediately at opacity 0 so their data fetches
          start in parallel with the splash. Become visible the moment
          the splash fades. */}
      <div
        aria-hidden={phase !== "gone"}
        className={`transition-opacity duration-300 ease-out ${
          phase === "gone" ? "opacity-100" : "opacity-0"
        }`}
        style={phase !== "gone" ? { pointerEvents: "none" } : undefined}
      >
        {children}
      </div>
      {phase !== "gone" && (
        <div
          role="presentation"
          aria-hidden
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300 ease-out ${backgroundClassName} ${
            phase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-5 select-none">
            {brand}
            <SplashDots />
          </div>
        </div>
      )}
    </>
  );
}

/** Three-dot loading indicator with a staggered bounce. Subtle enough
 *  that a quick splash (probes finished, just waiting for the minimum
 *  duration) reads as intentional rather than a glitch.
 *
 *  Requires a `splashBounce` keyframe + `.animate-splashBounce` class
 *  in the consuming app's CSS:
 *    @keyframes splashBounce {
 *      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
 *      40%           { transform: translateY(-6px); opacity: 1; }
 *    }
 *    .animate-splashBounce { animation: splashBounce 1200ms ease-in-out infinite; } */
function SplashDots() {
  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Loading">
      <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-splashBounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-splashBounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-splashBounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
