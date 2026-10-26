/**
 * OS/V — Service Worker para PWA & Notificaciones Push (Teléfono & Chrome)
 * OS/V — Sistema Operativo de Operaciones, Seguimiento & Validación // STGT
 */

const SW_VERSION = '20261026_v988';
const STATIC_CACHE_NAME = `osv-cache-${SW_VERSION}`;

// Recursos esenciales para instalación PWA
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
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
                    if (key !== STATIC_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Manejador de peticiones Fetch (Requisito mandatorio de Chromium para PWA Installability)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Si la petición es externa (CDNs de scripts, Google Fonts, APIs de Firebase, etc.), 
    // NO interceptarla en el Service Worker. Dejar que el navegador la resuelva nativamente sin interferencias.
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
        return;
    }

    // Estrategia Network-First con fallback a Cache
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Clonar y almacenar en caché si es un recurso local exitoso
                if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
                    const responseClone = networkResponse.clone();
                    caches.open(STATIC_CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback en caso de pérdida de conexión
                return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return null;
                });
            })
    );
});

// Receptor de notificaciones Push del Sistema Operativo
self.addEventListener('push', (event) => {
    let payload = {
        title: '🔔 Alerta OS/V',
        body: 'Nueva actualización en el tablero de operaciones.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        url: '/',
        tag: 'osv-alert'
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
        tag: payload.tag || 'osv-alert',
        renotify: true,
        actions: [
            { action: 'open', title: 'Abrir OS/V' }
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
            // Si ya hay una pestaña de OS/V abierta, enfocarla
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
