import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * True only after the client has hydrated. Use this instead of a
 * `useState` + `useEffect` "mounted" flag to avoid SSR/client markup
 * mismatches for state that only exists in the browser (e.g. next-themes'
 * resolved theme) — useSyncExternalStore lets React give the server and
 * the first client render the same (false) snapshot, correctly.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
