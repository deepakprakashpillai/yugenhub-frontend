import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import FileContextMenu from './FileContextMenu';

function typeBadge(contentType) {
    if (contentType?.startsWith('image/')) return { label: 'IMG', color: 'bg-black/50 text-white/90' };
    if (contentType?.startsWith('video/')) return { label: 'VID', color: 'bg-black/50 text-white/90' };
    if (contentType === 'application/pdf') return { label: 'PDF', color: 'bg-black/50 text-white/90' };
    return { label: 'FILE', color: 'bg-black/50 text-white/90' };
}

function FileCard({ item, onDownload, onRename, onMove, onShare, onDelete, onPreview }) {
    const { theme } = useTheme();
    const [menuPos, setMenuPos] = useState(null);
    const badge = typeBadge(item.content_type);
    const isVideo = item.content_type?.startsWith('video/');
    const hasThumbnail = item.thumbnail_r2_url && item.thumbnail_status === 'done';

    const openMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            className={`relative group rounded-xl border ${theme.canvas.border} ${theme.canvas.card} overflow-hidden cursor-pointer transition-all duration-150 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/15 hover:scale-[1.02] hover:-translate-y-0.5`}
            onContextMenu={openMenu}
            onClick={() => onPreview(item)}
        >
            {/* Thumbnail */}
            <div className={`aspect-[4/5] flex items-center justify-center ${theme.canvas.bg} relative overflow-hidden`}>
                {hasThumbnail ? (
                    <img
                        src={item.thumbnail_r2_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : item.content_type?.startsWith('image/') ? (
                    <Image size={32} className={theme.text.secondary} />
                ) : isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800/60 to-slate-900/80">
                        <Video size={28} className="text-white/30" />
                    </div>
                ) : item.content_type === 'application/pdf' ? (
                    <FileText size={32} className={theme.text.secondary} />
                ) : (
                    <File size={32} className={theme.text.secondary} />
                )}

                {/* Play button overlay for videos */}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-black/70 transition-colors">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                        </div>
                    </div>
                )}

                {/* Type badge — bottom-left, consistent dark background */}
                <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                    {badge.label}
                </span>

                {/* ⋮ menu — always faintly visible on mobile, full on hover */}
                <button
                    onClick={openMenu}
                    className={`absolute top-1.5 right-1.5 p-1.5 rounded-lg transition-all ${theme.canvas.card} ${theme.text.secondary} hover:${theme.text.primary} opacity-40 md:opacity-0 group-hover:opacity-100`}
                    aria-label="File options"
                >
                    <MoreVertical size={13} />
                </button>
            </div>

            {/* Name */}
            <div className="px-2 py-2">
                <p
                    title={item.name}
                    className={`text-[11px] font-medium leading-snug ${theme.text.primary} line-clamp-2`}
                >
                    {item.name}
                </p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
