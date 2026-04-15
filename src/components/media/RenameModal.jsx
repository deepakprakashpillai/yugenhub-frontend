import { useState, useEffect } from 'react';
import Modal from '../modals/Modal';
import { useTheme } from '../../context/ThemeContext';

export default function RenameModal({ isOpen, onClose, item, type = 'file', onRename }) {
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && item) setName(item.name);
    }, [isOpen, item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || name.trim() === item?.name) return;
        setLoading(true);
        try {
            await onRename(name.trim());
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Rename ${type === 'folder' ? 'Folder' : 'File'}`} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={`text-xs font-semibold ${theme.text.secondary} block mb-1.5`}>Name</label>
                    <input
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border ${theme.canvas.border} ${theme.canvas.card} ${theme.text.primary} text-sm outline-none focus:border-accent/50 transition-colors`}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2 rounded-xl text-sm ${theme.canvas.hover} ${theme.text.secondary} transition-colors`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !name.trim() || name.trim() === item?.name}
                        className="px-4 py-2 rounded-xl text-sm bg-accent text-white font-semibold disabled:opacity-40 transition-opacity"
                    >
                        {loading ? 'Renaming…' : 'Rename'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
