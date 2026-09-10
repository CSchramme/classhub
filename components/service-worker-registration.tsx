"use client";

import { useEffect } from "react";

/**
 * Production only: a caching service worker in `next dev` can serve stale
 * bundles over HMR and cause confusing "why isn't my change showing up"
 * bugs, so it never registers outside a real build.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
