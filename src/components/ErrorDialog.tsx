import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Modal } from "./Modal";

/** Modal error dialog. Used for caught exceptions that need user
 *  attention beyond a passing toast: failed save, expired session,
 *  destructive action that can't be retried automatically.
 *
 *  Two ways to use:
 *
 *  1. Stand-alone <ErrorDialog open ... /> with the host owning the
 *     open state. Useful for one-off error surfaces.
 *
 *  2. Wrapped via <ErrorDialogProvider>, with the consumer calling
 *     `showError({ ... })` from anywhere in the tree. The provider
 *     mounts a single dialog and queues subsequent calls. This
 *     mirrors the Toaster + useToast pattern.
 *
 *  Behaviour:
 *  - Built on top of the Modal primitive (focus trap, Esc, restore
 *    focus on close).
 *  - Two CTAs: a primary action (default label "OK") and an
 *    optional secondary action ("Dismiss" / "Report"). The primary
 *    action's onClick is invoked first; the dialog then closes
 *    unless the handler returns `false` to keep it open.
 *  - Optional `code` (HTTP status, error class, etc.) rendered as
 *    a monospace chip near the title for quick triage.
 */

export interface ErrorDialogAction {
  label: ReactNode;
  /** Return `false` to suppress auto-close after the handler runs.
   *  Default behaviour is to close the dialog after the handler. */
  onClick?: () => boolean | void | Promise<boolean | void>;
  /** Tone of the button. Default "primary" for the primary CTA,
   *  "secondary" for the secondary CTA. */
  tone?: "primary" | "secondary" | "danger";
}

export interface ErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Short error code shown next to the title (e.g. "HTTP 500", "ENOTFOUND"). */
  code?: string;
  /** Lucide-style alert icon. Optional. When omitted a plain
   *  exclamation glyph is rendered. */
  Icon?: ComponentType<{ className?: string }>;
  primaryAction?: ErrorDialogAction;
  secondaryAction?: ErrorDialogAction;
}

const TONE_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
} as const;

export function ErrorDialog({
  open,
  onClose,
  title = "Something went wrong",
  description,
  code,
  Icon,
  primaryAction,
  secondaryAction,
}: ErrorDialogProps) {
  const handle = async (action?: ErrorDialogAction) => {
    if (!action) {
      onClose();
      return;
    }
    let keepOpen = false;
    if (action.onClick) {
      const result = await action.onClick();
      keepOpen = result === false;
    }
    if (!keepOpen) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      ariaLabel={typeof title === "string" ? title : "Error"}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 inline-flex items-center justify-center font-bold">
          {Icon ? <Icon className="w-5 h-5" /> : <span aria-hidden="true">!</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-strong leading-tight">
              {title}
            </h2>
            {code && (
              <span className="font-mono text-[10px] uppercase tracking-wide rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-1.5 py-0.5">
                {code}
              </span>
            )}
          </div>
          {description && (
            <div className="mt-1.5 text-sm text-subtle break-words">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {secondaryAction && (
          <button
            type="button"
            className={TONE_CLASS[secondaryAction.tone ?? "secondary"]}
            onClick={() => void handle(secondaryAction)}
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          type="button"
          className={TONE_CLASS[primaryAction?.tone ?? "primary"]}
          onClick={() => void handle(primaryAction)}
        >
          {primaryAction?.label ?? "OK"}
        </button>
      </div>
    </Modal>
  );
}

/* ---- Provider + hook ---------------------------------------------------- */

export interface ErrorDialogRequest extends Omit<ErrorDialogProps, "open" | "onClose"> {}

interface ErrorDialogContextValue {
  showError: (req: ErrorDialogRequest) => void;
  dismiss: () => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextValue | null>(null);

export interface ErrorDialogProviderProps {
  children?: ReactNode;
}

export function ErrorDialogProvider({ children }: ErrorDialogProviderProps) {
  const [queue, setQueue] = useState<ErrorDialogRequest[]>([]);

  const showError = useCallback((req: ErrorDialogRequest) => {
    setQueue((q) => [...q, req]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const ctx = useMemo<ErrorDialogContextValue>(
    () => ({ showError, dismiss }),
    [showError, dismiss]
  );

  const current = queue[0];

  return (
    <ErrorDialogContext.Provider value={ctx}>
      {children}
      {current && (
        <ErrorDialog
          {...current}
          open
          onClose={dismiss}
        />
      )}
    </ErrorDialogContext.Provider>
  );
}

export function useErrorDialogContext(): ErrorDialogContextValue {
  const ctx = useContext(ErrorDialogContext);
  if (!ctx) {
    throw new Error(
      "useErrorDialog must be used inside an <ErrorDialogProvider>."
    );
  }
  return ctx;
}

/* Example:
 *
 * import { ErrorDialog } from "waki-shell";
 *
 * function Page() {
 *   const [err, setErr] = useState<Error | null>(null);
 *   return (
 *     <>
 *       ...
 *       <ErrorDialog
 *         open={!!err}
 *         onClose={() => setErr(null)}
 *         title="Could not save"
 *         description={err?.message}
 *         code="HTTP 500"
 *         primaryAction={{ label: "Retry", onClick: retry }}
 *         secondaryAction={{ label: "Dismiss" }}
 *       />
 *     </>
 *   );
 * }
 */
