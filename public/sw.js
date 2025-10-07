// FastTrack PWA Service Worker with Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = 'fasttrack-v1';
const OFFLINE_PAGE = '/offline.html';

// Configure Workbox
workbox.setConfig({
  debug: false
});

// Precache essential assets
workbox.precaching.precacheAndRoute([
  { url: '/', revision: CACHE_VERSION },
  { url: '/index.html', revision: CACHE_VERSION },
  { url: '/manifest.json', revision: CACHE_VERSION },
  { url: '/favicon.png', revision: CACHE_VERSION },
  { url: '/icon-512x512.png', revision: CACHE_VERSION }
]);

// Cache images with Cache First strategy
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'fasttrack-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Cache CSS and JS with Stale While Revalidate
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'fasttrack-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      })
    ]
  })
);

// Cache API calls with Network First strategy
workbox.routing.registerRoute(
  ({ url }) => url.origin === 'https://gvhddvadlbgzjjgpjhrd.supabase.co',
  new workbox.strategies.NetworkFirst({
    cacheName: 'fasttrack-api',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ],
    networkTimeoutSeconds: 10
  })
);

// Cache fonts with Cache First
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'fasttrack-fonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Enable navigation preload
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Offline fallback for navigation requests
workbox.routing.setDefaultHandler(
  new workbox.strategies.NetworkFirst({
    cacheName: 'fasttrack-default',
    networkTimeoutSeconds: 10
  })
);

// Catch handler for failed requests
workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match(OFFLINE_PAGE) || caches.match('/');
  }
  return Response.error();
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-fasts') {
    event.waitUntil(syncFastsData());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FastTrack';
  const options = {
    body: data.body || 'Lembrete de jejum',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync function for background sync
async function syncFastsData() {
  try {
    console.log('[SW] Syncing fasts data...');
    // Implement your sync logic here
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Log service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] FastTrack Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('fasttrack-') && cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

console.log('[SW] FastTrack Service Worker loaded');