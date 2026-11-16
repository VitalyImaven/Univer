/* Offline support for מתמטיקה בכיף.
 * - The page itself (index.html) is network-first, so a new deployment shows up on the next online visit.
 * - Build assets have content-hashed names, so they are cache-first and never go stale.
 * - On install the worker reads index.html and its stylesheet and pre-caches everything they reference
 *   (scripts, styles, fonts): the app works offline right after the very first visit.
 */
const CACHE = 'math-kef-v3';
// Dev servers and some hosts add `Vary` headers; the cached copy is valid for every variant.
const MATCH = { ignoreVary: true };
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
  const assets = [...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map(m => new URL(m[1], self.registration.scope).href);
  await cache.addAll(assets);
  for (const css of assets.filter(url => url.endsWith('.css'))) {
    const text = await (await fetch(css)).text();
    const files = [...text.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => new URL(m[1].replace(/["']/g, ''), css).href);
    // Fonts are split by script; a missing subset must not fail the installation.
    await Promise.all(files.map(file => cache.add(file).catch(() => undefined)));
  }
}

self.addEventListener('install', event => { event.waitUntil(precache().then(() => self.skipWaiting())); });

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const store = response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
    return response;
  };
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(store).catch(() => caches.match(request, MATCH).then(hit => hit || caches.match('./index.html', MATCH))));
    return;
  }
  event.respondWith(caches.match(request, MATCH).then(hit => hit || fetch(request).then(store)));
});
