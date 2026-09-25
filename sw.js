// VidyaUday Service Worker v6 — 100% Offline Capability
const CACHE_NAME = 'vidyauday-v6';

const CORE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: Cache all core platform assets immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[VidyaUday SW] Pre-caching core platform files');
      return cache.addAll(CORE_URLS).catch(err => {
        console.warn('[VidyaUday SW] Pre-cache partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up obsolete caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[VidyaUday SW] Clearing old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate with full offline fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Gemini API requests — offline fallback is handled client-side by Uday the Owl
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Offline - served from cache successfully
          });
        return cachedResponse;
      }

      // If not yet cached, fetch from network and store for next offline visit
      return fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html')
              .then(res => res || caches.match('./'));
          }
        });
    })
  );
});
