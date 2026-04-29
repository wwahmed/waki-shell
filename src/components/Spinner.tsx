/** Small inline loading spinner for buttons and other tight spaces.
 *
 *  Distinct from `LoadingSkeleton`: skeletons fill page-level
 *  loading regions where the eventual content shape is known and we
 *  want a layout-stable placeholder. `Spinner` is for the "this
 *  action is in flight" indicator inside a button label, a chip,
 *  or a small status row.
 *
 *  Pure CSS via Tailwind's `animate-spin`. Honours
 *  `prefers-reduced-motion` (Tailwind's animate-spin opts into the
 *  motion-reduce variant inheriting from the page-level reset; we
 *  also pin the icon to a still state under motion-reduce).
 */

export type SpinnerSize = "xs" | "sm" | "md" | "lg";
export type SpinnerTone = "current" | "primary" | "muted" | "white";

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Stroke colour family. `current` follows the host text colour
   *  (best inside a coloured button); `primary` uses sky-600. */
  tone?: SpinnerTone;
  /** Optional aria-label. When omitted, the spinner is hidden from
   *  assistive tech (assumes a sibling `aria-live` region speaks). */
  label?: string;
  className?: string;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-[3px]",
};

const TONE_CLASS: Record<SpinnerTone, string> = {
  current: "border-current/30 border-t-current",
  primary: "border-sky-200 border-t-sky-600 dark:border-sky-900 dark:border-t-sky-300",
  muted: "border-slate-200 border-t-slate-500 dark:border-slate-700 dark:border-t-slate-300",
  white: "border-white/30 border-t-white",
};

export function Spinner({
  size = "md",
  tone = "current",
  label,
  className = "",
}: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full animate-spin motion-reduce:animate-none ${SIZE_CLASS[size]} ${TONE_CLASS[tone]} ${className}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/* Example:
 *
 * import { Spinner } from "waki-shell";
 *
 * function SaveButton({ saving }: { saving: boolean }) {
 *   return (
 *     <button className="btn-primary" disabled={saving}>
 *       {saving && <Spinner size="sm" tone="white" />}
 *       {saving ? "Saving..." : "Save"}
 *     </button>
 *   );
 * }
 */
