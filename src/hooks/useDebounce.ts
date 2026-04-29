import { useEffect, useState } from "react";

/** Debounce a value over time. The hook returns the latest value, but
 *  only after `delayMs` has elapsed without the input changing again.
 *
 *  Standard utility for search-as-you-type inputs, autosave, etc.
 *  When the user is mid-keystroke, the debounced value lags behind
 *  the live input; once they pause, the debounced value catches up
 *  and the consumer re-fetches / re-validates / re-renders.
 *
 *  Usage:
 *    const [query, setQuery] = useState("");
 *    const debouncedQuery = useDebounce(query, 250);
 *    useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/* Example:
 *
 * import { useState, useEffect } from "react";
 * import { useDebounce } from "waki-shell";
 *
 * function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
 *   const [q, setQ] = useState("");
 *   const debounced = useDebounce(q, 300);
 *   useEffect(() => { onSearch(debounced); }, [debounced, onSearch]);
 *   return <input value={q} onChange={(e) => setQ(e.target.value)} />;
 * }
 */
