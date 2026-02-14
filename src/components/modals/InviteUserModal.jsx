import { useState } from 'react';
import { Mail, Shield, UserPlus, X, ChevronRight, Check } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function InviteUserModal({ isOpen, onClose, onInvited }) {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            await api.post('/settings/team/invite', { email: email.trim(), role });
            toast.success(`Invitation sent to ${email}`);
            setEmail('');
            setRole('member');
            onInvited?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-5 border-b ${theme.canvas.border} flex items-center justify-between bg-zinc-900/50`}>
                    <div>
                        <h2 className={`text-lg font-bold ${theme.text.primary} flex items-center gap-2`}>
                            <UserPlus size={18} className="text-purple-400" />
                            Invite Member
                        </h2>
                        <p className={`text-xs ${theme.text.secondary} mt-0.5`}>Send an invitation to join your workspace</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-lg ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors`}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide`}>Email Address</label>
                        <div className="relative group">
                            <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.text.secondary} group-focus-within:text-purple-400 transition-colors`} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                required
                                autoFocus
                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl pl-10 pr-4 py-3 text-sm ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all`}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide`}>Role</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { value: 'member', label: 'Member', desc: 'Can view projects, track time, and manage assigned tasks.' },
                                { value: 'admin', label: 'Admin', desc: 'Full access to settings, team management, and all projects.' },
                            ].map(r => (
                                <button
                                    type="button"
                                    key={r.value}
                                    onClick={() => setRole(r.value)}
                                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${role === r.value
                                        ? `bg-zinc-800/80 border-purple-500/50 shadow-inner`
                                        : `${theme.canvas.bg} border-transparent hover:${theme.canvas.hover}`
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${role === r.value ? 'border-purple-500 bg-purple-500' : `border-zinc-600 bg-transparent`
                                        }`}>
                                        {role === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${role === r.value ? theme.text.primary : theme.text.secondary}`}>
                                            {r.label}
                                        </div>
                                        <div className={`text-xs ${theme.text.secondary} mt-0.5 leading-relaxed pr-8`}>
                                            {r.desc}
                                        </div>
                                    </div>
                                    {role === r.value && (
                                        <div className="absolute top-3 right-3 text-purple-500 animate-in fade-in zoom-in duration-200">
                                            <Shield size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className={`flex-1 ${theme.text.inverse} bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5`}
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Send Invitation <ChevronRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
