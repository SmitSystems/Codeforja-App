/* Service worker: funciona sin internet y recibe actualizaciones de GitHub.
   Sube el numero de VERSION cada vez que cambies los archivos. */
const VERSION = "codeforja-v3";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde rapido desde la copia guardada y, si hay internet, la actualiza en segundo plano */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(VERSION).then(async c => {
      const guardado = await c.match(e.request, { ignoreSearch: true });
      const red = fetch(e.request).then(r => {
        if (r && r.ok) c.put(e.request, r.clone());
        return r;
      }).catch(() => null);
      return guardado || (await red) || (e.request.mode === "navigate" ? c.match("./index.html") : Response.error());
    })
  );
});
