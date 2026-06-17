// ═══════════════════════════════════════════════════════════════════════════
// J.E.L.I.X OS — Service Worker
// Upload this file to the SAME folder as index.html on GitHub Pages.
// e.g. justineinacay.github.io/JELIXOS/sw.js
// ═══════════════════════════════════════════════════════════════════════════
const CACHE = 'jelix-v1.2';

const PRE_CACHE = [
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(PRE_CACHE).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) {
        return Promise.all(
          ks.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var u;
  try { u = new URL(e.request.url); } catch (err) { return; }

  // Network-first, no cache for live APIs
  if (u.hostname.indexOf('supabase.co') > -1 ||
      u.hostname.indexOf('anthropic.com') > -1 ||
      u.hostname.indexOf('open-meteo.com') > -1) {
    e.respondWith(
      fetch(e.request).catch(function () {
        return new Response('{"error":"offline"}', {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-first for fonts + CDN assets
  if (u.hostname.indexOf('fonts.googleapis.com') > -1 ||
      u.hostname.indexOf('jsdelivr.net') > -1 ||
      u.hostname.indexOf('fonts.gstatic.com') > -1) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          var cl = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cl); });
          return res;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for everything else (the app HTML)
  e.respondWith(
    fetch(e.request).then(function (res) {
      var cl = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, cl); });
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
