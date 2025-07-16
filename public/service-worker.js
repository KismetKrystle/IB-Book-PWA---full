const CACHE_NAME = "infinite-bloom-cache-v1"
const STATIC_CACHE = "infinite-bloom-static-v2"

// Core app files
const APP_URLS = ["/", "/flipbook", "/manifest.json", "/flipbook-viewer.html"]

// Flipbook assets (add your actual files here)
const FLIPBOOK_URLS = [
  "/javascript/config.js",
  "/javascript/LoadingJS.js",
  "/javascript/deString.js",
  "/javascript/jquery-3.7.1.min.js",
  "/javascript/book.min.js",
  "/javascript/pageItems.min.js",
  "/javascript/main.min.js",
  "/javascript/flipHtml5.hiSlider2.min.js",
  "/style/style.css",
  "/style/hiSlider2.min.css",
  "/files/pageEditor.js",
  "/files/textSvgConfig.js",
  "/files/shot.jpg",
  "/files/yzReader/templates/Slide/css/app.css",
  "/files/yzReader/templates/Slide/css/chunk-vendors.css",
  "/files/yzReader/templates/Slide/js/app.js",
  "/files/yzReader/templates/Slide/js/chunk-vendors.js",
  "/slide_javascript/slideJS.js",
]

const urlsToCache = APP_URLS.concat(FLIPBOOK_URLS)

// Install event - cache all resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE]
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
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      // No cache hit - fetch from network
      return fetch(event.request)
    }),
  )
})

// Message event - handle cache updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
