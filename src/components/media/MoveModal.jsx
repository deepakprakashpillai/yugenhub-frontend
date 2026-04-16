import { useState } from 'react';
import Modal from '../modals/Modal';
import FolderTree from './FolderTree';
import { useTheme } from '../../context/ThemeContext';

export default function MoveModal({ isOpen, onClose, item, folders, onMove }) {
    const { theme } = useTheme();
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleMove = async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            await onMove(selectedId);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Move to Folder" size="sm">
            <div className="space-y-4">
                <p className={`text-xs ${theme.text.secondary}`}>
                    Moving: <span className={`font-semibold ${theme.text.primary}`}>{item?.name}</span>
                </p>
                <div className={`rounded-xl border ${theme.canvas.border} ${theme.canvas.card} p-2 max-h-80 overflow-y-auto`}>
                    <FolderTree
                        folders={folders}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
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
                        onClick={handleMove}
                        disabled={loading || !selectedId}
                        className="px-4 py-2 rounded-xl text-sm bg-accent text-white font-semibold disabled:opacity-40 transition-opacity"
                    >
                        {loading ? 'Moving…' : 'Move Here'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
