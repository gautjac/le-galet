// Le Galet — a tiny offline shell. The display lives on a kitchen iPad that may
// drift off Wi-Fi; everything but the Souffleur (which needs the network) keeps
// working from cache. We cache the built shell on install and serve
// network-falling-back-to-cache for navigations, cache-first for static assets.
const CACHE = "le-galet-v2";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache the AI endpoint — it must hit the network or fail honestly.
  if (url.pathname.startsWith("/api/")) return;

  // The margin-quotes feed must stay fresh: network-first, fall back to the last
  // cached copy when offline. (Cache-first would freeze the feed forever.)
  if (url.pathname.endsWith("/quotes-feed.json")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && url.origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // App-shell navigations: try network, fall back to cached index.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Static assets: cache-first, then fill the cache.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && (url.origin === location.origin || url.host.includes("fonts.g"))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }).catch(() => hit),
    ),
  );
});
