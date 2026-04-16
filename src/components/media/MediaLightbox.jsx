import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Download, Share2, Trash2, Info } from 'lucide-react';
import * as mediaApi from '../../api/media';
import { toast } from 'sonner';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export default function MediaLightbox({
    isOpen,
    onClose,
    item,
    items,
    onDownload,
    onShare,
    onDelete,
    onInfo,
    onNext,
    onPrev,
}) {
    // { itemId, url } — when itemId !== current item.id we're still loading
    const [urlState, setUrlState] = useState({ itemId: null, url: null });

    // Fetch presigned URL whenever item changes
    useEffect(() => {
        if (!item || !isOpen) return;
        let cancelled = false;
        mediaApi.getDownloadUrl(item.id)
            .then(({ url }) => { if (!cancelled) setUrlState({ itemId: item.id, url }); })
            .catch(() => { if (!cancelled) toast.error('Failed to load preview'); });
        return () => { cancelled = true; };
    }, [item, isOpen]);

    const loadingUrl = urlState.itemId !== item?.id;
    const presignedUrl = !loadingUrl ? urlState.url : null;

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && onNext) onNext();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
        };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [isOpen, onClose, onNext, onPrev]);

    const isImage = item?.content_type?.startsWith('image/');
    const isVideo = item?.content_type?.startsWith('video/');
    const isPdf = item?.content_type === 'application/pdf';

    const currentIndex = items?.findIndex(i => i.id === item?.id) ?? -1;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < (items?.length ?? 0) - 1;

    return (
        <AnimatePresence>
            {isOpen && item && (
                <motion.div
                    key="lightbox"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[200] flex flex-col bg-black/96"
                    onClick={onClose}
                >
                    {/* ── Header ───────────────────────────────────────────── */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                            <p className="text-[11px] text-white/50">
                                {formatBytes(item.size_bytes)} &middot; {formatDate(item.created_at)}
                            </p>
                        </div>

                        {/* Action bar — hidden on mobile, shown on desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {onInfo && (
                                <button
                                    onClick={() => onInfo(item)}
                                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="File info"
                                    title="File info"
                                >
                                    <Info size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => onShare(item)}
                                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Share"
                                title="Share"
                            >
                                <Share2 size={16} />
                            </button>
                            <button
                                onClick={() => onDownload(item)}
                                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Download"
                                title="Download"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(item)}
                                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                aria-label="Delete"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                    </div>

                    {/* ── Content area ─────────────────────────────────────── */}
                    <div
                        className="flex-1 flex items-center justify-center relative min-h-0"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Prev */}
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="absolute left-3 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-20 disabled:cursor-default"
                            aria-label="Previous file"
                        >
                            <ChevronLeft size={22} />
                        </button>

                        {/* Media */}
                        <div className="w-full h-full flex items-center justify-center px-16 py-6">
                            {loadingUrl ? (
                                <p className="text-white/30 text-sm animate-pulse">Loading preview…</p>
                            ) : isImage && presignedUrl ? (
                                <img
                                    src={presignedUrl}
                                    alt={item.name}
                                    className="max-w-full max-h-full object-contain rounded-lg select-none"
                                    draggable={false}
                                />
                            ) : isVideo && presignedUrl ? (
                                <video
                                    key={presignedUrl}
                                    controls
                                    src={presignedUrl}
                                    className="max-w-full max-h-full rounded-lg"
                                />
                            ) : isPdf && presignedUrl ? (
                                <iframe
                                    src={presignedUrl}
                                    title={item.name}
                                    className="w-full h-full rounded-lg border-0"
                                />
                            ) : !loadingUrl ? (
                                <div className="text-center text-white/30">
                                    <p className="text-sm font-medium">Preview not available</p>
                                    <p className="text-xs mt-1">Download the file to view it</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Next */}
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="absolute right-3 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-20 disabled:cursor-default"
                            aria-label="Next file"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>

                    {/* ── Footer: position indicator ───────────────────────── */}
                    {items.length > 1 && (
                        <div
                            className="flex justify-center py-3 shrink-0"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-white/20 text-xs">
                                {currentIndex + 1} / {items.length}
                            </p>
                        </div>
                    )}

                    {/* ── Mobile bottom action bar ─────────────────────────── */}
                    <div
                        className="md:hidden flex items-center justify-around px-4 py-3 shrink-0 border-t border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        {onInfo && (
                            <button
                                onClick={() => onInfo(item)}
                                className="flex flex-col items-center gap-1 p-2 text-white/50 hover:text-white transition-colors"
                                aria-label="File info"
                            >
                                <Info size={20} />
                                <span className="text-[10px]">Info</span>
                            </button>
                        )}
                        <button
                            onClick={() => onShare(item)}
                            className="flex flex-col items-center gap-1 p-2 text-white/50 hover:text-white transition-colors"
                            aria-label="Share"
                        >
                            <Share2 size={20} />
                            <span className="text-[10px]">Share</span>
                        </button>
                        <button
                            onClick={() => onDownload(item)}
                            className="flex flex-col items-center gap-1 p-2 text-white/50 hover:text-white transition-colors"
                            aria-label="Download"
                        >
                            <Download size={20} />
                            <span className="text-[10px]">Download</span>
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            className="flex flex-col items-center gap-1 p-2 text-red-400/60 hover:text-red-400 transition-colors"
                            aria-label="Delete"
                        >
                            <Trash2 size={20} />
                            <span className="text-[10px]">Delete</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
