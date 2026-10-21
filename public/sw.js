const CACHE = 'sanad-v5';
const PRECACHE = ['/', '/offline', '/cart', '/manifest.json', '/icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline')))
    );
    return;
  }

  if (req.destination === 'image' || url.hostname.includes('supabase.co')) {
    if (url.pathname.includes('/storage/')) {
      e.respondWith(
        caches.match(req).then((cached) =>
          cached || fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
        )
      );
    }
    return;
  }

  if (url.origin === self.location.origin && /\.(js|css|woff2?|ttf)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => { cache.put(req, res.clone()).catch(() => {}); return res; });
        return cached || network;
      })
    );
  }
});

// 🔔 Push Notifications
self.addEventListener('push', (e) => {
  let data = { title: 'سند', body: 'لديك إشعار جديد', link: '/' };
  try { if (e.data) data = e.data.json(); } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title || 'سند', {
      body: data.body || '',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: 'sanad-' + Date.now(),
      data: { link: data.link || '/' },
      vibrate: [200, 100, 200],
      renotify: true, // ✅ يضمن تشغيل الصوت والاهتزاز
      requireInteraction: true, // ✅ الإشعار يبقى حتى يتفاعل المستخدم
    })
  );
});

// 🖱️ فتح التطبيق عند الضغط على الإشعار
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const link = e.notification.data?.link || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
