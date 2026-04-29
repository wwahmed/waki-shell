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
  /** Minimum touchable area dimension for any interactive element. */
  minPx: 44,
  /** Equivalent Tailwind class (h-11 / w-11 = 44px). Components
   *  that already adopt the shell pattern use w-11 h-11 buttons
   *  with smaller icons inside. */
  minTw: "h-11 w-11",
  /** Default visual icon size inside a tap target — 28 px (w-7 /
   *  h-7) reads as similar visual weight to the 32 px avatar. */
  iconPx: 28,
  iconTw: "w-7 h-7",
} as const;
