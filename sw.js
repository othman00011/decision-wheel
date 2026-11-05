// Change this value when you publish a new app version.
const CACHE_PREFIX = "decision-wheel-";
const CACHE_VERSION = "decision-wheel-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.svg"
];
const APP_ICONS = [
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

// Save the app pages and any generated icons for offline use.
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async function (cache) {
      await cache.addAll(APP_FILES);
      for (let index = 0; index < APP_ICONS.length; index += 1) {
        try {
          await cache.add(APP_ICONS[index]);
        } catch (error) {
          // Icons can be added later with the icon helper page.
        }
      }
    })
  );
});

// Remove older app caches after the new worker becomes active.
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
          return Promise.resolve(false);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Look in the saved app first, then request the file from the network.
self.addEventListener("fetch", function (event) {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(function (networkResponse) {
        if (networkResponse && networkResponse.ok) {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(request, responseCopy);
          });
        }
        return networkResponse;
      }).catch(function () {
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      });
    })
  );
});
