import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, User, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as commApi from '../../api/communications';
import { getClients } from '../../api/clients';
import api from '../../api/axios';

export default function SettingsTab({ theme }) {
    // eslint-disable-next-line no-unused-vars
    const [settings, setSettings] = useState(null);
    const [alertTypes, setAlertTypes] = useState([]);
    const [clients, setClients] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [globalEnabled, setGlobalEnabled] = useState([]);
    const [clientOverrides, setClientOverrides] = useState({});
    const [operatorOverrides, setOperatorOverrides] = useState({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [s, types, cls, team] = await Promise.all([
                    commApi.getSettings(),
                    commApi.getAlertTypes(),
                    getClients(),
                    api.get('/settings/team').then(r => r.data).catch(() => []),
                ]);
                setSettings(s);
                setAlertTypes(types);
                setClients(Array.isArray(cls) ? cls : (cls.data || []));
                setTeamMembers(Array.isArray(team) ? team : []);
                setGlobalEnabled(s.globally_enabled_types || types.map(t => t.value));
                setClientOverrides(s.client_overrides || {});
                setOperatorOverrides(s.operator_overrides || {});
            } catch {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await commApi.updateSettings({
                globally_enabled_types: globalEnabled,
                client_overrides: clientOverrides,
                operator_overrides: operatorOverrides,
            });
            toast.success('Settings saved');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleGlobalType = (type) => {
        setGlobalEnabled(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const getClientOverride = (cid) => clientOverrides[cid] || { excluded: false, disabled_types: [] };
    const setClientOverride = (cid, val) => setClientOverrides(prev => ({ ...prev, [cid]: val }));

    const getOpOverride = (uid) => operatorOverrides[uid] || { excluded: false, hidden_types: [] };
    const setOpOverride = (uid, val) => setOperatorOverrides(prev => ({ ...prev, [uid]: val }));

    if (loading) {
        return (
            <div className="py-16 text-center">
                <RefreshCw size={20} className={`animate-spin mx-auto ${theme.text.secondary}`} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Global alert types */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <Settings size={15} className="text-violet-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Globally Enabled Alert Types</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Uncheck a type to stop generating those messages entirely for your agency.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {alertTypes.map(type => {
                        const on = globalEnabled.includes(type.value);
                        return (
                            <button
                                key={type.value}
                                onClick={() => toggleGlobalType(type.value)}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${on
                                    ? 'bg-violet-500/10 border-violet-500/25'
                                    : `${theme.canvas.bg} border-zinc-700 opacity-50`
                                    }`}
                            >
                                <span className={`text-xs font-medium ${on ? 'text-violet-300' : theme.text.secondary}`}>
                                    {type.label}
                                </span>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'}`}>
                                    {on && <span className="text-white text-[9px]">✓</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Per-client overrides */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <Users size={15} className="text-blue-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Per-Client Overrides</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Exclude a client entirely or disable specific alert types for them.
                </p>
                <div className="space-y-3">
                    {clients.map(client => {
                        const cid = client._id;
                        const ov = getClientOverride(cid);
                        return (
                            <div key={cid} className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className={`text-xs font-semibold ${theme.text.primary}`}>{client.name}</p>
                                        <p className={`text-[10px] ${theme.text.secondary}`}>{client.whatsapp_number || client.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => setClientOverride(cid, { ...ov, excluded: !ov.excluded })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all ${ov.excluded
                                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                            : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                            }`}
                                    >
                                        <AlertTriangle size={10} />
                                        {ov.excluded ? 'Excluded' : 'Exclude'}
                                    </button>
                                </div>
                                {!ov.excluded && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {alertTypes.map(type => {
                                            const disabled = (ov.disabled_types || []).includes(type.value);
                                            return (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        const newDisabled = disabled
                                                            ? ov.disabled_types.filter(t => t !== type.value)
                                                            : [...(ov.disabled_types || []), type.value];
                                                        setClientOverride(cid, { ...ov, disabled_types: newDisabled });
                                                    }}
                                                    className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${disabled
                                                        ? 'bg-red-500/10 border-red-500/25 text-red-400 line-through'
                                                        : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {clients.length === 0 && (
                        <p className={`text-xs ${theme.text.secondary} text-center py-4`}>No clients yet</p>
                    )}
                </div>
            </section>

            {/* Per-operator overrides */}
            <section className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                    <User size={15} className="text-amber-400" />
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Per-Team-Member Overrides</h3>
                </div>
                <p className={`text-xs ${theme.text.secondary} mb-4`}>
                    Control which alert types are visible to specific team members in their queue view.
                </p>
                <div className="space-y-3">
                    {teamMembers.filter(m => m.role !== 'owner').map(member => {
                        const ov = getOpOverride(member.id);
                        return (
                            <div key={member.id} className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-xl p-4`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className={`text-xs font-semibold ${theme.text.primary}`}>{member.name}</p>
                                        <p className={`text-[10px] ${theme.text.secondary}`}>{member.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setOpOverride(member.id, { ...ov, excluded: !ov.excluded })}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all ${ov.excluded
                                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                            : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                            }`}
                                    >
                                        <AlertTriangle size={10} />
                                        {ov.excluded ? 'Hidden' : 'Hide all'}
                                    </button>
                                </div>
                                {!ov.excluded && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {alertTypes.map(type => {
                                            const hidden = (ov.hidden_types || []).includes(type.value);
                                            return (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        const newHidden = hidden
                                                            ? ov.hidden_types.filter(t => t !== type.value)
                                                            : [...(ov.hidden_types || []), type.value];
                                                        setOpOverride(member.id, { ...ov, hidden_types: newHidden });
                                                    }}
                                                    className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${hidden
                                                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 line-through'
                                                        : `${theme.canvas.card} border-zinc-700 ${theme.text.secondary}`
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {teamMembers.filter(m => m.role !== 'owner').length === 0 && (
                        <p className={`text-xs ${theme.text.secondary} text-center py-4`}>No team members yet</p>
                    )}
                </div>
            </section>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
                >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
