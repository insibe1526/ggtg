const CACHE = 'demo-pwa-v1';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'ding.wav',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).catch(() => {
      if (evt.request.mode === 'navigate') return caches.match('index.html');
    }))
  );
});

// Обработчик push (показан пример — для реального пуша нужна серверная часть)
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch(e){ data = { title: 'Уведомление', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'DemoPWA';
  const options = {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    data: data.url || './'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) if (c.url === event.notification.data && 'focus' in c) return c.focus();
      if (clients.openWindow) return clients.openWindow(event.notification.data || './');
    })
  );
});