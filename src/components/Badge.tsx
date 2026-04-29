import type { ReactNode } from "react";

/** Status / count / label badge. Used for things like "Beta",
 *  unread-count chips, status pills (Online / Offline), and inline
 *  tags.
 *
 *  Variants line up with the consumer's other treatments:
 *  - `default` / `outline` for neutral labels.
 *  - `primary` for brand-coloured highlights.
 *  - `success` / `warning` / `danger` / `info` for state pills.
 *
 *  Sizes:
 *  - `sm`: 18px-tall pill, text-[10px]. Fits inside dense rows.
 *  - `md`: 22px-tall pill, text-xs. Default; pairs well with body
 *    text.
 */

export type BadgeVariant =
  | "default"
  | "outline"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render with a leading dot indicator (good for status pills). */
  dot?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default:
    "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
  outline:
    "bg-transparent text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-600",
  primary:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  success:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  danger:
    "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  info:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
};

const DOT_CLASS: Record<BadgeVariant, string> = {
  default: "bg-slate-500",
  outline: "bg-slate-500",
  primary: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-indigo-500",
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: "h-[18px] px-1.5 text-[10px] gap-1",
  md: "h-[22px] px-2 text-xs gap-1.5",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold leading-none whitespace-nowrap ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* Example:
 *
 * import { Badge } from "waki-shell";
 *
 * <h1>Capture <Badge variant="primary" size="sm">Beta</Badge></h1>
 * <Badge variant="success" dot>Online</Badge>
 * <Badge variant="danger">3 failures</Badge>
 */
