/**
 * Service Worker for IRAVIN Reports PWA
 * Handles caching, offline functionality, and app updates
 */

const CACHE_NAME = 'iravin-reports-v1.0.0';
const STATIC_CACHE = 'iravin-static-v1.0.0';
const DYNAMIC_CACHE = 'iravin-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/reports.html',
    '/kpi-data-entry.html',
    '/scorecard-designer.html',
    '/system-reports.html',
    '/calendar.html',
    '/users.html',
    '/settings.html',
    '/assets/css/mobile-first.css',
    '/assets/css/style.css',
    '/assets/js/mobile-navigation.js',
    '/assets/js/app.js',
    '/assets/js/data.js',
    '/assets/js/calendar.js',
    '/global-functions.js',
    '/assets/images/favicon.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const API_CACHE = [
    '/api/reports',
    '/api/users',
    '/api/departments',
    '/api/scorecards'
];

/**
 * Install event - cache static files
 */
self.addEventListener('install', (event) => {
    console.log('📱 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('📱 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - handle network requests
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external scripts and images completely - let them load normally
    if (url.hostname === 'cdn.jsdelivr.net' || 
        url.hostname === 'cdnjs.cloudflare.com' ||
        url.hostname === 'unpkg.com' ||
        url.hostname === 'jsdelivr.net' ||
        url.hostname === 'picsum.photos' ||
        url.hostname === 'via.placeholder.com' ||
        url.hostname === 'placehold.it') {
        return; // Don't intercept external resources
    }
    
    // Handle different types of requests
    if (isStaticFile(request)) {
        event.respondWith(handleStaticFile(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

/**
 * Check if request is for a static file
 */
function isStaticFile(request) {
    const url = new URL(request.url);
    return STATIC_FILES.includes(url.pathname) || 
           url.pathname.startsWith('/assets/') ||
           url.hostname === 'fonts.googleapis.com' ||
           url.hostname === 'fonts.gstatic.com';
}

/**
 * Check if request is for API
 */
function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') || 
           url.hostname.includes('supabase.co');
}

/**
 * Handle static file requests
 */
async function handleStaticFile(request) {
    // For local static files, use cache-first strategy
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, try network
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache the fresh response
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.log('🌐 Network failed for static file, using cache');
    }
    
    // Return offline page if available
    return caches.match('/offline.html');
}

/**
 * Handle API requests
 */
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.log('🌐 Network failed for API request, using cache');
    }
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Return offline data if available
    return new Response(JSON.stringify({
        error: 'offline',
        message: 'You are offline. Please check your connection.',
        data: null
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Handle dynamic requests
 */
async function handleDynamicRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.log('🌐 Network failed for dynamic request');
    }
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
}

/**
 * Background sync for offline data
 */
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData() {
    try {
        // Get offline data from IndexedDB
        const offlineData = await getOfflineData();
        
        if (offlineData.length > 0) {
            console.log('📤 Syncing offline data...');
            
            for (const data of offlineData) {
                try {
                    await fetch(data.url, {
                        method: data.method,
                        headers: data.headers,
                        body: data.body
                    });
                    
                    // Remove from offline storage after successful sync
                    await removeOfflineData(data.id);
                } catch (error) {
                    console.error('❌ Failed to sync data:', error);
                }
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
    console.log('📱 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/assets/images/favicon.svg',
        badge: '/assets/images/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/assets/images/favicon.svg'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/images/favicon.svg'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('IRAVIN Reports', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    console.log('📱 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
    console.log('📱 Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

/**
 * Helper function to get offline data from IndexedDB
 */
async function getOfflineData() {
    // This would typically use IndexedDB
    // For now, return empty array
    return [];
}

/**
 * Helper function to remove offline data from IndexedDB
 */
async function removeOfflineData(id) {
    // This would typically use IndexedDB
    // For now, just log
    console.log('🗑️ Removing offline data:', id);
}

/**
 * Periodic background sync (if supported)
 */
self.addEventListener('periodicsync', (event) => {
    console.log('🔄 Periodic sync triggered:', event.tag);
    
    if (event.tag === 'periodic-sync') {
        event.waitUntil(syncOfflineData());
    }
});

console.log('📱 Service Worker loaded successfully'); 