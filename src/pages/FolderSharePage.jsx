import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Video, FileText, File, Download, Play, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getFolderShare, getFolderShareItems, getFolderShareItemDownload } from '../api/media';

function fileIcon(contentType) {
    if (contentType?.startsWith('image/')) return Image;
    if (contentType?.startsWith('video/')) return Video;
    if (contentType === 'application/pdf') return FileText;
    return File;
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FolderSharePage() {
    const { token } = useParams();
    const [meta, setMeta] = useState(null);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const data = await getFolderShare(token);
                setMeta(data);
            } catch (err) {
                const status = err?.response?.status;
                setError(status === 410 ? 'expired' : 'notfound');
                setLoading(false);
            }
        };
        loadMeta();
    }, [token]);

    useEffect(() => {
        if (!meta) return;
        const loadItems = async () => {
            setLoading(true);
            try {
                const data = await getFolderShareItems(token, page);
                setItems(prev => page === 1 ? (data.data ?? []) : [...prev, ...(data.data ?? [])]);
                setTotal(data.total ?? 0);
                setHasMore(page < (data.total_pages ?? 1));
            } catch {
                setError('failed');
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [meta, token, page]);

    const openLightbox = async (item) => {
        setLightbox(item);
        setLightboxUrl(null);
        try {
            const data = await getFolderShareItemDownload(token, item.id);
            setLightboxUrl(data.url);
        } catch {
            setLightboxUrl('error');
        }
    };

    const lightboxIndex = items.findIndex(i => i.id === lightbox?.id);
    const handleNext = lightboxIndex < items.length - 1 ? () => openLightbox(items[lightboxIndex + 1]) : undefined;
    const handlePrev = lightboxIndex > 0 ? () => openLightbox(items[lightboxIndex - 1]) : undefined;

    const handleDownload = async (item, e) => {
        e.stopPropagation();
        try {
            const data = await getFolderShareItemDownload(token, item.id);
            const a = document.createElement('a');
            a.href = data.url;
            a.download = item.name;
            a.click();
        } catch {}
    };

    if (error === 'expired') return <ErrorScreen title="Link expired" message="This share link is no longer valid." />;
    if (error === 'notfound') return <ErrorScreen title="Not found" message="This share link doesn't exist or has been revoked." />;
    if (error === 'failed') return <ErrorScreen title="Something went wrong" message="Failed to load this shared folder." />;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        {meta?.agency_name && (
                            <p className="text-xs text-zinc-500 mb-0.5">{meta.agency_name}</p>
                        )}
                        <h1 className="text-lg font-semibold text-white">{meta?.folder_name ?? '…'}</h1>
                        {total > 0 && (
                            <p className="text-xs text-zinc-500 mt-0.5">{total} file{total !== 1 ? 's' : ''}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {loading && items.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-zinc-800 animate-pulse">
                                <div className="aspect-[4/5] bg-zinc-800" />
                                <div className="p-2">
                                    <div className="h-2.5 bg-zinc-800 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-24 text-zinc-500">
                        <File size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No files in this folder</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {items.map(item => (
                                <FileCard
                                    key={item.id}
                                    item={item}
                                    allowDownload={meta?.allow_download}
                                    onClick={() => openLightbox(item)}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-xl text-sm font-medium border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 disabled:opacity-40 transition-colors"
                                >
                                    {loading ? 'Loading…' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <Lightbox
                    item={lightbox}
                    url={lightboxUrl}
                    allowDownload={meta?.allow_download}
                    onClose={() => setLightbox(null)}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onDownload={(e) => handleDownload(lightbox, e)}
                />
            )}
        </div>
    );
}

function FileCard({ item, allowDownload, onClick, onDownload }) {
    const Icon = fileIcon(item.content_type);
    const isVideo = item.content_type?.startsWith('video/');
    const hasThumbnail = item.thumbnail_r2_url && item.thumbnail_status === 'done';

    return (
        <div
            onClick={onClick}
            className="group rounded-xl border border-zinc-800 hover:border-zinc-600 cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:shadow-black/40 hover:scale-[1.02]"
        >
            <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                {hasThumbnail ? (
                    <img src={item.thumbnail_r2_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <Icon size={32} className="text-zinc-600" />
                )}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                        </div>
                    </div>
                )}
                {allowDownload && (
                    <button
                        onClick={e => onDownload(item, e)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Download"
                    >
                        <Download size={12} />
                    </button>
                )}
                <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={12} className="text-white/60" />
                </div>
            </div>
            <div className="px-2 py-2">
                <p title={item.name} className="text-[11px] text-zinc-300 font-medium line-clamp-2 leading-snug">{item.name}</p>
                {item.size_bytes > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">{formatBytes(item.size_bytes)}</p>
                )}
            </div>
        </div>
    );
}

function Lightbox({ item, url, allowDownload, onClose, onNext, onPrev, onDownload }) {
    const isVideo = item.content_type?.startsWith('video/');
    const isImage = item.content_type?.startsWith('image/');

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onNext?.(); if (e.key === 'ArrowLeft') onPrev?.(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onNext, onPrev]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
            <div className="relative flex items-center justify-center w-full h-full p-8" onClick={e => e.stopPropagation()}>
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-10">
                    <X size={16} />
                </button>

                {allowDownload && (
                    <button onClick={onDownload} className="absolute top-4 right-16 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-10">
                        <Download size={16} />
                    </button>
                )}

                {/* Prev / Next */}
                {onPrev && (
                    <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors z-10">
                        <ChevronLeft size={20} />
                    </button>
                )}
                {onNext && (
                    <button onClick={onNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors z-10">
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* Content */}
                <div className="max-w-4xl max-h-[80vh] flex flex-col items-center gap-3">
                    {url === null && (
                        <div className="w-16 h-16 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
                    )}
                    {url === 'error' && (
                        <p className="text-zinc-500 text-sm">Failed to load preview</p>
                    )}
                    {url && url !== 'error' && isImage && (
                        <img src={url} alt={item.name} className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl" />
                    )}
                    {url && url !== 'error' && isVideo && (
                        <video src={url} controls autoPlay className="max-h-[75vh] max-w-full rounded-xl shadow-2xl" />
                    )}
                    {url && url !== 'error' && !isImage && !isVideo && (
                        <div className="text-center py-12 text-zinc-500">
                            <FileText size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{item.name}</p>
                            {allowDownload && (
                                <button onClick={onDownload} className="mt-4 px-5 py-2 rounded-xl text-sm border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                                    Download
                                </button>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-zinc-500 text-center truncate max-w-sm">{item.name}</p>
                </div>
            </div>
        </div>
    );
}

function ErrorScreen({ title, message }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <File size={28} className="text-zinc-500" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-zinc-500 text-sm">{message}</p>
            </div>
        </div>
    );
}
