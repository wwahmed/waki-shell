import type { ReactNode } from "react";

/** Mobile bottom-tab navigation. Pinned to the bottom of the viewport
 *  on phones; hidden at md+ where the desktop nav in the header takes
 *  over. App-agnostic: each tab is a render slot supplied by the
 *  consumer.
 *
 *  Originally extracted from printer-dashboard's Header.tsx mobile
 *  bottom strip (the 5-slot Home / Dashboard / Printers / Shop /
 *  More layout). The shell only owns the bar geometry (height, blur,
 *  safe-area inset, justify-around). Tab content + icons + active-
 *  state styling come from the consumer so the same bar can host any
 *  app's nav. */
export interface BottomTabNavProps {
  /** The tabs themselves. Render whatever Link / button / overflow
   *  trigger the consuming app needs. The shell wraps them in a
   *  flex-row container with safe-area-aware bottom padding. */
  tabs: ReactNode[];
  /** Hide the bar entirely (kiosk / fullscreen mode). */
  hidden?: boolean;
  /** Optional className override for the bar treatment. Defaults to
   *  the printer-dashboard glass strip. */
  barClassName?: string;
}

const DEFAULT_BAR =
  "glass-bar md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-stretch justify-around gap-0.5";

export function BottomTabNav({
  tabs,
  hidden = false,
  barClassName = DEFAULT_BAR,
}: BottomTabNavProps) {
  if (hidden) return null;
  return (
    <nav className={barClassName} aria-label="Primary">
      {tabs.map((tab, i) => (
        <span key={i} className="contents">
          {tab}
        </span>
      ))}
    </nav>
  );
}
