import { useState } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName, loading = false }) => {
    const [confirmText, setConfirmText] = useState('');
    const requiresConfirmation = itemName && itemName.length > 0;
    const isConfirmed = !requiresConfirmation || confirmText.toLowerCase() === 'delete';

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm();
        }
    };

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title || 'Confirm Delete'} size="sm">
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Icons.AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                {/* Message */}
                <p className="text-zinc-300 text-center">
                    {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
                </p>

                {/* Item Name */}
                {itemName && (
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                        <span className="text-white font-medium">{itemName}</span>
                    </div>
                )}

                {/* Type to Confirm */}
                {requiresConfirmation && (
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Type <span className="text-red-400 font-mono">delete</span> to confirm:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="delete"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmed || loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icons.Loader className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Icons.Trash className="w-4 h-4" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDeleteModal;
