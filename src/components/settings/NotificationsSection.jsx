
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

function NotificationsSection() {
    const { theme } = useTheme();
    const [prefs, setPrefs] = useState({});
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        api.get('/settings/notifications').then(r => setPrefs(r.data));
    }, []);

    const toggle = async (key) => {
        const newValue = !prefs[key];
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
