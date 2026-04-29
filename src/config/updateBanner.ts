/** UpdateBanner defaults. The values here are the ones tested
 *  against the printer-dashboard banner-loop bug — changing them
 *  without thinking through the post-refresh-cooldown interaction
 *  is how that bug came back. */
export const updateBanner = {
  /** Idle window before auto-refresh fires. 0 disables auto-refresh
   *  (banner only refreshes on user tap). */
  idleAutoRefreshMs: 30_000,
  /** Cooldown after a refresh during which the banner stays
   *  suppressed even if the comparison still says mismatch. Defends
   *  against the SW-activation gap that previously looped the
   *  banner. Stored in localStorage as `pd:lastRefreshAt` (printer-
   *  dashboard) — keep the key per-app, the value here is just the
   *  duration. */
  postRefreshCooldownMs: 60_000,
  /** Server poll interval for /api/version. */
  pollIntervalMs: 60_000,
  /** Z-index — above the header (z-30) and the modal overlay (z-50)
   *  so a deploy-during-confirm-dialog is still visible. */
  zIndex: 55,
} as const;
