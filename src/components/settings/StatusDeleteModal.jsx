import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function StatusDeleteModal({ isOpen, onClose, statusToDelete, allStatuses, onConfirm }) {
    const { theme } = useTheme();
    const [reassignTo, setReassignTo] = useState('');
    const [confirming, setConfirming] = useState(false);

    if (!isOpen || !statusToDelete) return null;

    const availableStatuses = allStatuses.filter(s => s.id !== statusToDelete.id);

    const handleConfirm = async () => {
        if (!reassignTo) return;
        setConfirming(true);
        try {
            await onConfirm(statusToDelete.id, reassignTo);
        } finally {
            setConfirming(false);
            setReassignTo('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-md mx-4 shadow-2xl`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${theme.canvas.border}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                            <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        <h3 className={`text-lg font-bold ${theme.text.primary}`}>Delete Status</h3>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:${theme.text.primary} transition-colors`}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: statusToDelete.color }} />
                        <span className={`${theme.text.primary} font-medium`}>{statusToDelete.label}</span>
                    </div>

                    {statusToDelete.usageCount > 0 ? (
                        <p className={`text-sm ${theme.text.secondary}`}>
                            <span className="text-red-400 font-bold">{statusToDelete.usageCount} project{statusToDelete.usageCount !== 1 ? 's' : ''}</span> currently
                            {statusToDelete.usageCount !== 1 ? ' have' : ' has'} this status.
                            Select a status to reassign them to:
                        </p>
                    ) : (
                        <p className={`text-sm ${theme.text.secondary}`}>
                            No projects use this status. Select a fallback status for safety:
                        </p>
                    )}

                    <select
                        value={reassignTo}
                        onChange={e => setReassignTo(e.target.value)}
                        className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-3 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-colors`}
                    >
                        <option value="">Choose a status...</option>
                        {availableStatuses.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </div>

                {/* Footer */}
                <div className={`flex gap-3 p-6 border-t ${theme.canvas.border}`}>
                    <button
                        onClick={onClose}
                        className={`flex-1 px-4 py-2.5 ${theme.canvas.button.secondary} text-sm rounded-xl transition-colors`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reassignTo || confirming}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {confirming ? 'Deleting...' : 'Delete & Reassign'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StatusDeleteModal;
