import { useCallback, useEffect, useState } from "react";

/** Light/dark theme hook with localStorage persistence and system-pref
 *  fallback. Sets `dark` or `light` on `<html>` so Tailwind's
 *  `darkMode: "class"` strategy resolves correctly. The matching
 *  inline bootstrap snippet (see waki-shell/templates/theme-bootstrap.html)
 *  must run synchronously in `<head>` so the very first paint already
 *  has the correct class.
 *
 *  Originally lived in printer-dashboard's hooks/useTheme.ts.
 *  Promoted here in v0.2.0 since every consuming app needs the same
 *  contract.
 *
 *  Storage key is configurable per app via setStorageKey(); default
 *  is "ws:theme" so a fresh consumer doesn't accidentally collide
 *  with another app's saved value. printer-dashboard keeps its
 *  legacy "pd:theme" key by calling setStorageKey("pd:theme") at
 *  module init. */
export type Theme = "dark" | "light";

let storageKey = "ws:theme";

/** Override the localStorage key used to persist the user's choice.
 *  Call this BEFORE any other useTheme entry point if your app needs
 *  a custom key. Idempotent. */
export function setThemeStorageKey(key: string): void {
  storageKey = key;
}

function readSaved(): Theme | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const v = localStorage.getItem(storageKey);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function readInitial(): Theme {
  // HARD RULE: a saved choice always wins over system preference. If
  // the user explicitly picked Dark, every subsequent load honours
  // that even when the OS theme flips.
  const saved = readSaved();
  if (saved) return saved;
  return systemPrefersDark() ? "dark" : "light";
}

let current: Theme = readInitial();
const listeners = new Set<(t: Theme) => void>();

function applyToDocument(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  // Use add/remove (not toggle(force)) to avoid an old-Safari quirk
  // where the two-arg toggle form silently no-ops in PWA contexts.
  if (theme === "dark") {
    html.classList.add("dark");
    html.classList.remove("light");
  } else {
    html.classList.add("light");
    html.classList.remove("dark");
  }
}

applyToDocument(current);

// React to OS-level theme changes ONLY when the user hasn't picked a
// theme manually. Once the saved choice exists, the OS flipping
// doesn't override.
if (
  typeof window !== "undefined" &&
  window.matchMedia &&
  typeof window.matchMedia("(prefers-color-scheme: dark)").addEventListener === "function"
) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", (e) => {
    if (readSaved() !== null) return;
    const next: Theme = e.matches ? "dark" : "light";
    if (next !== current) {
      current = next;
      applyToDocument(next);
      for (const l of listeners) l(next);
    }
  });
}

export function setTheme(theme: Theme): void {
  current = theme;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(storageKey, theme);
  } catch {
    // localStorage may be unavailable (private mode); the class flip
    // below still works for the current session.
  }
  applyToDocument(theme);
  for (const l of listeners) l(theme);
}

export function toggleTheme(): void {
  setTheme(current === "dark" ? "light" : "dark");
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setLocal] = useState<Theme>(current);
  useEffect(() => {
    const fn = (t: Theme) => setLocal(t);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const toggle = useCallback(() => toggleTheme(), []);
  return { theme, setTheme, toggle };
}
