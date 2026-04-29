import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

/** Toast notification surface.
 *
 *  Pattern: a single `<Toaster>` provider mounted near the root of
 *  the app, plus a `useToast()` hook that returns a `toast()`
 *  function any component can call to enqueue a notification.
 *
 *  Layout:
 *  - Desktop (sm and up): stacked at the bottom-right of the
 *    viewport, max-width 24rem.
 *  - Mobile (below sm): pinned to the top-center, full-width with
 *    safe-area padding.
 *
 *  Behaviour:
 *  - Auto-dismiss after `duration` ms (default 4000). Hovering or
 *    focusing a toast pauses its timer; pointer-leave / blur
 *    resumes.
 *  - Manual dismiss via the close button or `dismiss(id)` from the
 *    hook.
 *  - Variants colour the toast and surface a different default
 *    icon. The host can pass an `Icon` slot per call, otherwise the
 *    Toaster uses its built-in glyphs.
 *
 *  Glass theme: the toast panel uses the same surface tokens as the
 *  rest of the shell (`surface-1`, slate borders, frosted backdrop)
 *  so it sits naturally over any of the visual themes.
 */

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastInput {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Duration in ms before auto-dismiss. 0 disables auto-dismiss
   *  (the toast stays until manually closed). Default 4000. */
  duration?: number;
  /** Optional icon override. */
  Icon?: ComponentType<{ className?: string }>;
  /** Optional action element rendered to the right of the body. */
  action?: ReactNode;
}

export interface ToastRecord extends Required<Omit<ToastInput, "Icon" | "action" | "title" | "description">> {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  Icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

type Action =
  | { type: "add"; toast: ToastRecord }
  | { type: "remove"; id: string }
  | { type: "clear" };

function reducer(state: ToastRecord[], action: Action): ToastRecord[] {
  switch (action.type) {
    case "add":
      return [...state, action.toast];
    case "remove":
      return state.filter((t) => t.id !== action.id);
    case "clear":
      return [];
  }
}

export interface ToasterProps {
  children?: ReactNode;
  /** Maximum number of toasts kept on screen. Excess are dropped
   *  oldest-first. Default 5. */
  max?: number;
}

export function Toaster({ children, max = 5 }: ToasterProps) {
  const [toasts, dispatch] = useReducer(reducer, [] as ToastRecord[]);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const toast = useCallback(
    (input: ToastInput): string => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const record: ToastRecord = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "default",
        duration: input.duration ?? DEFAULT_DURATION,
        Icon: input.Icon,
        action: input.action,
      };
      dispatch({ type: "add", toast: record });
      return id;
    },
    []
  );

  // Trim to max
  useEffect(() => {
    if (toasts.length > max) {
      const overflow = toasts.length - max;
      for (let i = 0; i < overflow; i++) {
        dispatch({ type: "remove", id: toasts[i].id });
      }
    }
  }, [toasts, max]);

  const ctx = useMemo<ToastContextValue>(
    () => ({ toast, dismiss, clear }),
    [toast, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast / useToastContext must be used inside a <Toaster> provider."
    );
  }
  return ctx;
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastRecord[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-0 sm:inset-x-auto sm:top-auto sm:bottom-4 sm:right-4 z-[80] flex flex-col gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:pt-0 sm:items-end sm:max-w-sm"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: "border-line-soft text-strong",
  success: "border-emerald-300/70 dark:border-emerald-600/60 text-emerald-900 dark:text-emerald-100",
  warning: "border-amber-300/70 dark:border-amber-600/60 text-amber-900 dark:text-amber-100",
  danger: "border-red-300/70 dark:border-red-600/60 text-red-900 dark:text-red-100",
  info: "border-sky-300/70 dark:border-sky-600/60 text-sky-900 dark:text-sky-100",
};

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  default: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
  success: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200",
  warning: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200",
  danger: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200",
  info: "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-200",
};

const DEFAULT_GLYPH: Record<ToastVariant, string> = {
  default: "i",
  success: "OK",
  warning: "!",
  danger: "!",
  info: "i",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onDismiss, 180);
  }, [leaving, onDismiss]);

  useEffect(() => {
    if (toast.duration <= 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(requestClose, remainingRef.current);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [toast.duration, requestClose]);

  const pause = () => {
    if (toast.duration <= 0 || timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current)
    );
  };

  const resume = () => {
    if (toast.duration <= 0 || timerRef.current !== null) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(requestClose, remainingRef.current);
  };

  const Icon = toast.Icon;

  return (
    <div
      role="status"
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`pointer-events-auto w-full surface-1 backdrop-blur-md rounded-xl border-2 shadow-lg shadow-black/10 dark:shadow-black/40 px-3 py-2.5 flex items-start gap-3 ${VARIANT_CLASS[toast.variant]} ${leaving ? "opacity-0 translate-y-1 transition-all duration-150" : "animate-toastIn motion-reduce:animate-none"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${VARIANT_ICON_BG[toast.variant]}`}
        aria-hidden="true"
      >
        {Icon ? <Icon className="w-4 h-4" /> : DEFAULT_GLYPH[toast.variant]}
      </div>
      <div className="min-w-0 flex-1">
        {toast.title && (
          <div className="text-sm font-semibold leading-tight truncate">
            {toast.title}
          </div>
        )}
        {toast.description && (
          <div className="text-xs text-subtle leading-snug mt-0.5">
            {toast.description}
          </div>
        )}
        {toast.action && <div className="mt-2">{toast.action}</div>}
      </div>
      <button
        type="button"
        onClick={requestClose}
        aria-label="Dismiss notification"
        className="flex-shrink-0 w-7 h-7 -mr-1 rounded-full inline-flex items-center justify-center text-muted hover:text-strong hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          &times;
        </span>
      </button>
    </div>
  );
}

/* Example:
 *
 * import { Toaster, useToast } from "waki-shell";
 *
 * function App() {
 *   return (
 *     <Toaster>
 *       <Routes />
 *     </Toaster>
 *   );
 * }
 *
 * function SaveButton() {
 *   const { toast } = useToast();
 *   return (
 *     <button onClick={() => toast({ title: "Saved", variant: "success" })}>
 *       Save
 *     </button>
 *   );
 * }
 */
