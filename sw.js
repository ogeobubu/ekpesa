/**
 * Ekpesa Kingdom Website Service Worker
 * Advanced caching strategy for lightning-fast loading
 */

const CACHE_NAME = 'ekpesa-kingdom-v1.2.0';
const CACHE_VERSION = '1.2.0';

// Cache size limits
const MAX_CACHE_ENTRIES = 100;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Critical resources that should be cached immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/favicon.png',
  '/assets/hero.jpg',
  '/assets/palace.jpg'
];

// Resources that should be cached on first request
const CACHE_ON_REQUEST = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:mp4|webm|ogg)$/,
  /\.(?:css|js)$/,
  /\.(?:woff|woff2|ttf|otf)$/
];

// Resources that should never be cached
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /\/admin\//,
  /\/login/,
  /\/register/,
  /\.(?:php|asp|aspx|jsp)$/
];

/**
 * Check if a URL should be cached
 */
function shouldCache(url) {
  // Don't cache if it's in the no-cache patterns
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url))) {
    return false;
  }

  // Cache if it's a critical resource
  if (CRITICAL_RESOURCES.includes(url)) {
    return true;
  }

  // Cache if it matches the cache-on-request patterns
  return CACHE_ON_REQUEST.some(pattern => pattern.test(url));
}

/**
 * Get cache key with version
 */
function getCacheKey(request) {
  const url = new URL(request.url);
  return `${CACHE_VERSION}:${url.pathname}${url.search}`;
}

/**
 * Clean up old cache entries
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('ekpesa-kingdom-') && 
    !name.includes(CACHE_VERSION)
  );

  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}

/**
 * Trim cache when it exceeds limits
 */
async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > MAX_CACHE_ENTRIES) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

/**
 * Check if cache entry is stale
 */
function isStale(entry) {
  const now = Date.now();
  return (now - entry.timestamp) > MAX_CACHE_AGE;
}

/**
 * Enhanced fetch with caching strategy
 */
async function enhancedFetch(request) {
  const url = new URL(request.url);
  
  // For navigation requests, use network-first with fallback
  if (request.mode === 'navigate') {
    try {
      const networkResponse = await fetch(request);
      
      // Cache successful responses
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        trimCache(CACHE_NAME);
      }
      
      return networkResponse;
    } catch (error) {
      // Fallback to cache for navigation
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback to cached index.html
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
      
      throw error;
    }
  }

  // For static resources, use cache-first with network update
  if (shouldCache(url.pathname)) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // If cached and not stale, return it
    if (cachedResponse && !isStale(cachedResponse)) {
      // Update cache in background
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
          trimCache(CACHE_NAME);
        }
      }).catch(() => {
        // Ignore network errors in background updates
      });
      
      return cachedResponse;
    }
    
    // If not cached or stale, fetch from network
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        trimCache(CACHE_NAME);
      }
      return networkResponse;
    } catch (error) {
      // If network fails and we have a stale cached response, return it
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  // For non-cacheable resources, fetch from network
  return fetch(request);
}

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('Ekpesa Kingdom SW: Installing...');
  
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    
    // Cache critical resources
    const cachePromises = CRITICAL_RESOURCES.map(async (resource) => {
      try {
        const response = await fetch(resource, { mode: 'no-cors' });
        if (response.ok || response.type === 'opaque') {
          await cache.put(resource, response);
          console.log('Ekpesa Kingdom SW: Cached', resource);
        }
      } catch (error) {
        console.warn('Ekpesa Kingdom SW: Failed to cache', resource, error);
      }
    });

    await Promise.all(cachePromises);
    await cleanupOldCaches();
    
    console.log('Ekpesa Kingdom SW: Installed successfully');
    self.skipWaiting();
  })());
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Ekpesa Kingdom SW: Activating...');
  
  event.waitUntil((async () => {
    await cleanupOldCaches();
    await self.clients.claim();
    console.log('Ekpesa Kingdom SW: Activated successfully');
  })());
});

/**
 * Fetch event - handle requests with enhanced caching
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for our own domain)
  const url = new URL(request.url);
  if (url.origin !== location.origin && !url.hostname.includes('ekpesakingdom.netlify.app')) {
    return;
  }

  event.respondWith(enhancedFetch(request));
});

/**
 * Background sync for offline updates
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil((async () => {
      console.log('Ekpesa Kingdom SW: Background sync');
      // Update any cached resources that might be stale
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      const updatePromises = keys.map(async (request) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
        } catch (error) {
          // Ignore network errors
        }
      });

      await Promise.all(updatePromises);
    })());
  }
});

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New content available from Ekpesa Kingdom',
      icon: '/assets/favicon.png',
      badge: '/assets/favicon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/assets/favicon.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/assets/favicon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Ekpesa Kingdom', options)
    );
  }
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      await caches.delete(CACHE_NAME);
      console.log('Ekpesa Kingdom SW: Cache cleared');
    })());
  }
});

console.log('Ekpesa Kingdom Service Worker loaded successfully');