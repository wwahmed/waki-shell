/** Tap-target minimums. A11y baseline: every interactive element
 *  on a touch surface should be at least the WCAG 2.5.5 minimum.
 *  Apple's HIG says 44 px; Material says 48 dp. We split the
 *  difference and lock to 44 px so visual icons can be smaller (28
 *  px is the printer-dashboard default for header action icons)
 *  while the surrounding tap area is comfortable.
 *
 *  Bumping the minimum here is the example used to verify the
 *  inheritance pipeline end-to-end: change `minPx` from 44 to
 *  48, push, and consuming apps should pick it up within their
 *  next shell.json poll. */
export const tapTargets = {
  /** Minimum touchable area dimension for any interactive element.
   *  Bumped 2026-04-29 from 44 to 48 to match Material's recommendation
   *  for primary actions. The 44 baseline still applies for secondary
   *  surfaces; consumers reading this token should treat it as the
   *  primary minimum. */
  minPx: 48,
  /** Equivalent Tailwind class (h-12 / w-12 = 48px). Components
   *  that already adopt the shell pattern use w-12 h-12 buttons
   *  with smaller icons inside. */
  minTw: "h-12 w-12",
  /** Default visual icon size inside a tap target — 28 px (w-7 /
   *  h-7) reads as similar visual weight to the 32 px avatar. */
  iconPx: 28,
  iconTw: "w-7 h-7",
} as const;
