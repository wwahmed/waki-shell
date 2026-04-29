import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Accessible tooltip. Wraps a single trigger element; on hover or
 *  focus (desktop) and long-press (mobile) it pops a small floating
 *  label.
 *
 *  Behaviour:
 *  - Hover delay: 150 ms by default so a passing cursor doesn't
 *    flicker the tooltip.
 *  - Long-press delay: 500 ms on touch devices, dismissed on
 *    pointerup / pointercancel.
 *  - Position: tries the requested `side` first; if it would overflow
 *    the viewport, flips to the opposite side. Horizontally clamps
 *    to keep within 8px of the viewport edges.
 *  - Closes on Escape, blur, or pointerleave.
 *  - Wires up `aria-describedby` on the trigger so screen readers
 *    announce the tooltip alongside the element's own label.
 *
 *  Children must be a single React element. The tooltip clones it
 *  to attach pointer / focus handlers and the aria id without
 *  introducing an extra wrapper that would break flex / grid
 *  layouts.
 */

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Tooltip content. Plain string is the common case but any
   *  ReactNode works. */
  content: ReactNode;
  /** The trigger. Should be a single focusable element. */
  children: ReactNode;
  /** Preferred side. Auto-flips to the opposite side if the
   *  preferred side would overflow the viewport. Default "top". */
  side?: TooltipSide;
  /** Hover delay in ms before opening. Default 150 ms. */
  openDelay?: number;
  /** Long-press delay (touch only). Default 500 ms. */
  longPressDelay?: number;
  /** Force the tooltip closed (e.g. while a modal is over the
   *  trigger). */
  disabled?: boolean;
  /** Extra className on the floating label. */
  className?: string;
}

const VIEWPORT_PAD = 8;
const GAP = 8;

export function Tooltip({
  content,
  children,
  side = "top",
  openDelay = 150,
  longPressDelay = 500,
  disabled = false,
  className = "",
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placedSide: TooltipSide }>({
    top: 0,
    left: 0,
    placedSide: side,
  });
  const tooltipId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;
    const tRect = trigger.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const fits = (s: TooltipSide) => {
      switch (s) {
        case "top":
          return tRect.top - GAP - tipRect.height >= VIEWPORT_PAD;
        case "bottom":
          return tRect.bottom + GAP + tipRect.height <= vh - VIEWPORT_PAD;
        case "left":
          return tRect.left - GAP - tipRect.width >= VIEWPORT_PAD;
        case "right":
          return tRect.right + GAP + tipRect.width <= vw - VIEWPORT_PAD;
      }
    };

    const opposite: Record<TooltipSide, TooltipSide> = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };

    const placed = fits(side) ? side : fits(opposite[side]) ? opposite[side] : side;

    let top = 0;
    let left = 0;
    if (placed === "top") {
      top = tRect.top - GAP - tipRect.height;
      left = tRect.left + tRect.width / 2 - tipRect.width / 2;
    } else if (placed === "bottom") {
      top = tRect.bottom + GAP;
      left = tRect.left + tRect.width / 2 - tipRect.width / 2;
    } else if (placed === "left") {
      top = tRect.top + tRect.height / 2 - tipRect.height / 2;
      left = tRect.left - GAP - tipRect.width;
    } else {
      top = tRect.top + tRect.height / 2 - tipRect.height / 2;
      left = tRect.right + GAP;
    }

    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tipRect.width - VIEWPORT_PAD));
    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - tipRect.height - VIEWPORT_PAD));

    setPos({ top, left, placedSide: placed });
  }, [open, side, content]);

  if (disabled) return <>{children}</>;

  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), openDelay);
  };

  const scheduleLongPress = () => {
    clearTimers();
    longPressTimer.current = window.setTimeout(() => setOpen(true), longPressDelay);
  };

  const close = () => {
    clearTimers();
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  const trigger = (
    <span
      ref={(node) => {
        triggerRef.current = node;
      }}
      style={{ display: "contents" }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") scheduleOpen();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") close();
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") scheduleLongPress();
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") close();
      }}
      onPointerCancel={close}
      onFocus={scheduleOpen}
      onBlur={close}
      onKeyDown={onKeyDown}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
    </span>
  );

  return (
    <>
      {trigger}
      {open && content !== null && content !== undefined && content !== "" && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          data-side={pos.placedSide}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 70 }}
          className={`pointer-events-none rounded-md px-2 py-1 text-xs font-medium leading-snug bg-slate-900/95 text-white dark:bg-slate-100/95 dark:text-slate-900 backdrop-blur-sm shadow-lg shadow-black/20 max-w-[240px] animate-fadeIn motion-reduce:animate-none ${className}`}
        >
          {content}
        </div>
      )}
    </>
  );
}

/* Example:
 *
 * import { Tooltip } from "waki-shell";
 *
 * <Tooltip content="Open palette" side="bottom">
 *   <button aria-label="Theme palette">
 *     <PaletteIcon />
 *   </button>
 * </Tooltip>
 */
