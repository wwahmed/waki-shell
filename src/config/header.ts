/** Header geometry + treatment defaults. Each consuming app may
 *  override `barClassName` per app, but the structural numbers
 *  (height, z-index, padding) should stay shell-owned so all of
 *  Waqas's apps feel like the same family. */
export const header = {
  /** Fixed header height in Tailwind units (h-14 = 56px). */
  heightTw: "h-14",
  heightPx: 56,
  /** Z-index for the header layer. Above page content but below
   *  modals (z-50+) and the UpdateBanner (z-55). */
  zIndex: 30,
  /** Horizontal padding tokens. */
  paddingX: { mobile: "px-2", desktop: "sm:px-3" },
  /** Default brand cluster gap. */
  brandGap: "gap-2.5",
  /** Action cluster gap. */
  actionsGap: "gap-1 sm:gap-2",
} as const;
