import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FileContextMenu from './FileContextMenu';

function typeBadge(contentType) {
    if (contentType?.startsWith('image/')) return { label: 'IMG', color: 'bg-blue-500/20 text-blue-400' };
    if (contentType?.startsWith('video/')) return { label: 'VID', color: 'bg-purple-500/20 text-purple-400' };
    if (contentType === 'application/pdf') return { label: 'PDF', color: 'bg-red-500/20 text-red-400' };
    return { label: 'FILE', color: 'bg-zinc-500/20 text-zinc-400' };
}

function FileCard({ item, onDownload, onRename, onMove, onShare, onDelete, onPreview }) {
    const { theme } = useTheme();
    const [menuPos, setMenuPos] = useState(null);
    const badge = typeBadge(item.content_type);

    const openMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            className={`relative group rounded-xl border ${theme.canvas.border} ${theme.canvas.card} overflow-hidden cursor-pointer transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5`}
            onContextMenu={openMenu}
            onClick={() => onPreview(item)}
        >
            {/* Thumbnail */}
            <div className={`aspect-square flex items-center justify-center ${theme.canvas.bg} relative`}>
                {item.thumbnail_r2_url && item.thumbnail_status === 'done' ? (
                    <img
                        src={item.thumbnail_r2_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : item.content_type?.startsWith('image/') ? (
                    <Image size={32} className={theme.text.secondary} />
                ) : item.content_type?.startsWith('video/') ? (
                    <Video size={32} className={theme.text.secondary} />
                ) : item.content_type === 'application/pdf' ? (
                    <FileText size={32} className={theme.text.secondary} />
                ) : (
                    <File size={32} className={theme.text.secondary} />
                )}
                {/* Type badge */}
                <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                    {badge.label}
                </span>
                {/* ⋮ menu button */}
                <button
                    onClick={openMenu}
                    className={`absolute top-1 right-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${theme.canvas.card} ${theme.text.secondary} hover:${theme.text.primary}`}
                >
                    <MoreVertical size={13} />
                </button>
            </div>
            {/* Name */}
            <div className="px-2 py-1.5">
                <p className={`text-[11px] font-medium truncate ${theme.text.primary}`}>{item.name}</p>
            </div>

            {menuPos && (
                <FileContextMenu
                    x={menuPos.x}
                    y={menuPos.y}
                    item={item}
                    onClose={() => setMenuPos(null)}
                    onDownload={() => onDownload(item)}
                    onRename={() => onRename(item)}
                    onMove={() => onMove(item)}
                    onShare={() => onShare(item)}
                    onDelete={() => onDelete(item)}
                />
            )}
        </div>
    );
}

export default function FileGrid({ items, onDownload, onRename, onMove, onShare, onDelete, onPreview }) {
    const { theme } = useTheme();

    if (!items.length) {
        return (
            <div className={`flex flex-col items-center justify-center py-20 ${theme.text.secondary}`}>
                <File size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No files in this folder</p>
                <p className="text-xs mt-1 opacity-60">Upload files or select a different folder</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map(item => (
                <FileCard
                    key={item.id}
                    item={item}
                    onDownload={onDownload}
                    onRename={onRename}
                    onMove={onMove}
                    onShare={onShare}
                    onDelete={onDelete}
                    onPreview={onPreview}
                />
            ))}
        </div>
    );
}
