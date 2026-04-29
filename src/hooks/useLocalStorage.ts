import { useCallback, useEffect, useRef, useState } from "react";

/** Typed localStorage hook that mirrors the `useState` API but
 *  persists writes to `localStorage` and reads the initial value
 *  from there.
 *
 *  - SSR-safe: returns `initialValue` during SSR and re-hydrates from
 *    storage on first effect.
 *  - Cross-tab sync: subscribes to the `storage` event so a write in
 *    another tab updates this hook's state.
 *  - Tolerant of broken JSON / private-mode failures: any throw
 *    falls back silently to the in-memory value.
 *
 *  Usage:
 *    const [name, setName] = useLocalStorage<string>("user:name", "");
 *    setName("Waqas");
 */

type SetValue<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;

  const read = useCallback((): T => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialRef.current;
      return JSON.parse(raw) as T;
    } catch {
      return initialRef.current;
    }
  }, [key]);

  const [value, setValue] = useState<T>(initialRef.current);

  useEffect(() => {
    setValue(read());
  }, [read]);

  const set = useCallback(
    (next: SetValue<T>) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // ignore quota / private mode failures; in-memory state still updates
        }
        return resolved;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    setValue(initialRef.current);
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setValue(initialRef.current);
        return;
      }
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore malformed external write
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, set, remove];
}

/* Example:
 *
 * import { useLocalStorage } from "waki-shell";
 *
 * function Sidebar() {
 *   const [collapsed, setCollapsed, reset] = useLocalStorage("sidebar:collapsed", false);
 *   return (
 *     <button onClick={() => setCollapsed((c) => !c)}>
 *       {collapsed ? "Expand" : "Collapse"}
 *     </button>
 *   );
 * }
 */
