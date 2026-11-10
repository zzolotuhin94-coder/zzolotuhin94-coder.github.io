/* DAHUAM.202 Küche · Service Worker (erzeugt von build.py aus sw-src.js, nicht von Hand ändern)
   Hält die App samt Schriften, Bildern und Bibliotheken auf dem Gerät, damit sie ohne Internet startet.
   Eine neue Version wird im Hintergrund geladen und erst beim nächsten Start (oder nach „Neu laden“) aktiv.
   Seite und Dateien kommen immer aus demselben Paket (BUILD), nie gemischt. */
const BUILD = '8d192f85d5';
const CACHE = 'dahuam202-' + BUILD, RUNTIME = 'dahuam202-laufzeit';
const PRECACHE = ["manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png", "brand/fork.webp", "brand/knife.webp", "brand/logo.svg", "brand/plate.webp", "brand/slate.webp", "brand/table.webp", "photos/unmatched/gaststube.webp", "photos/unmatched/aussen-winter.webp", "photos/unmatched/silvesterabend-fondue.webp", "vendor/fonts/figtree-latin-ext-wght-normal.woff2", "vendor/fonts/figtree-latin-wght-normal.woff2", "vendor/fonts/barlow-condensed-latin-ext-300-normal.woff2", "vendor/fonts/barlow-condensed-latin-300-normal.woff2", "vendor/fonts/barlow-condensed-latin-ext-400-normal.woff2", "vendor/fonts/barlow-condensed-latin-400-normal.woff2", "vendor/fonts/barlow-condensed-latin-ext-500-normal.woff2", "vendor/fonts/barlow-condensed-latin-500-normal.woff2", "vendor/fonts/barlow-condensed-latin-ext-600-normal.woff2", "vendor/fonts/barlow-condensed-latin-600-normal.woff2", "vendor/fonts/barlow-condensed-latin-ext-700-normal.woff2", "vendor/fonts/barlow-condensed-latin-700-normal.woff2", "vendor/fonts/fraunces-latin-ext-opsz-normal.woff2", "vendor/fonts/fraunces-latin-opsz-normal.woff2", "vendor/fonts/fraunces-latin-ext-opsz-italic.woff2", "vendor/fonts/fraunces-latin-opsz-italic.woff2", "vendor/fonts/caveat-latin-ext-wght-normal.woff2", "vendor/fonts/caveat-latin-wght-normal.woff2", "vendor/fonts/pt-sans-latin-ext-400-normal.woff2", "vendor/fonts/pt-sans-latin-400-normal.woff2", "vendor/fonts/pt-sans-latin-ext-700-normal.woff2", "vendor/fonts/pt-sans-latin-700-normal.woff2", "vendor/fonts/roboto-condensed-latin-ext-wght-normal.woff2", "vendor/fonts/roboto-condensed-latin-wght-normal.woff2", "vendor/fonts/saira-condensed-latin-ext-300-normal.woff2", "vendor/fonts/saira-condensed-latin-300-normal.woff2", "vendor/fonts/saira-condensed-latin-ext-400-normal.woff2", "vendor/fonts/saira-condensed-latin-400-normal.woff2", "vendor/fonts/schibsted-grotesk-latin-ext-wght-normal.woff2", "vendor/fonts/schibsted-grotesk-latin-wght-normal.woff2", "vendor/fonts/source-serif-4-latin-ext-opsz-normal.woff2", "vendor/fonts/source-serif-4-latin-opsz-normal.woff2", "vendor/fonts/source-serif-4-latin-ext-opsz-italic.woff2", "vendor/fonts/source-serif-4-latin-opsz-italic.woff2", "vendor/fonts/jetbrains-mono-latin-ext-500-normal.woff2", "vendor/fonts/jetbrains-mono-latin-500-normal.woff2", "vendor/html2canvas.min.js", "vendor/jspdf.umd.min.js", "vendor/xlsx.full.min.js"];
const SCOPE = new URL('./', self.location).href;

self.addEventListener('install', e => {
  e.waitUntil((async () => { try {
    const cache = await caches.open(CACHE);
    const page = await fetch(new Request('index.html', {cache:'reload'}));
    if(!page.ok) throw new Error('index.html ' + page.status);
    const txt = await page.clone().text();
    // Nur ein vollständiges, zusammenpassendes Paket übernehmen (Server kann kurz alte und neue Dateien mischen)
    if(txt.indexOf("APP_BUILD = '" + BUILD + "'") < 0) throw new Error('index.html gehört nicht zu ' + BUILD);
    await cache.put(new URL('index.html', SCOPE).href, page);
    await Promise.all(PRECACHE.map(async u => { const r = await fetch(new Request(u, {cache:'reload'})); if(!r.ok) throw new Error(u + ' ' + r.status); await cache.put(new URL(u, SCOPE).href, r); }));
  } catch(err){ await caches.delete(CACHE); throw err; } })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for(const k of await caches.keys()) if(k.indexOf('dahuam202-') === 0 && k !== CACHE && k !== RUNTIME) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin || url.href.indexOf(SCOPE) !== 0) return;      // Cloud, fremde Adressen: nicht anfassen
  const path = url.href.slice(SCOPE.length).split(/[?#]/)[0];
  if(path === 'sw.js' || path.indexOf('cloud/') === 0) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(path === '' || path === 'index.html'){
      const hit = await cache.match(new URL('index.html', SCOPE).href);
      if(hit) return hit;
      return fetch(req);
    }
    const hit = await cache.match(new URL(path, SCOPE).href);
    if(hit) return hit;
    // alles andere im Ordner: zuerst Netz, sonst die letzte bekannte Fassung
    try { const r = await fetch(req); if(r.ok && r.type === 'basic'){ const rt = await caches.open(RUNTIME); rt.put(url.href.split('#')[0], r.clone()).catch(() => {}); } return r; }
    catch(err){ const rt = await caches.open(RUNTIME); const old = await rt.match(url.href.split('#')[0]); if(old) return old; throw err; }
  })());
});
