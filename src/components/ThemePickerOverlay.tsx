import { useEffect, type ComponentType, type ReactNode } from "react";

/** Quick-access visual-theme + light/dark mode switcher. Designed as
 *  a full-screen frosted overlay (not a bottom sheet) so the entire
 *  page underneath blurs out and the picker becomes the focal point.
 *
 *  Originally lived in printer-dashboard's
 *  components/ThemePickerOverlay.tsx. Promoted in v0.2.0 as the
 *  shell-side overlay shape; the consuming app supplies the active-
 *  theme state, the list of available themes, and the per-tile
 *  preview component. The shell only owns the overlay layout +
 *  Esc/backdrop close + light/dark mode toggle behaviour.
 *
 *  The host wires it up roughly like:
 *    <ThemePickerOverlay
 *      open={open}
 *      onClose={() => setOpen(false)}
 *      themes={AVAILABLE_THEMES}
 *      activeThemeId={visualTheme}
 *      onPickTheme={setVisualTheme}
 *      mode={mode}
 *      onSetMode={setMode}
 *      Miniature={ThemeMiniature}
 *      icons={{ Check, Moon, Sun, X }}
 *    />
 *
 *  Generic enough that printer-dashboard, waki-brain, and any future
 *  app can consume the same component without forking. */

export interface ThemePickerThemeMeta {
  id: string;
  name: string;
  description: string;
}

export type ThemeMode = "dark" | "light";

export interface ThemePickerIcons {
  Check: ComponentType<{ className?: string }>;
  Moon: ComponentType<{ className?: string }>;
  Sun: ComponentType<{ className?: string }>;
  X: ComponentType<{ className?: string }>;
}

export interface ThemePickerOverlayProps {
  open: boolean;
  onClose: () => void;
  themes: ReadonlyArray<ThemePickerThemeMeta>;
  activeThemeId: string;
  onPickTheme: (id: string) => void;
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  /** Component that renders a small preview tile for one theme.
   *  Receives `themeId` and is responsible for matching the theme's
   *  visual treatment. Each app typically ships its own — the shell
   *  doesn't dictate the preview shape. */
  Miniature: ComponentType<{ themeId: string }>;
  /** Lucide-style icon set. Pass `Check`, `Moon`, `Sun`, `X` from the
   *  consumer's icon dependency. */
  icons: ThemePickerIcons;
  /** Optional title + subtitle override. */
  title?: string;
  subtitle?: string;
  /** Optional extra slot rendered above the tile grid (e.g. a
   *  category filter). */
  preGrid?: ReactNode;
}

export function ThemePickerOverlay({
  open,
  onClose,
  themes,
  activeThemeId,
  onPickTheme,
  mode,
  onSetMode,
  Miniature,
  icons,
  title = "Themes",
  subtitle = "Tap any tile to swap instantly. The change applies across the whole app.",
  preGrid,
}: ThemePickerOverlayProps) {
  const { Check, Moon, Sun, X } = icons;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-0 sm:p-6 bg-black/40 dark:bg-black/50 backdrop-blur-xl backdrop-saturate-150 animate-overlayIn motion-reduce:animate-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Theme switcher"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-bar relative w-full max-w-4xl max-h-full sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col animate-modalIn motion-reduce:animate-none"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>

          <ModeToggle mode={mode} onSetMode={onSetMode} Sun={Sun} Moon={Moon} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close theme switcher"
            className="ml-1 flex-shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {preGrid}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {themes.map((t) => {
              const active = activeThemeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPickTheme(t.id)}
                  aria-pressed={active}
                  className={`relative flex flex-col gap-2 p-2.5 rounded-2xl border-2 transition-all text-left ${
                    active
                      ? "border-sky-500 ring-4 ring-sky-400/30 shadow-lg shadow-sky-500/20"
                      : "border-slate-300/70 dark:border-slate-600/70 hover:border-slate-400 dark:hover:border-slate-500"
                  }`}
                >
                  <Miniature themeId={t.id} />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {t.description}
                    </div>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onSetMode,
  Sun,
  Moon,
}: {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  Sun: ComponentType<{ className?: string }>;
  Moon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex-shrink-0 inline-flex rounded-full bg-slate-200/70 dark:bg-slate-700/70 p-1">
      <button
        type="button"
        onClick={() => onSetMode("light")}
        aria-pressed={mode === "light"}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
          mode === "light"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 dark:text-slate-300"
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => onSetMode("dark")}
        aria-pressed={mode === "dark"}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
          mode === "dark"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 dark:text-slate-300"
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        Dark
      </button>
    </div>
  );
}
