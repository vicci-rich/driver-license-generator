// Service Worker — DL Generator (cache-first for local assets only)
// CDN scripts are NOT cached here: cross-origin URLs can't be added
// in the SW install event without CORS headers, and bwip-js loads fine
// from the network with its own CDN caching.

const CACHE_NAME = 'dl-generator-v2';

const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './theonly.jpg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  globalThis.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  globalThis.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;   // skip CDN

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response?.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

