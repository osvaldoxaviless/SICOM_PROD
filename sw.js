/**
 * EO/SA — Service Worker para PWA & Notificaciones Push (Teléfono & Chrome)
 * EO/SA — Enterprise Operations & Systems Architecture // STGT
 */

const SW_VERSION = '20261028_v1017';
const STATIC_CACHE_NAME = `eosa-cache-${SW_VERSION}`;

// Recursos esenciales para instalación PWA
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-maskable-192.png',
    '/icon-maskable-512.png',
    '/icon.svg'
];

self.addEventListener('install', (event) => {
    // Pre-cachear los recursos mínimos para garantizar criterio PWA inmediato
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('⚠️ [SW] No se pudieron pre-cachear todos los recursos:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    // Tomar control inmediato y purgar cachés antiguas
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== STATIC_CACHE_NAME && key !== CDN_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Hosts de CDN: stale-while-revalidate para que la app arranque offline con estilos y librerias
const CDN_CACHE_NAME = `eosa-cdn-${SW_VERSION}`;
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdn.jsdelivr.net', 'www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Manejador de peticiones Fetch (Requisito mandatorio de Chromium para PWA Installability)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (CDN_HOSTS.includes(url.hostname)) {
        event.respondWith(caches.open(CDN_CACHE_NAME).then(async (cache) => {
            const hit = await cache.match(event.request);
            const net = fetch(event.request).then((r) => {
                if (r && (r.ok || r.type === 'opaque')) cache.put(event.request, r.clone());
                return r;
            }).catch(() => null);
            return hit || (await net) || Response.error();
        }));
        return;
    }

    // Otras peticiones externas (APIs de Firebase, etc.): NO interceptar.
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    // Estrategia Network-First con fallback a Cache
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    event.waitUntil(caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, responseClone)));
                }
                return networkResponse;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
                if (cachedResponse) return cachedResponse;
                if (event.request.mode === 'navigate') {
                    return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
                }
                return new Response('', { status: 504, statusText: 'Offline' });
            })
    );
});

// Background Sync: despierta una pestana abierta para vaciar la cola de escritura pendiente
self.addEventListener('sync', (event) => {
    if (event.tag !== 'sicom-sync') return;
    event.waitUntil((async () => {
        const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (!wins.length) throw new Error('sin cliente abierto; el navegador reintentara');
        wins.forEach((c) => c.postMessage({ type: 'SICOM_FLUSH' }));
    })());
});
// Receptor de notificaciones Push del Sistema Operativo
self.addEventListener('push', (event) => {
    let payload = {
        title: '🔔 Alerta EO/SA',
        body: 'Nueva actualización en el tablero de operaciones.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        url: '/',
        tag: 'eosa-alert'
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            payload = Object.assign(payload, parsed);
        } catch (e) {
            payload.body = event.data.text() || payload.body;
        }
    }

    const notificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        // Patrón de vibración táctil para móvil: vibrar 200ms, pausa 100ms, vibrar 200ms
        vibrate: [200, 100, 200, 100, 250],
        data: {
            url: payload.url || '/',
            timestamp: Date.now()
        },
        tag: payload.tag || 'eosa-alert',
        renotify: true,
        actions: [
            { action: 'open', title: 'Abrir EO/SA' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, notificationOptions)
    );
});

// Acción al presionar la notificación (Móvil o Desktop)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si ya hay una pestaña de EO/SA abierta, enfocarla
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if ('focus' in client) {
                    return client.focus().then(() => {
                        if (targetUrl && targetUrl !== '/' && 'navigate' in client) {
                            return client.navigate(targetUrl);
                        }
                    });
                }
            }
            // Si no hay ninguna abierta, abrir una nueva ventana con la URL
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
