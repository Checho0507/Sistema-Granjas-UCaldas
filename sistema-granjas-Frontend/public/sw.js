const CACHE_NAME = 'granjas-ucaldas-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});

async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Sin conexión', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }
    return new Response('Sin conexión', { status: 503 });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending') event.waitUntil(syncPending());
});

async function syncPending() {
  const db = await openDB();
  const tx = db.transaction('pendingRequests', 'readwrite');
  const store = tx.objectStore('pendingRequests');
  const all = await storeGetAll(store);
  for (const item of all) {
    try {
      const response = await fetch(item.url, {
        method: item.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(item.headers || {}) },
        body: JSON.stringify(item.data),
      });
      if (response.ok) store.delete(item.id);
    } catch {}
  }
  await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
  db.close();
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('GranjasUCaldas', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

console.log('✅ Service Worker v2 activo — Granjas UCaldas');
