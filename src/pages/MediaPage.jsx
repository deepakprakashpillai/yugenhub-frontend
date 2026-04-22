import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LayoutGrid, List, Upload, Search, FolderPlus, X, Menu, ArrowUpDown, Trash2, FolderInput, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FolderTree from '../components/media/FolderTree';
import FileGrid from '../components/media/FileGrid';
import FileList from '../components/media/FileList';
import Breadcrumb from '../components/media/Breadcrumb';
import RenameModal from '../components/media/RenameModal';
import MoveModal from '../components/media/MoveModal';
import ShareModal from '../components/media/ShareModal';
import ShareFolderModal from '../components/media/ShareFolderModal';
import FileInfoPanel from '../components/media/FileInfoPanel';
import MediaLightbox from '../components/media/MediaLightbox';
import R2UsageWidget from '../components/media/R2UsageWidget';
import * as mediaApi from '../api/media';
import { ConfirmModal } from '../components/modals';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'application/pdf',
]);

// ─── Upload helpers ────────────────────────────────────────────────────────────

async function uploadFile(file, folderId) {
    const { upload_url, media_item_id } = await mediaApi.getUploadUrl(file.name, file.type, folderId);
    const r2Response = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
    });
    if (!r2Response.ok) throw new Error(`Upload failed: ${r2Response.status}`);
    await mediaApi.registerFile(media_item_id, file.size);
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MediaPage() {
    const { theme } = useTheme();
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth();

    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [items, setItems] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [sortBy, setSortBy] = useState(() => localStorage.getItem('media_sort') || 'date_desc');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameFolderTarget, setRenameFolderTarget] = useState(null);
    const [moveTarget, setMoveTarget] = useState(null);
    const [bulkMoveActive, setBulkMoveActive] = useState(false);
    const [shareTarget, setShareTarget] = useState(null);
    const [shareFolderTarget, setShareFolderTarget] = useState(null);
    const [infoTarget, setInfoTarget] = useState(null);
    const [lightboxItem, setLightboxItem] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeDragItem, setActiveDragItem] = useState(null);
    const fileInputRef = useRef(null);
    const searchDebounce = useRef(null);
    const lastClickedIndex = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    // Load folder tree
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

    // Load files in current folder
    const loadItems = useCallback(async (folderId, pg = 1, append = false) => {
        if (!folderId) { setItems([]); setHasMore(false); setPage(1); return; }
        try {
            if (append) setLoadingMore(true);
            else setLoadingItems(true);
            const data = await mediaApi.getFolderItems(folderId, pg);
            const newItems = data.data ?? [];
            setItems(prev => append ? [...prev, ...newItems] : newItems);
            setPage(pg);
            setHasMore(pg < (data.total_pages ?? 1));
        } catch {
            toast.error('Failed to load files');
        } finally {
            setLoadingItems(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => { loadFolders(); }, [loadFolders]);
    useEffect(() => { if (!searchQuery) { loadItems(currentFolderId, 1, false); setSearchResults(null); } }, [currentFolderId, loadItems, searchQuery]);

    // Search with debounce
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(async () => {
            try {
                const data = await mediaApi.searchFiles(searchQuery.trim());
                setSearchResults(data.data ?? []);
            } catch {
                toast.error('Search failed');
            }
        }, 350);
        return () => clearTimeout(searchDebounce.current);
    }, [searchQuery]);

    const displayedItems = useMemo(() => {
        const arr = [...(searchResults ?? items)];
        switch (sortBy) {
            case 'name_asc':  return arr.sort((a, b) => a.name.localeCompare(b.name));
            case 'name_desc': return arr.sort((a, b) => b.name.localeCompare(a.name));
            case 'date_asc':  return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'date_desc': return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'size_asc':  return arr.sort((a, b) => (a.size_bytes || 0) - (b.size_bytes || 0));
            case 'size_desc': return arr.sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
            default: return arr;
        }
    }, [searchResults, items, sortBy]);

    // ─── Selection ────────────────────────────────────────────────────────────

    const handleToggleSelect = useCallback((item, event) => {
        const index = displayedItems.findIndex(i => i.id === item.id);
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (event?.shiftKey && lastClickedIndex.current !== null) {
                const lo = Math.min(lastClickedIndex.current, index);
                const hi = Math.max(lastClickedIndex.current, index);
                displayedItems.slice(lo, hi + 1).forEach(i => next.add(i.id));
            } else {
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
            }
            return next;
        });
        lastClickedIndex.current = index;
    }, [displayedItems]);

    const clearSelection = () => {
        setSelectedIds(new Set());
        lastClickedIndex.current = null;
    };

    // ─── Upload ───────────────────────────────────────────────────────────────

    const handleFilesSelected = async (files) => {
        if (!currentFolderId) {
            toast.error('Select a folder before uploading');
            return;
        }
        const fileArr = Array.from(files);
        const invalid = fileArr.filter(f => !ALLOWED_TYPES.has(f.type));
        const valid = fileArr.filter(f => ALLOWED_TYPES.has(f.type));

        if (invalid.length > 0) {
            const names = invalid.map(f => f.name).join(', ');
            toast.error(`Unsupported file type${invalid.length > 1 ? 's' : ''}: ${names}`);
        }
        if (valid.length === 0) return;

        setUploading(true);
        setUploadProgress({ done: 0, total: valid.length });
        let successCount = 0;
        for (const file of valid) {
            try {
                await uploadFile(file, currentFolderId);
                successCount++;
                setUploadProgress(p => ({ ...p, done: p.done + 1 }));
            } catch {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
        setUploading(false);
        if (successCount > 0) {
            toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`);
            loadItems(currentFolderId);
        }
    };

    // ─── Retry / Duplicate ────────────────────────────────────────────────────

    const handleRetry = async (item) => {
        try {
            await mediaApi.retryProcessing(item.id);
            toast.success('Processing re-queued');
            const patch = { thumbnail_status: 'pending' };
            if (item.content_type?.startsWith('image/')) patch.preview_status = 'pending';
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...patch } : i));
            if (infoTarget?.id === item.id) setInfoTarget(t => ({ ...t, ...patch }));
        } catch {
            toast.error('Failed to retry processing');
        }
    };

    const handleDuplicate = async (item) => {
        try {
            const newItem = await mediaApi.duplicateFile(item.id);
            toast.success(`"${item.name}" duplicated`);
            setItems(prev => {
                const idx = prev.findIndex(i => i.id === item.id);
                const next = [...prev];
                next.splice(idx + 1, 0, newItem);
                return next;
            });
        } catch {
            toast.error('Duplicate failed');
        }
    };

    // ─── Bulk actions ─────────────────────────────────────────────────────────

    const handleBulkDelete = () => {
        const n = selectedIds.size;
        setConfirmModal({
            isOpen: true,
            title: `Delete ${n} File${n > 1 ? 's' : ''}`,
            message: `Delete ${n} selected file${n > 1 ? 's' : ''}? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(s => ({ ...s, isOpen: false }));
                try {
                    await mediaApi.bulkDelete(Array.from(selectedIds));
                    toast.success(`${n} file${n > 1 ? 's' : ''} deleted`);
                    clearSelection();
                    loadItems(currentFolderId);
                } catch {
                    toast.error('Bulk delete failed');
                }
            },
        });
    };

    const handleBulkMove = () => {
        setBulkMoveActive(true);
        setMoveTarget({ name: `${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}`, id: '__bulk__' });
    };

    // ─── Folder actions ───────────────────────────────────────────────────────

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await mediaApi.createFolder(newFolderName.trim(), currentFolderId);
            setNewFolderName('');
            setShowNewFolder(false);
            toast.success('Folder created');
            loadFolders();
        } catch {
            toast.error('Failed to create folder');
        }
    };

    // ─── File actions ─────────────────────────────────────────────────────────

    const handleDownload = async (item) => {
        try {
            const { url } = await mediaApi.getDownloadUrl(item.id);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.name;
            a.click();
        } catch {
            toast.error('Download failed');
        }
    };

    const handleDelete = (item) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete File',
            message: `Delete "${item.name}"? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(s => ({ ...s, isOpen: false }));
                try {
                    await mediaApi.deleteFile(item.id);
                    toast.success('File deleted');
                    if (lightboxItem?.id === item.id) setLightboxItem(null);
                    loadItems(currentFolderId);
                } catch {
                    toast.error('Delete failed');
                }
            }
        });
    };

    const handleRename = (item) => setRenameTarget(item);
    const handleMove = (item) => setMoveTarget(item);
    const handleShare = (item) => setShareTarget(item);
    const handlePreview = (item) => setLightboxItem(item);

    const handleFolderRenameSubmit = async (newName) => {
        try {
            await mediaApi.renameFolder(renameFolderTarget.id, newName);
            toast.success('Folder renamed');
            loadFolders();
        } catch {
            toast.error('Rename failed');
            throw new Error('Rename failed');
        }
    };

    const handleFolderDelete = (folder) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Folder',
            message: `Delete folder "${folder.name}" and all its contents? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(s => ({ ...s, isOpen: false }));
                try {
                    await mediaApi.deleteFolder(folder.id);
                    toast.success('Folder deleted');
                    if (currentFolderId === folder.id) setCurrentFolderId(null);
                    loadFolders();
                } catch (err) {
                    toast.error(err.response?.data?.detail || 'Delete failed');
                }
            }
        });
    };

    const lightboxItems = displayedItems;
    const lightboxIndex = lightboxItems.findIndex(i => i.id === lightboxItem?.id);
    const handleLightboxNext = lightboxIndex < lightboxItems.length - 1
        ? () => setLightboxItem(lightboxItems[lightboxIndex + 1])
        : undefined;
    const handleLightboxPrev = lightboxIndex > 0
        ? () => setLightboxItem(lightboxItems[lightboxIndex - 1])
        : undefined;

    const handleRenameSubmit = async (newName) => {
        try {
            await mediaApi.renameFile(renameTarget.id, newName);
            toast.success('File renamed');
            if (infoTarget?.id === renameTarget.id) setInfoTarget(t => ({ ...t, name: newName }));
            loadItems(currentFolderId);
        } catch {
            toast.error('Rename failed');
            throw new Error('Rename failed');
        }
    };

    const handleMoveSubmit = async (folderId) => {
        try {
            if (bulkMoveActive) {
                await mediaApi.bulkMove(Array.from(selectedIds), folderId);
                toast.success(`${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''} moved`);
                clearSelection();
                setBulkMoveActive(false);
            } else {
                await mediaApi.moveFile(moveTarget.id, folderId);
                toast.success('File moved');
            }
            loadItems(currentFolderId);
        } catch {
            toast.error('Move failed');
            throw new Error('Move failed');
        }
    };

    // ─── Drag and drop ────────────────────────────────────────────────────────

    const handleDragStart = (event) => {
        const item = event.active.data.current?.item;
        if (item) setActiveDragItem(item);
    };

    const handleDragEnd = async (event) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;
        const item = active.data.current?.item;
        const targetFolder = over.data.current?.folder;
        if (!item || !targetFolder) return;
        if (item.folder_id === targetFolder.id) return;

        try {
            await mediaApi.moveFile(item.id, targetFolder.id);
            toast.success(`Moved to ${targetFolder.name}`);
            setItems(prev => prev.filter(i => i.id !== item.id));
        } catch {
            toast.error('Move failed');
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className={`flex h-screen ${theme.canvas.bg} ${theme.text.primary} overflow-hidden`}>
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(s => ({ ...s, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    variant="danger"
                />
                <RenameModal
                    isOpen={!!renameTarget}
                    onClose={() => setRenameTarget(null)}
                    item={renameTarget}
                    type="file"
                    onRename={handleRenameSubmit}
                />
                <RenameModal
                    isOpen={!!renameFolderTarget}
                    onClose={() => setRenameFolderTarget(null)}
                    item={renameFolderTarget}
                    type="folder"
                    onRename={handleFolderRenameSubmit}
                />
                <MoveModal
                    isOpen={!!moveTarget}
                    onClose={() => { setMoveTarget(null); setBulkMoveActive(false); }}
                    item={moveTarget}
                    folders={folders}
                    onMove={handleMoveSubmit}
                />
                <ShareModal
                    isOpen={!!shareTarget}
                    onClose={() => setShareTarget(null)}
                    item={shareTarget}
                />
                <ShareFolderModal
                    isOpen={!!shareFolderTarget}
                    onClose={() => setShareFolderTarget(null)}
                    onRevoke={loadFolders}
                    folder={shareFolderTarget}
                    theme={theme}
                />
                <FileInfoPanel
                    isOpen={!!infoTarget}
                    onClose={() => setInfoTarget(null)}
                    item={infoTarget}
                    onDownload={handleDownload}
                    onRetry={handleRetry}
                />
                <MediaLightbox
                    isOpen={!!lightboxItem}
                    onClose={() => setLightboxItem(null)}
                    item={lightboxItem}
                    items={lightboxItems}
                    onDownload={handleDownload}
                    onShare={(item) => { setLightboxItem(null); setShareTarget(item); }}
                    onDelete={handleDelete}
                    onInfo={(item) => { setLightboxItem(null); setInfoTarget(item); }}
                    onNext={handleLightboxNext}
                    onPrev={handleLightboxPrev}
                />

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── Left panel: Folder tree ────────────────────────────────── */}
                <aside className={`
                    fixed md:relative z-40 md:z-auto top-0 left-0 h-full
                    w-64 shrink-0 border-r ${theme.canvas.border} ${theme.canvas.sidebar}
                    flex flex-col transition-transform duration-200
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className={`px-4 py-3 border-b ${theme.canvas.border} flex items-center justify-between`}>
                        <h2 className={`${theme.text.nav} text-[11px]`}>Folders</h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowNewFolder(true)}
                                className={`p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                                title="New folder"
                            >
                                <FolderPlus size={13} />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`md:hidden p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary}`}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {showNewFolder && (
                        <div className={`px-3 py-2 border-b ${theme.canvas.border}`}>
                            <input
                                autoFocus
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); } }}
                                placeholder="Folder name..."
                                className={`w-full text-xs px-2 py-1.5 rounded-lg border ${theme.canvas.border} ${theme.canvas.card} ${theme.text.primary} outline-none focus:border-accent/50 transition-colors`}
                            />
                            <div className="flex gap-1 mt-1.5">
                                <button onClick={handleCreateFolder} className="flex-1 text-[10px] py-1 rounded-md bg-accent text-white font-semibold">Create</button>
                                <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className={`flex-1 text-[10px] py-1 rounded-md ${theme.canvas.hover} ${theme.text.secondary}`}>Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2">
                        {loadingFolders ? (
                            <div className={`text-xs text-center py-6 ${theme.text.secondary}`}>Loading…</div>
                        ) : (
                            <FolderTree
                                folders={folders}
                                selectedId={currentFolderId}
                                onSelect={(id) => { setCurrentFolderId(id); setSearchQuery(''); setSidebarOpen(false); clearSelection(); }}
                                onRename={setRenameFolderTarget}
                                onDelete={handleFolderDelete}
                                onShare={setShareFolderTarget}
                            />
                        )}
                    </div>
                </aside>

                {/* ── Right panel: Files ─────────────────────────────────────── */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                    {/* Header */}
                    <div className={`px-4 md:px-6 py-3 border-b ${theme.canvas.border} flex items-center gap-3 shrink-0`}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className={`md:hidden p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary}`}
                            aria-label="Open folders"
                        >
                            <Menu size={16} />
                        </button>

                        <h1 className={`${theme.text.heading} text-base shrink-0`}>Media</h1>

                        <div className={`flex-1 md:max-w-xs flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}>
                            <Search size={12} className={theme.text.secondary} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search files…"
                                className={`flex-1 bg-transparent text-xs outline-none ${theme.text.primary} placeholder:${theme.text.secondary}`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}>
                                    <X size={11} className={theme.text.secondary} />
                                </button>
                            )}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            {/* Sort */}
                            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border ${theme.canvas.border} ${theme.canvas.card}`}>
                                <ArrowUpDown size={11} className={theme.text.secondary} />
                                <select
                                    value={sortBy}
                                    onChange={e => { setSortBy(e.target.value); localStorage.setItem('media_sort', e.target.value); }}
                                    className={`text-[11px] bg-transparent ${theme.text.secondary} outline-none cursor-pointer`}
                                >
                                    <option value="date_desc">Newest</option>
                                    <option value="date_asc">Oldest</option>
                                    <option value="name_asc">Name A–Z</option>
                                    <option value="name_desc">Name Z–A</option>
                                    <option value="size_desc">Largest</option>
                                    <option value="size_asc">Smallest</option>
                                </select>
                            </div>

                            {/* View toggle */}
                            <div className={`flex rounded-lg border ${theme.canvas.border} overflow-hidden`}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-accent/10 text-accent' : `${theme.text.secondary} ${theme.canvas.hover}`}`}
                                >
                                    <LayoutGrid size={13} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-accent/10 text-accent' : `${theme.text.secondary} ${theme.canvas.hover}`}`}
                                >
                                    <List size={13} />
                                </button>
                            </div>

                            {/* Upload button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || !currentFolderId}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${theme.canvas.button.primary} disabled:opacity-40`}
                            >
                                <Upload size={12} />
                                {uploading ? `${uploadProgress.done}/${uploadProgress.total}` : 'Upload'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => { handleFilesSelected(e.target.files); e.target.value = ''; }}
                            />
                        </div>
                    </div>

                    {/* R2 Usage Widget — desktop only */}
                    <div className="hidden md:block">
                        <R2UsageWidget />
                    </div>

                    {/* Breadcrumb */}
                    {!searchQuery && (
                        <div className={`px-4 md:px-6 py-2 border-b ${theme.canvas.border}`}>
                            <Breadcrumb
                                folders={folders}
                                currentFolderId={currentFolderId}
                                onNavigate={id => { setCurrentFolderId(id); clearSelection(); }}
                            />
                        </div>
                    )}
                    {searchQuery && (
                        <div className={`px-4 md:px-6 py-2 border-b ${theme.canvas.border} text-xs ${theme.text.secondary}`}>
                            Search results for "<span className={theme.text.primary}>{searchQuery}</span>"
                            {searchResults && ` — ${searchResults.length} file${searchResults.length !== 1 ? 's' : ''}`}
                        </div>
                    )}

                    {/* No folder selected */}
                    {!currentFolderId && !searchQuery && (
                        <div className={`flex-1 flex flex-col items-center justify-center ${theme.text.secondary}`}>
                            <FolderPlus size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">Select a folder to view files</p>
                            <p className="text-xs mt-1 opacity-60">Or create a new folder to get started</p>
                        </div>
                    )}

                    {/* File content */}
                    {(currentFolderId || searchQuery) && (
                        <div
                            className={`flex-1 overflow-y-auto p-4 md:p-6 relative transition-colors ${isDragOver && currentFolderId ? 'bg-accent/5' : ''}`}
                            onDragOver={e => { e.preventDefault(); if (currentFolderId) setIsDragOver(true); }}
                            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
                            onDrop={e => {
                                e.preventDefault();
                                setIsDragOver(false);
                                if (currentFolderId && e.dataTransfer.files.length) {
                                    handleFilesSelected(e.dataTransfer.files);
                                }
                            }}
                        >
                            {isDragOver && currentFolderId && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center border-2 border-dashed border-accent/50 rounded-xl bg-accent/5 pointer-events-none">
                                    <Upload size={36} className="text-accent/60 mb-3" />
                                    <p className="text-sm font-semibold text-accent/80">Drop files here</p>
                                </div>
                            )}

                            {loadingItems ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className={`rounded-xl border ${theme.canvas.border} overflow-hidden animate-pulse`}>
                                                <div className={`aspect-[4/5] ${theme.canvas.card}`} />
                                                <div className="px-2 py-2">
                                                    <div className={`h-2.5 rounded ${theme.canvas.card} w-3/4`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`rounded-xl border ${theme.canvas.border} overflow-hidden animate-pulse`}>
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b ${theme.canvas.border} last:border-0`}>
                                                <div className={`h-3 rounded ${theme.canvas.card} flex-1`} />
                                                <div className={`h-3 rounded ${theme.canvas.card} w-16 hidden md:block`} />
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : viewMode === 'grid' ? (
                                <FileGrid
                                    items={displayedItems}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onDownload={handleDownload}
                                    onRename={handleRename}
                                    onMove={handleMove}
                                    onShare={handleShare}
                                    onDuplicate={handleDuplicate}
                                    onDelete={handleDelete}
                                    onPreview={handlePreview}
                                />
                            ) : (
                                <FileList
                                    items={displayedItems}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onDownload={handleDownload}
                                    onRename={handleRename}
                                    onMove={handleMove}
                                    onShare={handleShare}
                                    onDuplicate={handleDuplicate}
                                    onDelete={handleDelete}
                                    onPreview={handlePreview}
                                />
                            )}

                            {/* Load more */}
                            {hasMore && !searchQuery && !loadingItems && (
                                <div className="flex justify-center pt-6 pb-2">
                                    <button
                                        onClick={() => loadItems(currentFolderId, page + 1, true)}
                                        disabled={loadingMore}
                                        className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${theme.canvas.border} ${theme.canvas.card} ${theme.text.secondary} hover:${theme.text.primary} disabled:opacity-40`}
                                    >
                                        {loadingMore ? 'Loading…' : `Load more`}
                                    </button>
                                </div>
                            )}
                            {loadingMore && (
                                <div className={`text-center py-4 text-xs ${theme.text.secondary}`}>Loading more files…</div>
                            )}
                        </div>
                    )}
                </main>

                {/* ── Drag overlay ───────────────────────────────────────────── */}
                <DragOverlay>
                    {activeDragItem && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.canvas.border} ${theme.canvas.card} shadow-2xl opacity-90 text-xs ${theme.text.primary} pointer-events-none`}>
                            <GripVertical size={12} className={theme.text.secondary} />
                            <span className="max-w-[160px] truncate">{activeDragItem.name}</span>
                        </div>
                    )}
                </DragOverlay>

                {/* ── Selection bar ──────────────────────────────────────────── */}
                {selectedIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl backdrop-blur-sm">
                        <span className={`text-xs font-semibold ${theme.text.primary} mr-1`}>
                            {selectedIds.size} selected
                        </span>
                        <button
                            onClick={handleBulkMove}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700"
                        >
                            <FolderInput size={12} />
                            Move
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                        >
                            <Trash2 size={12} />
                            Delete
                        </button>
                        <button
                            onClick={clearSelection}
                            className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-white transition-colors`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
        </DndContext>
    );
}
