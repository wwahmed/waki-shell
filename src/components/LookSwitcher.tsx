import type { ComponentType, ReactNode } from "react";

export type LookSwitcherMode = "light" | "dark";

export interface LookSwitcherTheme {
  id: string;
  name: string;
}

export interface LookSwitcherIcons {
  Moon: ComponentType<{ className?: string }>;
  Sun: ComponentType<{ className?: string }>;
}

export interface LookSwitcherProps {
  themes: ReadonlyArray<LookSwitcherTheme>;
  activeThemeId: string;
  mode: LookSwitcherMode;
  onThemeChange: (themeId: string) => void;
  onModeChange: (mode: LookSwitcherMode) => void;
  icons: LookSwitcherIcons;
  preview?: ReactNode;
  label?: string;
  className?: string;
}

/** Compact theme + mode switcher for app headers and settings panes.
 *  The host owns theme loading and supplies an optional preview swatch;
 *  waki-shell owns the control shape, accessibility, and mode actions. */
export function LookSwitcher({
  themes,
  activeThemeId,
  mode,
  onThemeChange,
  onModeChange,
  icons,
  preview,
  label = "Look",
  className = "",
}: LookSwitcherProps) {
  const { Moon, Sun } = icons;
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-slate-300/70 bg-white/70 p-1 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/60 ${className}`}
    >
      {preview && (
        <div
          className="h-7 w-10 overflow-hidden rounded-full border border-slate-300/70 dark:border-slate-700/70"
          aria-hidden="true"
        >
          {preview}
        </div>
      )}
      <label className="inline-flex items-center gap-1.5 pl-1 text-xs font-bold">
        <span className="opacity-65">{label}</span>
        <select
          value={activeThemeId}
          onChange={(event) => onThemeChange(event.target.value)}
          className="max-w-[11rem] appearance-none bg-transparent font-bold text-inherit outline-none"
          aria-label={label}
        >
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      <div
        className="inline-flex rounded-full bg-slate-200/70 p-0.5 dark:bg-slate-800/80"
        aria-label="Color mode"
      >
        <button
          type="button"
          onClick={() => onModeChange("light")}
          aria-label="Use light mode"
          aria-pressed={mode === "light"}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            mode === "light"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onModeChange("dark")}
          aria-label="Use dark mode"
          aria-pressed={mode === "dark"}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            mode === "dark"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300"
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
