import { useState, useEffect, useCallback } from 'react';
import Modal from '../modals/Modal';
import FolderTree from './FolderTree';
import { Image, Video, FileText, File } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import * as mediaApi from '../../api/media';
import { toast } from 'sonner';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function PickerFileCard({ item, selected, onSelect }) {
    const { theme } = useTheme();
    const isImage = item.content_type?.startsWith('image/');
    const isVideo = item.content_type?.startsWith('video/');
    const isPdf = item.content_type === 'application/pdf';

    return (
        <button
            onClick={() => onSelect(item)}
            className={`
                relative w-full rounded-xl border text-left transition-all overflow-hidden
                ${selected
                    ? 'border-accent ring-2 ring-accent/30'
                    : `${theme.canvas.border} ${theme.canvas.hover}`}
            `}
        >
            {/* Thumbnail */}
            <div className={`aspect-square flex items-center justify-center ${theme.canvas.bg}`}>
                {item.thumbnail_r2_url && item.thumbnail_status === 'done' ? (
                    <img
                        src={item.thumbnail_r2_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : isImage ? (
                    <Image size={24} className={theme.text.secondary} />
                ) : isVideo ? (
                    <Video size={24} className={theme.text.secondary} />
                ) : isPdf ? (
                    <FileText size={24} className={theme.text.secondary} />
                ) : (
                    <File size={24} className={theme.text.secondary} />
                )}
                {selected && (
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            {/* Name + size */}
            <div className="px-2 py-1.5">
                <p className={`text-[11px] font-medium truncate ${theme.text.primary}`}>{item.name}</p>
                <p className={`text-[10px] ${theme.text.secondary}`}>{formatBytes(item.size_bytes)}</p>
            </div>
        </button>
    );
}

export default function MediaPickerModal({ isOpen, onClose, onSelect }) {
    const { theme } = useTheme();
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [items, setItems] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [selected, setSelected] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const loadFolders = useCallback(async () => {
        try {
            setLoadingFolders(true);
            const data = await mediaApi.getFolderTree();
            setFolders(data);
        } catch {
            toast.error('Failed to load folders');
        } finally {
            setLoadingFolders(false);
        }
    }, []);

    const loadItems = useCallback(async (folderId) => {
        if (!folderId) { setItems([]); return; }
        try {
            setLoadingItems(true);
            const data = await mediaApi.getFolderItems(folderId);
            // Only show image, video, pdf files
            const all = data.data ?? [];
            setItems(all.filter(item =>
                item.content_type?.startsWith('image/') ||
                item.content_type?.startsWith('video/') ||
                item.content_type === 'application/pdf'
            ));
        } catch {
            toast.error('Failed to load files');
        } finally {
            setLoadingItems(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
            setSelected(null);
            setCurrentFolderId(null);
            setItems([]);
        }
    }, [isOpen, loadFolders]);

    useEffect(() => {
        loadItems(currentFolderId);
    }, [currentFolderId, loadItems]);

    const handleConfirm = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await onSelect(selected);
            onClose();
        } catch {
            // onSelect already showed the error toast; keep modal open
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select from Media" size="lg">
            <div className="flex gap-4 h-[60vh]">
                {/* Left: folder tree */}
                <div className={`w-44 shrink-0 border-r ${theme.canvas.border} pr-3 overflow-y-auto`}>
                    {loadingFolders ? (
                        <p className={`text-xs text-center py-6 ${theme.text.secondary}`}>Loading…</p>
                    ) : (
                        <FolderTree
                            folders={folders}
                            selectedId={currentFolderId}
                            onSelect={setCurrentFolderId}
                        />
                    )}
                </div>

                {/* Right: file grid */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto">
                        {!currentFolderId ? (
                            <div className={`flex items-center justify-center h-full ${theme.text.secondary}`}>
                                <p className="text-sm">Select a folder</p>
                            </div>
                        ) : loadingItems ? (
                            <div className={`flex items-center justify-center h-full ${theme.text.secondary}`}>
                                <p className="text-sm animate-pulse">Loading files…</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className={`flex items-center justify-center h-full ${theme.text.secondary}`}>
                                <p className="text-sm">No media files in this folder</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-2">
                                {items.map(item => (
                                    <PickerFileCard
                                        key={item.id}
                                        item={item}
                                        selected={selected?.id === item.id}
                                        onSelect={setSelected}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom action bar */}
                    <div className={`flex items-center justify-between gap-3 pt-3 border-t ${theme.canvas.border} shrink-0`}>
                        <p className={`text-xs ${theme.text.secondary} truncate`}>
                            {selected ? `Selected: ${selected.name}` : 'No file selected'}
                        </p>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-xl text-sm ${theme.canvas.hover} ${theme.text.secondary} transition-colors`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!selected || submitting}
                                className="px-4 py-2 rounded-xl text-sm bg-accent text-white font-semibold disabled:opacity-40 transition-opacity"
                            >
                                {submitting ? 'Attaching…' : 'Select'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
