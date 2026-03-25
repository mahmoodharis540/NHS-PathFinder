const VERSION = "v1";
const PAGE_CACHE = `nhs-pathfinder-pages-${VERSION}`;
const API_CACHE = `nhs-pathfinder-api-${VERSION}`;
const MEDIA_CACHE = `nhs-pathfinder-media-${VERSION}`;
const STATIC_CACHE = `nhs-pathfinder-static-${VERSION}`;

const STATIC_ASSETS = ["/", "/NHSlogo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![PAGE_CACHE, API_CACHE, MEDIA_CACHE, STATIC_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isMediaRequest(url) {
  return (
    url.pathname.startsWith("/uploads/") ||
    /\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|ogg|mov)$/i.test(url.pathname)
  );
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/paths") ||
    url.pathname.startsWith("/api/entrances") ||
    url.pathname.startsWith("/api/destinations-search") ||
    url.pathname.startsWith("/api/route")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("Network unavailable and no cached response found.");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isMediaRequest(url)) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
  }
});
