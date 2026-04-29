import { useEffect, useState } from "react";

/** Subscribe to a CSS media query. Returns whether the query currently
 *  matches and re-renders the host component every time the match
 *  state flips.
 *
 *  Used everywhere consumers need an `isMobile` / `isDesktop` /
 *  `prefersReducedMotion` runtime check that mirrors what Tailwind is
 *  doing in CSS at the same breakpoint.
 *
 *  SSR-safe: matchMedia is only touched once mounted, so the hook
 *  returns `false` during SSR and re-renders with the real value
 *  after hydration.
 *
 *  Usage:
 *    const isMobile = useMediaQuery("(max-width: 767px)");
 *    const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };
    handler(mql);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
    }
    mql.addListener(handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeListener(handler as (e: MediaQueryListEvent) => void);
  }, [query]);

  return matches;
}

/* Example:
 *
 * import { useMediaQuery } from "waki-shell";
 *
 * function Toolbar() {
 *   const isDesktop = useMediaQuery("(min-width: 768px)");
 *   return isDesktop ? <DesktopToolbar /> : <MobileToolbar />;
 * }
 */
