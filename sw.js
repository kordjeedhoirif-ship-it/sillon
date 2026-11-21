// Sillon service worker: app shell offline, Essentia and fonts cached after first use.
const SHELL = "sillon-shell-v3", RUNTIME = "sillon-runtime-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![SHELL, RUNTIME].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // the page itself: network first so updates arrive, cache as fallback offline
  if (url.origin === location.origin){
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  // Essentia library and fonts: cache first (they never change at a pinned version)
  if (/cdn\.jsdelivr\.net\/npm\/essentia\.js@0\.1\.3|fonts\.(googleapis|gstatic)\.com/.test(url.href)){
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === "opaque"){ const copy = r.clone(); caches.open(RUNTIME).then(c => c.put(e.request, copy)); } return r; })));
  }
  // everything else (Deezer, iTunes, Last.fm, audio previews) goes straight to the network
});
