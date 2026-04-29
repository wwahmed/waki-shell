import type { ReactNode } from "react";

/** Optional vertical sidebar. Not used by printer-dashboard (which
 *  is mobile-first with a top header + bottom tab bar), but stubbed
 *  here so apps that want a desktop-class sidebar layout can opt in.
 *
 *  v1 is intentionally minimal: a fixed-width column on the left at
 *  md+, hidden on mobile. The consuming app supplies the brand and
 *  the nav body. Persistent / collapsible behaviour is a follow-up
 *  if any consumer actually needs it. */
export interface SidebarProps {
  brand?: ReactNode;
  /** Vertical nav body. Typically a list of <Link> elements. */
  children: ReactNode;
  /** Hide the sidebar (kiosk mode, or apps that don't use it). */
  hidden?: boolean;
  /** Width class. Default `md:w-56`. */
  widthClassName?: string;
}

const DEFAULT_WIDTH = "md:w-56";

export function Sidebar({
  brand,
  children,
  hidden = false,
  widthClassName = DEFAULT_WIDTH,
}: SidebarProps) {
  if (hidden) return null;
  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 ${widthClassName} border-r border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur min-h-screen`}
      aria-label="Primary"
    >
      {brand && <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-700/70">{brand}</div>}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">{children}</nav>
    </aside>
  );
}
