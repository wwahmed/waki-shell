import type { ReactNode } from "react";

/** Standard empty-state card. The "no items yet" / "nothing here"
 *  pattern. Lifts the three-state rule (loading / empty / error)
 *  into a shared shape so apps don't reinvent the visuals.
 *
 *  New in v1 — printer-dashboard had ad-hoc empty states inline in
 *  each page. Apps can drop in this component to standardise the
 *  treatment. Lucide icon supplied via props so the shell doesn't
 *  ship its own icon dependency. */
export interface EmptyStateProps {
  /** Icon component (Lucide-style: takes className). */
  Icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  /** Optional primary CTA. */
  action?: ReactNode;
  /** Compact variant for inline usage; default is centered with
   *  generous vertical padding. */
  compact?: boolean;
}

export function EmptyState({ Icon, title, message, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-6 px-4" : "py-12 px-6"
      }`}
      role="status"
    >
      {Icon && (
        <div className={`${compact ? "w-10 h-10 mb-3" : "w-14 h-14 mb-4"} rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500`}>
          <Icon className={compact ? "w-5 h-5" : "w-7 h-7"} />
        </div>
      )}
      <div className={`${compact ? "text-sm" : "text-base"} font-semibold text-slate-900 dark:text-slate-100`}>
        {title}
      </div>
      {message && (
        <p className={`${compact ? "text-xs mt-1" : "text-sm mt-1.5"} text-slate-600 dark:text-slate-400 max-w-sm`}>
          {message}
        </p>
      )}
      {action && <div className={compact ? "mt-3" : "mt-5"}>{action}</div>}
    </div>
  );
}
