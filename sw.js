/* Service worker: cache-first for the vendored MediaPipe runtime and hashed assets, so a returning
   visitor loads instantly and the CDN is not touched twice. The HTML itself stays network-first. */
const CACHE = "future-you-v1";
const IMMUTABLE = /\/(vendor|assets)\//;

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin || !IMMUTABLE.test(url.pathname)) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok && res.status === 200) cache.put(e.request, res.clone()).catch(() => undefined);
      return res;
    }),
  );
});
