/** Splash defaults. The minimum-display value matters: too short and
 *  fast launches sub-100 ms flicker; too long and the user perceives
 *  the splash as gating real work. 700 ms is the printer-dashboard
 *  tested sweet spot. */
export const splash = {
  /** Minimum visible time. Even instant probes are held this long. */
  minDurationMs: 700,
  /** Hard ceiling. Splash always clears by this time even if a probe
   *  hangs (we never want a forever-splash pinned to a stuck network
   *  call). */
  hardTimeoutMs: 4_000,
  /** Crossfade duration matching the CSS transition the component
   *  uses. */
  fadeOutMs: 280,
  /** z-index — above everything except OS-level dialogs. */
  zIndex: 100,
} as const;
