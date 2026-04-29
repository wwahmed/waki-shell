import { useEffect, useState, type ReactNode } from "react";

/** Wraps page content with a smooth transition between routes.
 *
 *  Used by AppShell / a router outlet to give every navigation a
 *  consistent fade + slight slide. Triggered whenever the
 *  `transitionKey` prop changes (typically the current route's
 *  pathname or an idiomatic key derived from it).
 *
 *  Behaviour:
 *  - On `transitionKey` change, the current content fades + slides
 *    out, then the new content fades + slides in.
 *  - Configurable duration (default 200 ms) and direction.
 *    Direction "fade" is the default; "right" / "left" mimic the
 *    drilldown / back gestures common to mobile shells.
 *  - Respects `prefers-reduced-motion`: when the user has reduced
 *    motion enabled, the new content swaps in immediately with no
 *    animation.
 *
 *  This is intentionally a presentation-only wrapper. It does not
 *  manage routing state; the caller passes a key derived from the
 *  router. Pair with react-router's `useLocation()` like:
 *    <PageTransition transitionKey={location.pathname}>...</PageTransition>
 */

export type PageTransitionDirection = "fade" | "right" | "left";

export interface PageTransitionProps {
  children: ReactNode;
  /** Identifier that changes per page. The transition fires
   *  whenever this value changes between renders. */
  transitionKey: string | number;
  /** Animation length in ms. Default 200. */
  durationMs?: number;
  /** Style of transition. Default "fade". */
  direction?: PageTransitionDirection;
  className?: string;
}

const DIR_TO_CLASS: Record<PageTransitionDirection, string> = {
  fade: "animate-fadeIn",
  right: "animate-slideInRight",
  left: "animate-slideInLeft",
};

export function PageTransition({
  children,
  transitionKey,
  durationMs = 200,
  direction = "fade",
  className = "",
}: PageTransitionProps) {
  const [renderedKey, setRenderedKey] = useState(transitionKey);
  const [renderedChildren, setRenderedChildren] = useState<ReactNode>(children);
  const [phase, setPhase] = useState<"idle" | "leaving">("idle");

  useEffect(() => {
    if (transitionKey === renderedKey) {
      setRenderedChildren(children);
      return;
    }
    setPhase("leaving");
    const timer = window.setTimeout(() => {
      setRenderedKey(transitionKey);
      setRenderedChildren(children);
      setPhase("idle");
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [transitionKey, renderedKey, children, durationMs]);

  return (
    <div
      key={renderedKey}
      className={`${phase === "idle" ? DIR_TO_CLASS[direction] : "opacity-0"} motion-reduce:animate-none transition-opacity ${className}`}
      style={{
        animationDuration: `${durationMs}ms`,
        transitionDuration: `${durationMs}ms`,
      }}
    >
      {renderedChildren}
    </div>
  );
}

/* Example:
 *
 * import { useLocation } from "react-router-dom";
 * import { PageTransition } from "waki-shell";
 *
 * function Outlet({ children }: { children: React.ReactNode }) {
 *   const location = useLocation();
 *   return (
 *     <PageTransition transitionKey={location.pathname} direction="right">
 *       {children}
 *     </PageTransition>
 *   );
 * }
 */
