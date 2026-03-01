import { useState, useEffect } from 'react';
import { Workflow, Check, X, Bell } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

function AutomationsSection({ role }) {
    const { theme } = useTheme();
    const [automations, setAutomations] = useState({ calendar_enabled: false, calendar_notifications_enabled: false });
    const [draft, setDraft] = useState({ calendar_enabled: false, calendar_notifications_enabled: false });
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const isAdmin = role === 'owner' || role === 'admin';

    useEffect(() => {
        api.get('/settings/automations').then(r => {
            if (r.data?.automations) {
                setAutomations(r.data.automations);
                setDraft(r.data.automations);
            }
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings/automations', { automations: draft });
            setAutomations(draft);
            setEditing(false);
            toast.success('Automations updated');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key) => {
        if (!editing) return;
        setDraft(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Automations</h2>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>Manage system integrations and webhook behaviors</p>
                </div>
                {isAdmin && !editing && (
                    <button onClick={() => setEditing(true)} className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl text-sm ${theme.text.secondary} hover:${theme.text.primary} hover:border-zinc-500 transition-colors`}>
                        Edit
                    </button>
                )}
            </div>

            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-4 md:p-6 space-y-6`}>
                <div className="border-b pb-4 border-white/5">
                    <h3 className={`text-lg font-bold ${theme.text.primary} flex items-center gap-2 mb-1`}>
                        <Workflow size={18} className={theme.text.secondary} /> Calendar Integration
                    </h3>
                    <p className={`text-xs ${theme.text.secondary}`}>
                        Sync your YugenHub events automatically to your external calendar (via n8n webhook).
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Calendar Sync Toggle */}
                    <div className={`flex items-center justify-between p-4 ${theme.canvas.bg} rounded-xl border border-transparent`}>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${theme.text.primary}`}>Enable Calendar Sync</span>
                            <span className={`text-xs ${theme.text.secondary} mt-1`}>When active, project events will be pushed to the calendar webhook.</span>
                        </div>
                        <button
                            onClick={() => handleToggle('calendar_enabled')}
                            disabled={!editing}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.calendar_enabled ? 'bg-red-500' : 'bg-white/10'} ${!editing && 'opacity-60 cursor-not-allowed'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.calendar_enabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    {/* Notifications Toggle */}
                    <div className={`flex items-center justify-between p-4 ${theme.canvas.bg} rounded-xl border border-transparent`}>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${theme.text.primary} flex items-center gap-1.5`}>
                                <Bell size={14} className={theme.text.secondary} />
                                Sync Notifications
                            </span>
                            <span className={`text-xs ${theme.text.secondary} mt-1`}>Receive system notifications when a calendar event successfully syncs.</span>
                        </div>
                        <button
                            onClick={() => handleToggle('calendar_notifications_enabled')}
                            disabled={!editing}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${draft.calendar_notifications_enabled ? 'bg-red-500' : 'bg-white/10'} ${!editing && 'opacity-60 cursor-not-allowed'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${draft.calendar_notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>

                {editing && (
                    <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 ${theme.canvas.button.primary} font-bold text-sm rounded-xl disabled:opacity-50`}>
                            <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => { setDraft(automations); setEditing(false); }} className={`flex items-center gap-2 px-5 py-2.5 ${theme.canvas.bg} ${theme.text.secondary} text-sm rounded-xl hover:${theme.text.primary} transition-colors border ${theme.canvas.border}`}>
                            <X size={14} /> Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AutomationsSection;
