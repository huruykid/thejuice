/* eslint-disable no-restricted-globals */
/**
 * Juice service worker — installability + a usable offline state.
 *
 * Deliberately hand-written and small rather than a Workbox build: this app is a
 * plain Vite SPA whose only cacheable surface is the shell plus content-hashed
 * /assets/* files, and the whole point of the PWA is fast composing on a phone,
 * not full offline authoring.
 *
 * Rules, in order of how much damage getting them wrong would do:
 *   1. NOTHING cross-origin is cached. Supabase (auth, RLS-gated reads, signed
 *      image URLs), analytics, and fonts all go straight to the network. Signed
 *      URLs expire and story images are private — caching either would leak
 *      gated content into a cache that outlives the session.
 *   2. Navigations are network-first. A stale index.html pointing at hashed asset
 *      files that no longer exist is the classic way a PWA bricks itself after a
 *      deploy; going to the network first means that only happens offline.
 *   3. /assets/* is cache-first because the filenames are content-hashed — a hit
 *      is always the right bytes, and a new build asks for new names.
 */

// Bump on any change to this file's caching behavior.
const VERSION = 'v1';
const SHELL_CACHE = `juice-shell-${VERSION}`;
const ASSET_CACHE = `juice-assets-${VERSION}`;

const OFFLINE_URL = '/offline.html';
const SHELL_URL = '/app';

// Small and stable. Anything content-hashed is picked up at runtime instead.
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll is all-or-nothing; one 404 would fail the whole install and leave
      // the app with no worker at all.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('juice-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// The page asks for the update to apply now rather than on the next cold start.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isAsset = (url) =>
  url.pathname.startsWith('/assets/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname.startsWith('/lovable-uploads/') ||
  url.pathname === '/favicon.ico';

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Rule 1: same-origin only. Supabase, GTM and fonts are someone else's problem.
  if (url.origin !== self.location.origin) return;

  // Rule 2: navigations network-first, falling back to the cached shell and then
  // to a real offline page (rather than the browser's dinosaur).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(SHELL_URL)) ||
            (await cache.match(OFFLINE_URL)) ||
            Response.error()
          );
        })
    );
    return;
  }

  // Rule 3: hashed/static assets cache-first.
  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            // Opaque/error responses are not worth persisting.
            if (response.ok && response.type === 'basic') {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
