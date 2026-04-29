/** Viewport breakpoints used by every shell component. Mirrors
 *  Tailwind's defaults but locked here so consuming apps don't
 *  silently drift if they tweak their own tailwind.config. The
 *  shell components reference these implicitly via Tailwind's
 *  responsive prefixes (`sm:`, `md:`, etc) — the values exposed
 *  here are for consumer JS that needs to make matchMedia decisions
 *  on the same boundaries.
 *
 *  Edits here should be rare and coordinated across all consumers. */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  /** Below this width, BottomTabNav is the primary nav and the
   *  desktop nav inside Header is hidden. Mirrors the `md:` prefix
   *  used in BottomTabNav's `md:hidden` and Header's `hidden md:flex`. */
  mobileNavBelow: 768,
} as const;

export type BreakpointKey = keyof typeof breakpoints;
