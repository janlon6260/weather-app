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
            .then((cache) => {
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );

    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            const fetchRequest = event.request.clone();

            return fetch(fetchRequest)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
        }).catch(() => caches.match('/offline.html'))
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || 'Melding';
    const options = {
        body: data.body || 'Du har en ny melding',
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-192x192.png'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {

    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
