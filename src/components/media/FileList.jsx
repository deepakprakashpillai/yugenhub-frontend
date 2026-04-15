import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical } from 'lucide-react';
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
            <div className={`grid grid-cols-[1fr_80px_100px_80px_40px] gap-3 px-4 py-2 border-b ${theme.canvas.border} ${theme.canvas.card}`}>
                {['Name', 'Type', 'Date', 'Size', ''].map(h => (
                    <span key={h} className={`text-[9px] font-black uppercase tracking-widest ${theme.text.secondary}`}>{h}</span>
                ))}
            </div>
            {/* Rows */}
            {items.map(item => {
                const Icon = fileIcon(item.content_type);
                return (
                    <div
                        key={item.id}
                        className={`grid grid-cols-[1fr_80px_100px_80px_40px] gap-3 px-4 py-2.5 border-b ${theme.canvas.border} last:border-0 ${theme.canvas.hover} cursor-pointer transition-colors`}
                        onClick={() => onPreview(item)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setMenuState({ item, x: e.clientX, y: e.clientY });
                        }}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            {item.thumbnail_r2_url && item.thumbnail_status === 'done' ? (
                                <img src={item.thumbnail_r2_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                            ) : (
                                <Icon size={15} className={`shrink-0 ${theme.text.secondary}`} />
                            )}
                            <span className={`text-xs truncate ${theme.text.primary}`}>{item.name}</span>
                        </div>
                        <span className={`text-xs self-center ${theme.text.secondary}`}>{typeLabel(item.content_type)}</span>
                        <span className={`text-xs self-center ${theme.text.secondary}`}>{formatDate(item.created_at)}</span>
                        <span className={`text-xs self-center ${theme.text.secondary}`}>{formatBytes(item.size_bytes)}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuState({ item, x: e.clientX, y: e.clientY });
                            }}
                            className={`self-center ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
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
