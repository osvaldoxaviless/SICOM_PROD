/**
 * SICOM — Service Worker para Notificaciones Push (Teléfono & Chrome)
 * STGT Control Surface
 */

const SW_VERSION = '20261017_v1';

self.addEventListener('install', (event) => {
    // Activar inmediatamente el nuevo Service Worker sin esperar a recargar
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Tomar control inmediato de todas las pestañas abiertas
    event.waitUntil(self.clients.claim());
});

// Receptor de notificaciones Push del Sistema Operativo
self.addEventListener('push', (event) => {
    let payload = {
        title: '🔔 Alerta SICOM',
        body: 'Nueva actualización en el tablero de operaciones.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        url: '/',
        tag: 'sicom-alert'
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
        icon: payload.icon || '/icon.svg',
        badge: payload.badge || '/icon.svg',
        // Patrón de vibración táctil para móvil: vibrar 200ms, pausa 100ms, vibrar 200ms
        vibrate: [200, 100, 200, 100, 250],
        data: {
            url: payload.url || '/',
            timestamp: Date.now()
        },
        tag: payload.tag || 'sicom-alert',
        renotify: true,
        actions: [
            { action: 'open', title: 'Abrir SICOM' }
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
            // Si ya hay una pestaña de SICOM abierta, enfocarla
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
