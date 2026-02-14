
import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

function OrgSection({ role }) {
    const { theme } = useTheme();
    const [org, setOrg] = useState({ org_name: '', org_email: '', org_phone: '' });
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [saving, setSaving] = useState(false);
    const isOwner = role === 'owner';

    useEffect(() => {
        api.get('/settings/org').then(r => { setOrg(r.data); setDraft(r.data); });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings/org', draft);
            setOrg(draft);
            setEditing(false);
            toast.success('Organisation updated');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Organisation</h2>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>Manage your agency's identity and contact information</p>
                </div>
                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)} className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl text-sm ${theme.text.secondary} hover:${theme.text.primary} hover:border-zinc-500 transition-colors`}>
                        <Edit3 size={14} /> Edit
                    </button>
                )}
            </div>
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-6 space-y-5`}>
                {[
                    { key: 'org_name', label: 'Organisation Name', icon: Building2, placeholder: 'Your agency name' },
                    { key: 'org_email', label: 'Contact Email', icon: Mail, placeholder: 'contact@agency.com' },
                    { key: 'org_phone', label: 'Contact Phone', icon: Phone, placeholder: '+91 XXXXX XXXXX' },
                ].map(field => (
                    <div key={field.key}>
                        <label className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-2 block`}>{field.label}</label>
                        {editing ? (
                            <input
                                type="text"
                                value={draft[field.key] || ''}
                                onChange={e => setDraft({ ...draft, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-3 ${theme.text.primary} text-sm focus:outline-none focus:border-zinc-500 placeholder:${theme.text.secondary}`}
                            />
                        ) : (
                            <div className={`flex items-center gap-3 px-4 py-3 ${theme.canvas.bg} rounded-xl border border-transparent`}>
                                <field.icon size={16} className={theme.text.secondary} />
                                <span className={`text-sm ${theme.text.primary}`}>{org[field.key] || <span className={`${theme.text.secondary} italic`}>Not set</span>}</span>
                            </div>
                        )}
                    </div>
                ))}
                {editing && (
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 ${theme.text.inverse} bg-black dark:bg-white font-bold text-sm rounded-xl hover:opacity-90 transition-colors disabled:opacity-50`}>
                            <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => { setDraft(org); setEditing(false); }} className={`flex items-center gap-2 px-5 py-2.5 ${theme.canvas.bg} ${theme.text.secondary} text-sm rounded-xl hover:${theme.text.primary} transition-colors border ${theme.canvas.border}`}>
                            <X size={14} /> Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrgSection;
