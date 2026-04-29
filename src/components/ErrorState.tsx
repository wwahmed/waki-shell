import type { ReactNode } from "react";

/** Standard inline error state. The third leg of the three-state rule
 *  (loading / empty / error). Use for "couldn't load this" inline
 *  panels — NOT for fatal action failures, which should still go
 *  through the consuming app's modal ErrorDialog.
 *
 *  New in v1. printer-dashboard had ad-hoc treatments per page; the
 *  shared shape standardises copy + layout + the optional retry
 *  affordance. */
export interface ErrorStateProps {
  /** Lucide-style icon (default supplied by the consumer; no
   *  default in the shell since it doesn't ship icons). */
  Icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  /** Optional retry handler. When supplied, a Try-again button
   *  renders alongside any custom action. */
  onRetry?: () => void;
  /** Optional secondary action (e.g. "Configure path"). */
  action?: ReactNode;
  compact?: boolean;
}

export function ErrorState({
  Icon,
  title,
  message,
  onRetry,
  action,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center text-center rounded-xl border border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 ${
        compact ? "py-4 px-4" : "py-8 px-6"
      }`}
    >
      {Icon && (
        <div className={`${compact ? "w-9 h-9 mb-2" : "w-12 h-12 mb-3"} rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400`}>
          <Icon className={compact ? "w-5 h-5" : "w-6 h-6"} />
        </div>
      )}
      <div className={`${compact ? "text-sm" : "text-base"} font-semibold text-red-900 dark:text-red-100`}>
        {title}
      </div>
      {message && (
        <p className={`${compact ? "text-xs mt-1" : "text-sm mt-1.5"} text-red-800 dark:text-red-200/90 max-w-sm`}>
          {message}
        </p>
      )}
      {(onRetry || action) && (
        <div className={`flex items-center gap-2 ${compact ? "mt-3" : "mt-4"}`}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-sm font-semibold px-3 py-2 transition-colors"
            >
              Try again
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
