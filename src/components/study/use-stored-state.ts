// A tiny store on top of localStorage that React can subscribe to.
//
// Why not useState + useEffect? The server can't see localStorage, so the server's HTML always
// shows the defaults. useSyncExternalStore handles that switch safely: during hydration it uses
// getServerSnapshot (the defaults), then re-renders with the browser's saved value. No mismatch.
//
// Only Client Components may use this (it needs `window`).
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { z } from "zod";

// When localStorage is blocked (some private windows), we keep the values in memory instead,
// so the timer still works; it just forgets them on reload.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The "storage" event fires when ANOTHER tab changes localStorage: both tabs stay in sync.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeStored(key: string, value: unknown) {
  const text = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, text);
  } catch {
    memory.set(key, text);
  }
  for (const listener of listeners) listener();
}

/** Turns the saved text back into a value. Anything broken or edited by hand → the fallback. */
export function parseStored<T>(
  raw: string | null,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (raw === null) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Like useState, but saved in localStorage under `key`, and checked with a Zod schema on the way
 * back in (anyone can edit localStorage in DevTools). Pass a schema and fallback that never change
 * (module constants), so the value isn't parsed again on every render.
 */
export function useStoredState<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => null, // on the server: nothing saved yet → the fallback
  );
  const value = useMemo(
    () => parseStored(raw, schema, fallback),
    [raw, schema, fallback],
  );
  const setValue = useCallback((next: T) => writeStored(key, next), [key]);
  return [value, setValue];
}
