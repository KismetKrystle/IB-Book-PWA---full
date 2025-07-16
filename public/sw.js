const CACHE_NAME = "infinite-bloom-cache-v1"
const STATIC_CACHE_NAME = "infinite-bloom-static-v1"

// Routes to exclude from PWA caching
const ADMIN_ROUTES = ["/admin", "/api/admin"]

// Check if URL should be excluded from caching
function shouldExcludeFromCache(url) {
  return ADMIN_ROUTES.some((route) => url.pathname.startsWith(route))
}

// Static assets to cache
const STATIC_ASSETS = ["/", "/pwa", "/pwa/reader", "/manifest.json", "/offline.html"]

// URLs to cache
const urlsToCache = [
  "/",
  "/pwa",
  "/pwa/reader",
  "/flipbook-viewer.html", // Your flipbook HTML file
  // Add other critical assets here (CSS, JS bundles, images, fonts)
  // Note: Dynamic content (like API responses) typically isn't cached here
  // but rather handled by network-first or stale-while-revalidate strategies.
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Opened cache")
        return cache.addAll(urlsToCache)
      }),
    ]),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Skip admin routes entirely
  if (shouldExcludeFromCache(url)) {
    return // Let the request go through normally without caching
  }

  // Handle PWA routes with cache-first strategy
  if (url.pathname.startsWith("/pwa") || url.pathname === "/") {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            return caches.match("/offline.html")
          })
      }),
    )
  }
})

// Background sync for analytics
self.addEventListener("sync", (event) => {
  if (event.tag === "analytics-sync") {
    event.waitUntil(syncAnalytics())
  }
})

async function syncAnalytics() {
  try {
    // Get stored analytics data
    const analyticsData = await getStoredAnalytics()
    if (analyticsData.length > 0) {
      // Send to server
      await fetch("/api/analytics/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: analyticsData }),
      })
      // Clear stored data after successful sync
      await clearStoredAnalytics()
    }
  } catch (error) {
    console.error("Analytics sync failed:", error)
  }
}

async function getStoredAnalytics() {
  // Implementation would get data from IndexedDB
  return []
}

async function clearStoredAnalytics() {
  // Implementation would clear IndexedDB
}
