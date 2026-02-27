import api from '../api/axios';

// Utility to convert Base64 string to Uint8Array for PushManager
const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getPushPermissionState = async () => {
    if (!isPushSupported()) return 'denied';
    // Firefox doesn't support navigator.permissions.query({name: 'push'}) reliably without userVisibleOnly
    // The simplest cross-browser check is Notification.permission
    return Notification.permission;
};

export const subscribeToPush = async () => {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Push notification permission denied.');
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // 1. Get VAPID Public Key from backend
        const { data } = await api.get('/push/vapid-public-key');
        const applicationServerKey = urlB64ToUint8Array(data.public_key);

        // 2. Subscribe using the PushManager
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        // 3. Send subscription to the backend
        await api.post('/push/subscribe', subscription.toJSON());

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push notifications', error);
        throw error;
    }
};

export const unsubscribeFromPush = async () => {
    if (!isPushSupported()) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // 1. Unsubscribe from the browser PushManager
            await subscription.unsubscribe();

            // 2. Remove from backend
            await api.delete('/push/subscribe', {
                data: { endpoint: subscription.endpoint }
            });
        }
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications', error);
        // Swallow error as this is often called on logout or disable where partial failure is okay
    }
};
