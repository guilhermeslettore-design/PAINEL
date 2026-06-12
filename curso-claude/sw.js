/* Service worker da Academia Claude — funciona offline */
const CACHE = "academia-claude-v3";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* rede primeiro (para pegar atualizações), cache como reserva offline */
self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    fetch(ev.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(ev.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(ev.request, { ignoreSearch: true })
        .then((r) => r || caches.match("./index.html")))
  );
});
