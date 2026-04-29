import type { ReactNode } from "react";

/** Top-of-screen header. App-agnostic: brand on the left, optional
 *  desktop nav in the centre, optional action slot on the right.
 *
 *  Originally extracted from printer-dashboard's Header.tsx. The
 *  app-specific bits (Maltipoo logo + 3dByPixel wordmark, the
 *  printer-shop nav entries, the theme-picker palette icon, the
 *  shop-attention badge poller) are no longer in here. The consuming
 *  app supplies its own brand element and action slot. The shell's
 *  job is to lock down spacing, height, blur treatment, and the
 *  responsive show/hide logic — not to know about any one app's
 *  features.
 *
 *  Pairs with BottomTabNav for the mobile pattern (top header is
 *  brand-only on small viewports; nav lives in the bottom bar). */
export interface HeaderProps {
  /** Brand element on the left edge. Typically a <Link to="/"> with
   *  a logo + wordmark. */
  brand: ReactNode;
  /** Desktop nav rendered in the centre at md+. Hidden on mobile.
   *  Pass nothing to disable. */
  desktopNav?: ReactNode;
  /** Right-side action slot. Theme picker, account menu, overflow
   *  menu, etc. Lives at every viewport size. */
  actions?: ReactNode;
  /** Hide the header entirely (kiosk / fullscreen mode). When
   *  hidden, returns null so the host layout can collapse the
   *  pt-14 spacer. */
  hidden?: boolean;
  /** Optional className override for the gradient + border treatment.
   *  Defaults to the printer-dashboard amber gradient — override per
   *  app to match its theme. */
  barClassName?: string;
}

const DEFAULT_BAR =
  "glass-bar fixed top-0 left-0 right-0 z-30 h-14 bg-gradient-to-r from-amber-100 via-white to-white dark:from-amber-900/70 dark:via-slate-900 dark:to-slate-900 backdrop-blur border-b border-amber-200/70 dark:border-amber-800/40 px-2 sm:px-3 flex items-center gap-1 sm:gap-2";

export function Header({
  brand,
  desktopNav,
  actions,
  hidden = false,
  barClassName = DEFAULT_BAR,
}: HeaderProps) {
  if (hidden) return null;
  return (
    <header className={barClassName}>
      <div className="flex-shrink-0">{brand}</div>
      {desktopNav && (
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center" aria-label="Primary">
          {desktopNav}
        </nav>
      )}
      {actions && (
        // `ml-auto` always: at md+ the desktopNav's flex-1 already
        // pushes the actions cluster to the right edge, so the auto
        // margin is a no-op there. At mobile the desktopNav is
        // hidden via `hidden md:flex`, so without ml-auto the actions
        // would sit immediately after the brand with empty space on
        // the right — the regression Waqas reported on the v0.2.0
        // sync. The earlier `${desktopNav ? "ml-0" : "ml-auto"}`
        // heuristic was wrong because it couldn't distinguish "nav
        // exists in the DOM" from "nav is currently visible".
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
