// ═══════════ Sanad Service Worker v2 ═══════════
const CACHE = 'sanad-v2';
const OFFLINE_URLS = ['/', '/offline', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.url.includes('supabase.co')) return;
  if (request.url.includes('chrome-extension')) return;
  if (request.url.startsWith('http') && !request.url.startsWith(self.location.origin) && !request.url.includes('supabase')) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline'))
      )
  );
});

// ← استقبال Push من الخادم
self.addEventListener('push', (event) => {
  let data = { title: 'سند', body: 'لديك إشعار جديد' };
  try { if (event.data) data = event.data.json(); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'سند', {
      body: data.body || '',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'sanad',
      data: data.url || '/',
    })
  );
});

// ← فتح التطبيق عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const c of clients) {
        if (c.url === url && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
