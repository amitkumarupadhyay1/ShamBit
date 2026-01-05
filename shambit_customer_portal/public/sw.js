const CACHE_NAME = 'shambit-v1';
const STATIC_CACHE = 'shambit-static-v1';
const DYNAMIC_CACHE = 'shambit-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.shambit\.com\/categories/,
  /^https:\/\/api\.shambit\.com\/products\/featured/,
  /^https:\/\/api\.shambit\.com\/banners/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Serve cached version or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle API requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              // Return cached version immediately, then update in background
              if (cachedResponse) {
                // Update cache in background
                fetch(request)
                  .then((response) => {
                    if (response.status === 200) {
                      cache.put(request, response.clone());
                    }
                  })
                  .catch(() => {
                    // Network failed, keep using cache
                  });
                
                return cachedResponse;
              }

              // No cache, fetch from network
              return fetch(request)
                .then((response) => {
                  if (response.status === 200) {
                    cache.put(request, response.clone());
                  }
                  return response;
                })
                .catch(() => {
                  // Return a basic error response for API failures
                  return new Response(
                    JSON.stringify({ error: 'Network unavailable', data: [] }),
                    {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions like adding to cart, wishlist, etc.
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  // Implement offline action handling
  console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: data.data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/logo.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});