/** The three-state rule: every async surface must render exactly
 *  one of loading / empty / error / success at any given moment.
 *  No silent skeleton-forever, no stale data masquerading as live.
 *
 *  This config is reference-only — the components under
 *  src/components/ don't read from it. It exists so consuming apps
 *  share a vocabulary when they implement their own page-level
 *  state machines. */
export const states = {
  loading: {
    component: "LoadingSkeleton",
    rule: "Render this on first fetch. Never render alongside data — once data arrives, swap completely.",
  },
  empty: {
    component: "EmptyState",
    rule: "Render this when the fetch succeeded but returned zero results. Always offer a primary action so the user knows how to populate the state.",
  },
  error: {
    component: "ErrorState",
    rule: "Render this when the fetch failed. Always include a Try-again affordance unless the failure is permanent (e.g. 404 on a removed entity).",
  },
  success: {
    component: "(your data view)",
    rule: "The default; render when data is available and non-empty. Do not show skeletons or stale data alongside.",
  },
} as const;
