const CACHE_NAME = 'v1';
const CACHE_ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/icons/pwa-192x192.png',
    '/icons/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            )
        )
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request.clone()).then((networkResponse) => {
                if (
                    !networkResponse || 
                    networkResponse.status !== 200 || 
                    networkResponse.type !== 'basic'
                ) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        }).catch(() => caches.match('/'))
    );
});
