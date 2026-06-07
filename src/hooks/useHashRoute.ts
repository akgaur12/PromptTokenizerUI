import { useSyncExternalStore } from "react";

/**
 * Minimal hash-based router. The app is small enough that pulling in
 * react-router would be overkill, so we read the location hash directly and
 * re-render on `hashchange`. Routes look like `#/` (tokenize) and
 * `#/compare`. Vercel's catch-all rewrite already serves index.html for any
 * path, so hash routes need no extra server config.
 */
function getHash(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function useHashRoute(): string {
  // Server snapshot returns "/" — there is no SSR here, but useSyncExternalStore
  // requires it and it keeps the hook safe under React 18 strict mode.
  return useSyncExternalStore(subscribe, getHash, () => "/");
}
