/** Skeleton shimmer for the loading half of the three-state rule.
 *  Renders one or more grey blocks with the shimmer animation that
 *  printer-dashboard's index.css already defines as `animate-shimmer`.
 *
 *  Apps that consume this need a `shimmer` keyframe + matching class
 *  in their CSS:
 *    @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
 *    .animate-shimmer { animation: shimmer 1600ms ease-in-out infinite; }
 *
 *  v1 ships the most common shapes (line, card, list). Add more as
 *  consuming apps need them. */
export interface LoadingSkeletonProps {
  /** Visual preset. `line` = single text line, `card` = stack
   *  emulating a card body, `list` = repeated lines. Default `line`. */
  variant?: "line" | "card" | "list";
  /** For variant="list", the row count. Default 3. */
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "line", count = 3, className = "" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3 ${className}`}>
        <Bar width="w-1/2" />
        <Bar width="w-full" />
        <Bar width="w-5/6" />
        <Bar width="w-2/3" />
      </div>
    );
  }
  if (variant === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <Bar key={i} width={i === count - 1 ? "w-3/4" : "w-full"} />
        ))}
      </div>
    );
  }
  return <Bar className={className} />;
}

function Bar({ width = "w-full", className = "" }: { width?: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative h-3 rounded ${width} bg-slate-200 dark:bg-slate-700 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}
