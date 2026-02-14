import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function RemoveUserModal({ isOpen, onClose, user, onRemoved }) {
    const [loading, setLoading] = useState(false);
    const [confirmName, setConfirmName] = useState('');

    if (!isOpen || !user) return null;

    const handleRemove = async () => {
        if (confirmName !== user.name) return;

        setLoading(true);
        try {
            await api.delete(`/settings/team/${user.id}`);
            toast.success(`${user.name} removed from team`);
            onRemoved?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to remove user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Red Warning Strip */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Remove Team Member?</h3>
                            <p className="text-sm text-zinc-400">This action cannot be undone.</p>
                        </div>
                    </div>

                    <div className="space-y-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                {user.picture ? (
                                    <img src={user.picture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                        {user.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-white font-medium">{user.name}</div>
                                <div className="text-xs text-zinc-500">{user.email}</div>
                            </div>
                            <div className="ml-auto px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                                {user.role}
                            </div>
                        </div>

                        <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                            <strong>⚠️ Safety Warning:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1 opacity-90 text-xs">
                                <li>Any tasks currently assigned to this user will remain assigned to their ID.</li>
                                <li>These tasks may appear as "Assigned to Unknown" or have broken avatars.</li>
                                <li>Please reassign their active tasks before proceeding if possible.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-xs text-zinc-500 block mb-2">
                            Type <span className="font-mono text-white font-bold select-none">{user.name}</span> to confirm
                        </label>
                        <input
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all outline-none"
                            placeholder="Type name here..."
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRemove}
                            disabled={confirmName !== user.name || loading}
                            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Removing...' : 'Remove Member'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
