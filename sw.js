/* ClasSos — service worker : l'appli fonctionne sans Internet */
var CACHE = 'classos-v12';
var FILES = [
  './', './index.html', './redirect.js', './style.css', './common.js', './config.js',
  './admin/', './admin/index.html', './admin/app.js',
  './vendor/qrcode.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('classos-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Réseau d'abord (pour recevoir les mises à jour), cache si hors-ligne */
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  /* Hors de l'appli (API, autres sites) et espace étudiant / développeur : pas d'interception */
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/inscription/') >= 0 || u.pathname.indexOf('/dev/') >= 0) return;
  e.respondWith(
    /* no-cache : revérifie chaque fichier auprès du serveur (réponse 304 légère si inchangé) pour recevoir les mises à jour immédiatement */
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
