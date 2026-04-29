/** Bottom tab nav geometry. The primary nav surface on mobile. */
export const bottomTabNav = {
  /** Hidden at md+ (desktop nav in Header takes over). */
  hideAt: "md",
  /** Z-index — same layer as the header. */
  zIndex: 30,
  /** Tab cap. UX rule: ≤5 entries on the bottom bar; overflow goes
   *  into a More popover. Five is the iOS / Material guidance ceiling
   *  beyond which icons start losing tappable distinction. */
  maxTabs: 5,
  /** Bottom safe-area inset handled via env(safe-area-inset-bottom)
   *  on the bar's `pb-` token. Exposed here so consumers know we
   *  already account for it. */
  respectsSafeArea: true,
} as const;
