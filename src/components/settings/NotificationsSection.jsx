
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { ShieldAlert } from 'lucide-react';
import { subscribeToPush, unsubscribeFromPush, getPushPermissionState, isPushSupported } from '../../utils/pushNotifications';

function NotificationsSection() {
    const { theme } = useTheme();
    const [prefs, setPrefs] = useState({});
    const [saving, setSaving] = useState(null);
    const [pushSupported] = useState(isPushSupported());
    const [pushPermission, setPushPermission] = useState('prompt');

    useEffect(() => {
        api.get('/settings/notifications').then(r => setPrefs(r.data));
        if (pushSupported) {
            getPushPermissionState().then(setPushPermission);
        }
    }, [pushSupported]);

    const handlePushToggle = async (newValue) => {
        setSaving('push_notifications');
        try {
            if (newValue) {
                await subscribeToPush();
                setPushPermission('granted');
            } else {
                await unsubscribeFromPush();
            }
            await api.patch('/settings/notifications', { push_notifications: newValue });
            setPrefs({ ...prefs, push_notifications: newValue });
            toast.success(newValue ? 'Push notifications enabled' : 'Push notifications disabled');
        } catch (error) {
            console.error(error);
            if (error.message.includes('denied') || Notification.permission === 'denied') {
                setPushPermission('denied');
                toast.error('Push permission denied. Please enable it in your browser settings.');
            } else {
                toast.error('Failed to configure push notifications');
            }
        } finally {
            setSaving(null);
        }
    };

    const toggle = async (key) => {
        const newValue = !prefs[key];

        if (key === 'push_notifications') {
            await handlePushToggle(newValue);
            return;
        }

        setSaving(key);
        try {
            await api.patch('/settings/notifications', { [key]: newValue });
            setPrefs({ ...prefs, [key]: newValue });
        } catch {
            toast.error('Failed to update');
        } finally {
            setSaving(null);
        }
    };

    const toggles = [
        { key: 'task_assigned', label: 'Task Assigned', desc: 'When a task is assigned to you' },
        { key: 'task_updated', label: 'Task Updated', desc: 'When a task you\'re involved in is updated' },
        { key: 'project_created', label: 'Project Created', desc: 'When a new project is created' },
        { key: 'project_completed', label: 'Project Completed', desc: 'When a project is marked complete' },
        { key: 'mentions', label: 'Mentions', desc: 'When you are mentioned in comments' },
        { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Notifications</h2>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>Control how and when you receive notifications</p>
            </div>

            {pushSupported && (
                <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-6 mb-6`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-bold ${theme.text.primary} flex items-center gap-2`}>
                                Browser Push Notifications
                                {pushPermission === 'denied' && <ShieldAlert size={14} className="text-red-500" />}
                            </p>
                            <p className={`text-xs ${theme.text.secondary} mt-1`}>
                                {pushPermission === 'denied'
                                    ? 'Permission denied. Please enable in browser settings.'
                                    : 'Receive notifications even when the app is closed'}
                            </p>
                        </div>
                        <button
                            onClick={() => toggle('push_notifications')}
                            disabled={saving === 'push_notifications' || pushPermission === 'denied'}
                            className={`relative w-11 h-6 rounded-full transition-colors ${prefs?.push_notifications ? 'bg-emerald-500' : theme.mode === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'} ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${prefs?.push_notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            )}

            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl divide-y ${theme.canvas.border}`}>
                {toggles.map(t => (
                    <div key={t.key} className="flex items-center justify-between px-6 py-4">
                        <div>
                            <p className={`text-sm font-medium ${theme.text.primary}`}>{t.label}</p>
                            <p className={`text-xs ${theme.text.secondary} mt-0.5`}>{t.desc}</p>
                        </div>
                        <button
                            onClick={() => toggle(t.key)}
                            disabled={saving === t.key}
                            className={`relative w-11 h-6 rounded-full transition-colors ${prefs[t.key] ? 'bg-emerald-500' : theme.mode === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'}`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${prefs[t.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NotificationsSection;
