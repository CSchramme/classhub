const STATIC_CACHE = "classhub-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Cache-first for immutable, hashed Next.js build assets and the app icons
// only — every navigation and API request goes straight to the network, so
// nobody ever sees stale auth state or out-of-date homework/todos/etc. This
// is what makes the app installable, not an offline-data story: faking
// offline access to data that hasn't actually synced is explicitly out of
// scope (spec warns against fake offline features).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset =
    event.request.method === "GET" &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-"));

  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }),
  );
});
