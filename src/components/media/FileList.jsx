import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FileContextMenu from './FileContextMenu';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fileIcon(contentType) {
    if (contentType?.startsWith('image/')) return Image;
    if (contentType?.startsWith('video/')) return Video;
    if (contentType === 'application/pdf') return FileText;
    return File;
}

function typeLabel(contentType) {
    if (contentType?.startsWith('image/')) return 'Image';
    if (contentType?.startsWith('video/')) return 'Video';
    if (contentType === 'application/pdf') return 'PDF';
    return 'File';
}

export default function FileList({ items, onDownload, onRename, onMove, onShare, onDelete, onPreview }) {
    const { theme } = useTheme();
    const [menuState, setMenuState] = useState(null); // { item, x, y }

    if (!items.length) {
        return (
            <div className={`flex flex-col items-center justify-center py-20 ${theme.text.secondary}`}>
                <File size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No files in this folder</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border ${theme.canvas.border} overflow-hidden`}>
            {/* Header */}
            <div className={`grid grid-cols-[1fr_40px] md:grid-cols-[1fr_80px_100px_80px_40px] gap-3 px-4 py-2 border-b ${theme.canvas.border} ${theme.canvas.card}`}>
                {['Name', 'Type', 'Date', 'Size', ''].map((h, i) => (
                    <span
                        key={h || i}
                        className={`text-[9px] font-bold uppercase tracking-wider ${theme.text.secondary} ${i > 0 && i < 4 ? 'hidden md:block' : ''}`}
                    >
                        {h}
                    </span>
                ))}
            </div>
            {/* Rows */}
            {items.map(item => {
                const Icon = fileIcon(item.content_type);
                return (
                    <div
                        key={item.id}
                        className={`grid grid-cols-[1fr_40px] md:grid-cols-[1fr_80px_100px_80px_40px] gap-3 px-4 py-3 border-b ${theme.canvas.border} last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors`}
                        onClick={() => onPreview(item)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setMenuState({ item, x: e.clientX, y: e.clientY });
                        }}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {item.thumbnail_r2_url && item.thumbnail_status === 'done' ? (
                                <div className="relative w-7 h-7 shrink-0 hidden md:block">
                                    <img src={item.thumbnail_r2_url} alt="" className="w-7 h-7 rounded object-cover" />
                                    {item.content_type?.startsWith('video/') && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                                            <Play size={8} className="text-white fill-white ml-px" />
                                        </div>
                                    )}
                                </div>
                            ) : item.content_type?.startsWith('video/') ? (
                                <div className="w-7 h-7 rounded bg-slate-700/60 flex items-center justify-center shrink-0 hidden md:block">
                                    <Play size={10} className="text-white/70 fill-white/70 ml-px" />
                                </div>
                            ) : (
                                <Icon size={15} className={`shrink-0 ${theme.text.secondary} hidden md:block`} />
                            )}
                            <div className="flex items-center gap-1.5 min-w-0">
                                {item.content_type?.startsWith('video/') && (
                                    <Play size={11} className={`shrink-0 ${theme.text.secondary} md:hidden`} />
                                )}
                                <span title={item.name} className={`text-xs truncate ${theme.text.primary}`}>{item.name}</span>
                            </div>
                        </div>
                        <span className={`text-xs self-center ${theme.text.secondary} hidden md:block`}>{typeLabel(item.content_type)}</span>
                        <span className={`text-xs self-center ${theme.text.secondary} hidden md:block`}>{formatDate(item.created_at)}</span>
                        <span className={`text-xs self-center ${theme.text.secondary} hidden md:block`}>{formatBytes(item.size_bytes)}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuState({ item, x: e.clientX, y: e.clientY });
                            }}
                            className={`self-center ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                            aria-label="File options"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </div>
                );
            })}

            {menuState && (
                <FileContextMenu
                    x={menuState.x}
                    y={menuState.y}
                    item={menuState.item}
                    onClose={() => setMenuState(null)}
                    onDownload={() => onDownload(menuState.item)}
                    onRename={() => onRename(menuState.item)}
                    onMove={() => onMove(menuState.item)}
                    onShare={() => onShare(menuState.item)}
                    onDelete={() => onDelete(menuState.item)}
                />
            )}
        </div>
    );
}
