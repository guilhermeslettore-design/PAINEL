// Service Worker — Painel GSI/SSIE
const CACHE = 'gsi-painel-v2';
const ASSETS = [
  './monitor_rio.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        if(res && res.status === 200){
          var resClone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, resClone); });
        }
        return res;
      }).catch(function(){
        return caches.match('./monitor_rio.html');
      });
    })
  );
});
