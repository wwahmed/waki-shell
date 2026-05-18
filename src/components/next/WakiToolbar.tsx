import type { ReactNode } from "react";

export interface WakiToolbarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  sticky?: boolean;
  className?: string;
}

/** Reusable shell toolbar/header strip. Apps supply brand, actions,
 *  and route controls; waki-themes supplies the material treatment. */
export function WakiToolbar({
  title,
  subtitle,
  leading,
  actions,
  meta,
  sticky = false,
  className = "",
}: WakiToolbarProps) {
  return (
    <header
      className={`glass-bar ${sticky ? "sticky top-0 z-40" : ""} flex min-h-14 items-center gap-3 px-3 py-2 ${className}`}
    >
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}
      <div className="min-w-0 flex-1">
        {title && <div className="theme-title truncate text-sm font-extrabold leading-tight">{title}</div>}
        {subtitle && <div className="truncate text-xs opacity-65">{subtitle}</div>}
      </div>
      {meta && <div className="hidden items-center gap-2 text-xs opacity-70 md:flex">{meta}</div>}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}
