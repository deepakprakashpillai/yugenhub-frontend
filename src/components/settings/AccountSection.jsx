import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

function AccountSection() {
    const { theme } = useTheme();
    const { updateUser } = useAuth();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '' });
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const fetchAccount = async () => {
            setLoading(true);
            try {
                const res = await api.get('/settings/account');
                setAccount(res.data);
                setForm({ name: res.data.name || '', phone: res.data.phone || '' });
            } catch {
                toast.error('Failed to load account');
            } finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, []);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        setSaving(true);
        try {
            await api.patch('/settings/account', form);
            toast.success('Profile updated');
            setDirty(false);
            setAccount(prev => ({ ...prev, ...form }));
            // Update auth context so sidebar etc. reflect changes immediately
            updateUser(form);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className={`animate-spin ${theme.text.secondary}`} />
        </div>
    );

    const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Member' };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                    My Account
                </h2>
                <p className={`${theme.text.secondary} mt-2 max-w-xl`}>
                    View and update your personal profile information.
                </p>
            </div>

            {/* Profile Card */}
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-4 md:p-8 max-w-2xl`}>
                {/* Avatar & Role Badge */}
                <div className="flex items-center gap-5 mb-8">
                    <div className={`w-16 h-16 rounded-2xl ${theme.canvas.bg} border ${theme.canvas.border} flex items-center justify-center text-2xl font-bold ${theme.text.secondary} overflow-hidden shadow-inner shrink-0`}>
                        {account?.picture ? (
                            <img src={account.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            account?.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${theme.text.primary}`}>{account?.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 mt-1 rounded-lg border ${account?.role === 'owner' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                            account?.role === 'admin' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                                'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                            }`}>
                            {ROLE_LABELS[account?.role] || 'Member'}
                        </span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className={`block text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide mb-2`}>
                            Display Name
                        </label>
                        <div className="relative">
                            <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} />
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => handleChange('name', e.target.value)}
                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl pl-10 pr-4 py-3 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-all`}
                            />
                        </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className={`block text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide mb-2`}>
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} />
                            <input
                                type="email"
                                value={account?.email || ''}
                                readOnly
                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl pl-10 pr-4 py-3 text-sm ${theme.text.secondary} cursor-not-allowed opacity-60`}
                            />
                        </div>
                        <p className={`text-[10px] ${theme.text.secondary} mt-1.5 ml-1`}>Managed by Google. Cannot be changed here.</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={`block text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide mb-2`}>
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.text.secondary}`} />
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                                placeholder="Enter phone number"
                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl pl-10 pr-4 py-3 text-sm ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-zinc-500 transition-all`}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-zinc-800 mt-6">
                    <button
                        onClick={handleSave}
                        disabled={!dirty || saving}
                        className={`px-6 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20`}
                    >
                        {saving ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccountSection;
