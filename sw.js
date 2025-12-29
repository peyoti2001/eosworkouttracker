// Simple cache-first service worker for offline use
// Bump CACHE_NAME when you change files so iPhone updates properly.
const CACHE_NAME = "eos-workout-tracker-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./progress.html",
  "./styles.css",
  "./app.js",
  "./progress.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if(cached) return cached;

    try{
      const fresh = await fetch(req);
      if(req.method === "GET" && fresh && fresh.status === 200){
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch{
      // fallback to cached index for navigation
      if(req.mode === "navigate"){
        return cache.match("./index.html");
      }
      throw;
    }
  })());
});
