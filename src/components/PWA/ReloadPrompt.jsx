import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('App ready to work offline', {
                id: 'pwa-offline',
                duration: 3000,
                onAutoClose: () => setOfflineReady(false),
                onDismiss: () => setOfflineReady(false),
            });
        }
    }, [offlineReady, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast('Update Available', {
                id: 'pwa-update',
                duration: Infinity, // Important: don't auto-dismiss an update
                icon: <RefreshCw className="animate-spin" size={16} />,
                description: 'A new version of Yugenhub is available.',
                action: {
                    label: 'Reload',
                    onClick: () => updateServiceWorker(true),
                },
                onDismiss: () => setNeedRefresh(false),
            });
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker]);

    return null; // This component strictly listens and fires toasts, renders nothing
}
