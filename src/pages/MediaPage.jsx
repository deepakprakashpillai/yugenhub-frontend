import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, List, Upload, Search, FolderPlus, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FolderTree from '../components/media/FolderTree';
import FileGrid from '../components/media/FileGrid';
import FileList from '../components/media/FileList';
import Breadcrumb from '../components/media/Breadcrumb';
import RenameModal from '../components/media/RenameModal';
import MoveModal from '../components/media/MoveModal';
import ShareModal from '../components/media/ShareModal';
import FileInfoPanel from '../components/media/FileInfoPanel';
import MediaLightbox from '../components/media/MediaLightbox';
import R2UsageWidget from '../components/media/R2UsageWidget';
import * as mediaApi from '../api/media';

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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = not searching
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
    const [isDragOver, setIsDragOver] = useState(false);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameFolderTarget, setRenameFolderTarget] = useState(null);
    const [moveTarget, setMoveTarget] = useState(null);
    const [shareTarget, setShareTarget] = useState(null);
    const [infoTarget, setInfoTarget] = useState(null);
    const [lightboxItem, setLightboxItem] = useState(null);
    const fileInputRef = useRef(null);
    const searchDebounce = useRef(null);

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

    const displayedItems = searchResults ?? items;

    // Upload handler
    const handleFilesSelected = async (files) => {
        if (!currentFolderId) {
            toast.error('Select a folder before uploading');
            return;
        }
        const fileArr = Array.from(files);
        setUploading(true);
        setUploadProgress({ done: 0, total: fileArr.length });
        let successCount = 0;
        for (const file of fileArr) {
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

    // Create folder
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

    // File actions
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

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        try {
            await mediaApi.deleteFile(item.id);
            toast.success('File deleted');
            if (lightboxItem?.id === item.id) setLightboxItem(null);
            loadItems(currentFolderId);
        } catch {
            toast.error('Delete failed');
        }
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

    const handleFolderDelete = async (folder) => {
        if (!window.confirm(`Delete folder "${folder.name}" and all its contents? This cannot be undone.`)) return;
        try {
            await mediaApi.deleteFolder(folder.id);
            toast.success('Folder deleted');
            if (currentFolderId === folder.id) setCurrentFolderId(null);
            loadFolders();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Delete failed');
        }
    };

    const lightboxItems = searchResults ?? items;
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
            await mediaApi.moveFile(moveTarget.id, folderId);
            toast.success('File moved');
            loadItems(currentFolderId);
        } catch {
            toast.error('Move failed');
            throw new Error('Move failed');
        }
    };

    return (
        <div className={`flex h-screen ${theme.canvas.bg} ${theme.text.primary} overflow-hidden`}>
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
                onClose={() => setMoveTarget(null)}
                item={moveTarget}
                folders={folders}
                onMove={handleMoveSubmit}
            />
            <ShareModal
                isOpen={!!shareTarget}
                onClose={() => setShareTarget(null)}
                item={shareTarget}
            />
            <FileInfoPanel
                isOpen={!!infoTarget}
                onClose={() => setInfoTarget(null)}
                item={infoTarget}
                onDownload={handleDownload}
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

            {/* ── Mobile sidebar overlay ─────────────────────────────────── */}
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

                {/* New folder input */}
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
                            onSelect={(id) => { setCurrentFolderId(id); setSearchQuery(''); setSidebarOpen(false); }}
                            onRename={setRenameFolderTarget}
                            onDelete={handleFolderDelete}
                        />
                    )}
                </div>
            </aside>

            {/* ── Right panel: Files ─────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header */}
                <div className={`px-4 md:px-6 py-3 border-b ${theme.canvas.border} flex items-center gap-3 shrink-0`}>
                    {/* Mobile: hamburger to open sidebar */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`md:hidden p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary}`}
                    >
                        <ChevronLeft size={15} className="rotate-180" />
                    </button>

                    <h1 className={`${theme.text.heading} text-base shrink-0`}>Media</h1>

                    {/* Search */}
                    <div className={`flex-1 max-w-xs flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}>
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

                {/* R2 Usage Widget */}
                <R2UsageWidget />

                {/* Breadcrumb */}
                {!searchQuery && (
                    <div className={`px-4 md:px-6 py-2 border-b ${theme.canvas.border}`}>
                        <Breadcrumb
                            folders={folders}
                            currentFolderId={currentFolderId}
                            onNavigate={id => { setCurrentFolderId(id); }}
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
                        className={`flex-1 overflow-y-auto p-4 md:p-6 transition-colors ${isDragOver && currentFolderId ? `ring-2 ring-accent/40 ring-inset` : ''}`}
                        onDragOver={e => { e.preventDefault(); if (currentFolderId) setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={e => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (currentFolderId && e.dataTransfer.files.length) {
                                handleFilesSelected(e.dataTransfer.files);
                            }
                        }}
                    >
                        {loadingItems ? (
                            <div className={`text-center py-16 text-sm ${theme.text.secondary}`}>Loading files…</div>
                        ) : viewMode === 'grid' ? (
                            <FileGrid
                                items={displayedItems}
                                onDownload={handleDownload}
                                onRename={handleRename}
                                onMove={handleMove}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onPreview={handlePreview}
                            />
                        ) : (
                            <FileList
                                items={displayedItems}
                                onDownload={handleDownload}
                                onRename={handleRename}
                                onMove={handleMove}
                                onShare={handleShare}
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
        </div>
    );
}
