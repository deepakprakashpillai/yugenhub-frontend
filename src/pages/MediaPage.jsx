import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, List, Plus, Upload, Search, FolderPlus, X, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import FolderTree from '../components/media/FolderTree';
import FileGrid from '../components/media/FileGrid';
import FileList from '../components/media/FileList';
import Breadcrumb from '../components/media/Breadcrumb';
import * as mediaApi from '../api/media';

// ─── Upload helpers ────────────────────────────────────────────────────────────

async function uploadFile(file, folderId) {
    const { upload_url, media_item_id } = await mediaApi.getUploadUrl(file.name, file.type, folderId);
    await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
    });
    await mediaApi.registerFile(media_item_id, file.size);
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MediaPage() {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [items, setItems] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = not searching
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
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
    const loadItems = useCallback(async (folderId) => {
        if (!folderId) { setItems([]); return; }
        try {
            setLoadingItems(true);
            const data = await mediaApi.getFolderItems(folderId);
            setItems(data.items ?? data);
        } catch {
            toast.error('Failed to load files');
        } finally {
            setLoadingItems(false);
        }
    }, []);

    useEffect(() => { loadFolders(); }, [loadFolders]);
    useEffect(() => { if (!searchQuery) { loadItems(currentFolderId); setSearchResults(null); } }, [currentFolderId, loadItems, searchQuery]);

    // Search with debounce
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(async () => {
            try {
                const data = await mediaApi.searchFiles(searchQuery.trim());
                setSearchResults(data.items ?? data);
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
            loadItems(currentFolderId);
        } catch {
            toast.error('Delete failed');
        }
    };

    // Placeholders — modals added in Step 8
    const handleRename = (item) => toast.info('Rename coming in next update');
    const handleMove = (item) => toast.info('Move coming in next update');
    const handleShare = (item) => toast.info('Share coming in next update');
    const handlePreview = (item) => toast.info('Preview coming in next update');

    return (
        <div className={`flex h-screen ${theme.canvas.bg} ${theme.text.primary} overflow-hidden`}>

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
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                    </div>
                )}
            </main>
        </div>
    );
}
