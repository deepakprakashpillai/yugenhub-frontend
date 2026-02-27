import { useState, useEffect } from 'react';
import { Shield, Eye, IndianRupee, X, Loader2, Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

export default function ManageAccessModal({ isOpen, onClose, user, onUpdated }) {
    const { config } = useAgencyConfig();
    const allVerticals = config?.verticals || [];

    const [allowedVerticals, setAllowedVerticals] = useState([]);
    const [financeAccess, setFinanceAccess] = useState(false);
    const [canManageTeam, setCanManageTeam] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setAllowedVerticals(user.allowed_verticals || []);
            setFinanceAccess(user.finance_access || false);
            setCanManageTeam(user.can_manage_team || false);
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const isAll = allowedVerticals.length === 0;

    const toggleVertical = (verticalId) => {
        if (isAll) {
            // Currently "all" → click means "remove just this one"
            setAllowedVerticals(allVerticals.map(v => v.id).filter(id => id !== verticalId));
        } else if (allowedVerticals.includes(verticalId)) {
            // Remove this vertical
            const newList = allowedVerticals.filter(id => id !== verticalId);
            // If removing last one, reset to all
            setAllowedVerticals(newList.length === 0 ? [] : newList);
        } else {
            // Add this vertical
            const newList = [...allowedVerticals, verticalId];
            // If all are now selected, reset to empty (= all)
            setAllowedVerticals(newList.length === allVerticals.length ? [] : newList);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/settings/team/${user.id}/access`, {
                allowed_verticals: allowedVerticals,
                finance_access: financeAccess,
                can_manage_team: canManageTeam,
            });
            toast.success('Access updated');
            onUpdated?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update access');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Access and Permissions</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">{user.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Vertical Access */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                                <Eye size={14} /> Vertical Access
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isAll
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {isAll ? 'All Verticals' : `${allowedVerticals.length} of ${allVerticals.length}`}
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">
                            Choose which verticals this member can see and manage. Empty selection grants access to all.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {allVerticals.map(v => {
                                const isActive = isAll || allowedVerticals.includes(v.id);
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => toggleVertical(v.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15'
                                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${isActive
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'border-zinc-700'
                                            }`}>
                                            {isActive && <Check size={10} className="text-white" />}
                                        </div>
                                        <span className="truncate">{v.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Finance Access */}
                    <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                            <IndianRupee size={14} /> Finance Access
                        </div>
                        <button
                            onClick={() => setFinanceAccess(!financeAccess)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${financeAccess
                                ? 'bg-emerald-500/10 border-emerald-500/25'
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div>
                                <p className={`text-sm font-medium ${financeAccess ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                    {financeAccess ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Allow access to financial data and reports
                                </p>
                            </div>
                            <div className={`relative w-10 h-5 rounded-full transition-colors ${financeAccess ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${financeAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Permissions (Admin Only) */}
                    {user.role === 'admin' && (
                        <div className="pt-4 border-t border-zinc-800">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                                <Shield size={14} /> Administrative Permissions
                            </div>
                            <button
                                onClick={() => setCanManageTeam(!canManageTeam)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${canManageTeam
                                    ? 'bg-purple-500/10 border-purple-500/25'
                                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className={`text-sm font-medium ${canManageTeam ? 'text-purple-400' : 'text-zinc-400'}`}>
                                        Team Management {canManageTeam ? 'Enabled' : 'Disabled'}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                        Allow inviting, removing, and changing roles of members
                                    </p>
                                </div>
                                <div className={`relative w-10 h-5 rounded-full transition-colors ${canManageTeam ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${canManageTeam ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Shield size={16} /> Save Access
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
