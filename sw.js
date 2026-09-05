// VidyaUday Service Worker — Offline Mode
const CACHE_NAME = 'vidyauday-v2';
const OFFLINE_URLS = [
  '/VidyaUday/',
  '/VidyaUday/index.html',
  '/VidyaUday/manifest.json',
  '/VidyaUday/icon-192.png',
  '/VidyaUday/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Install — cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core files for offline');
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network, cache new responses
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Gemini API calls — never cache those
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful GET requests for future offline use
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Fully offline — serve cached index for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/VidyaUday/index.html');
        }
      });
    })
  );
});
