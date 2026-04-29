import { useEffect, useRef, type ReactNode } from "react";

/** Generic modal primitive. ErrorDialog and the existing
 *  ThemePickerOverlay can both be expressed as specialisations of
 *  this component (ThemePickerOverlay predates Modal so it still
 *  rolls its own scaffolding for now).
 *
 *  The shell owns:
 *  - Frosted-glass backdrop with blur, animated fade-in.
 *  - Esc to close + click-outside to close (both opt-out via props).
 *  - Focus trap: Tab and Shift+Tab cycle within the dialog while
 *    open. Initial focus lands on the first focusable child.
 *  - Restores focus to the previously-focused element on close.
 *  - `aria-modal` + `role="dialog"` plus the `aria-labelledby` /
 *    `aria-describedby` pair when `title` / `description` are
 *    supplied.
 *
 *  The host owns:
 *  - The actual content (header, body, footer) via `children`.
 *  - The `open` boolean and `onClose` callback.
 *
 *  Sizing tiers (`size`):
 *  - "sm": 24rem max-width, used for confirmations.
 *  - "md": 32rem (default), used for most dialogs.
 *  - "lg": 48rem, used for richer forms.
 *  - "xl": 64rem, used for detail viewers.
 *  - "full": full viewport, used for media + theme-picker style
 *    overlays.
 */

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional accessible title rendered inside the dialog header.
   *  When provided, wires up `aria-labelledby` automatically. */
  title?: ReactNode;
  /** Optional supporting text under the title. Wires up
   *  `aria-describedby` when provided. */
  description?: ReactNode;
  /** Whether tapping the backdrop closes the modal. Default true. */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal. Default true. */
  closeOnEscape?: boolean;
  /** Width tier. Default "md". */
  size?: ModalSize;
  /** Optional aria-label override when no visible title is rendered. */
  ariaLabel?: string;
  /** Extra className applied to the dialog panel. */
  className?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "w-full h-full sm:max-w-none sm:rounded-none",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = "md",
  ariaLabel,
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panel).focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const target = previouslyFocused.current;
      if (target && typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    };
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  const labelledBy = title ? titleId.current : undefined;
  const describedBy = description ? descId.current : undefined;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 dark:bg-black/50 backdrop-blur-md backdrop-saturate-150 animate-overlayIn motion-reduce:animate-none"
      onClick={() => {
        if (closeOnBackdrop) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={!labelledBy ? ariaLabel : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`surface-1 w-full ${SIZE_CLASS[size]} sm:rounded-2xl rounded-t-2xl shadow-2xl border border-line-soft outline-none animate-modalIn motion-reduce:animate-none flex flex-col max-h-[90vh] ${className}`}
      >
        {(title || description) && (
          <div className="px-5 py-4 border-b border-line-soft flex-shrink-0">
            {title && (
              <h2
                id={titleId.current}
                className="text-lg font-bold text-strong tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId.current} className="text-sm text-subtle mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* Example:
 *
 * import { useState } from "react";
 * import { Modal } from "waki-shell";
 *
 * function Demo() {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Open</button>
 *       <Modal
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         title="Confirm action"
 *         description="This cannot be undone."
 *         size="sm"
 *       >
 *         <div className="flex justify-end gap-2 mt-4">
 *           <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
 *           <button className="btn-danger" onClick={() => setOpen(false)}>Delete</button>
 *         </div>
 *       </Modal>
 *     </>
 *   );
 * }
 */
