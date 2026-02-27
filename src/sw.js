import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Automatically precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

self.skipWaiting();
clientsClaim();

// Handle incoming push messages
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || 'YugenHub';
        const options = {
            body: data.body || 'You have a new notification.',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png', // Small monochrome icon for Android status bar
            vibrate: [100, 50, 100],
            data: data.data || { url: '/' },
            requireInteraction: false
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error('Error handling push event:', e);
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            let matchingClient = null;
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If it's matching the app exactly, or a subpath
                if (client.url === urlToOpen) {
                    matchingClient = client;
                    break;
                }
            }

            if (matchingClient) {
                // Focus the existing window
                return matchingClient.focus();
            } else {
                // Open a new window
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
