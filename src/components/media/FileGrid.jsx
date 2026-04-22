import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical, Play, Check } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useTheme } from '../../context/ThemeContext';
import FileContextMenu from './FileContextMenu';

function typeBadge(contentType) {
    if (contentType?.startsWith('image/')) return { label: 'IMG', color: 'bg-black/50 text-white/90' };
    if (contentType?.startsWith('video/')) return { label: 'VID', color: 'bg-black/50 text-white/90' };
    if (contentType === 'application/pdf') return { label: 'PDF', color: 'bg-black/50 text-white/90' };
    return { label: 'FILE', color: 'bg-black/50 text-white/90' };
}

function FileCard({ item, selected, selectionMode, onToggleSelect, onDownload, onRename, onMove, onShare, onDuplicate, onDelete, onPreview }) {
    const { theme } = useTheme();
    const [menuPos, setMenuPos] = useState(null);
    const badge = typeBadge(item.content_type);
    const isVideo = item.content_type?.startsWith('video/');
    const isImage = item.content_type?.startsWith('image/');
    const hasThumbnail = item.thumbnail_r2_url && item.thumbnail_status === 'done';
    const isProcessing = (isImage || isVideo) && !hasThumbnail &&
        (item.thumbnail_status === 'pending' || item.thumbnail_status === 'processing');
    const isFailed = (isImage || isVideo) && !hasThumbnail && item.thumbnail_status === 'failed';

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: { item } });

    const openMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e) => {
        if (selectionMode) {
            onToggleSelect(item, e);
        } else {
            onPreview(item);
        }
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`relative group rounded-xl border ${theme.canvas.border} ${theme.canvas.card} overflow-hidden cursor-pointer transition-all duration-150
                ${selected ? 'ring-2 ring-accent border-accent/50' : 'hover:border-accent/50 hover:shadow-lg hover:shadow-accent/15 hover:scale-[1.02] hover:-translate-y-0.5'}
                ${isDragging ? 'opacity-50 scale-95' : ''}`}
            onContextMenu={openMenu}
            onClick={handleClick}
        >
            {/* Selection checkbox */}
            <div
                className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                    ${selected
                        ? 'bg-accent border-accent'
                        : `${theme.canvas.card} border-white/30 opacity-0 group-hover:opacity-100 ${selectionMode ? 'opacity-100' : ''}`
                    }`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(item, e); }}
            >
                {selected && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>

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

                {isProcessing && (
                    <div className="absolute bottom-1.5 right-7 pointer-events-none">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                    </div>
                )}
                {isFailed && (
                    <div className="absolute bottom-1.5 right-7 pointer-events-none">
                        <div className="w-3 h-3 rounded-full bg-red-500/70 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold leading-none">!</span>
                        </div>
                    </div>
                )}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-black/70 transition-colors">
                            <Play size={14} className="text-white fill-white ml-0.5" />
                        </div>
                    </div>
                )}

                <span className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}>
                    {badge.label}
                </span>

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
                    onDuplicate={() => onDuplicate(item)}
                    onShare={() => onShare(item)}
                    onDelete={() => onDelete(item)}
                />
            )}
        </div>
    );
}

export default function FileGrid({ items, selectedIds, onToggleSelect, onDownload, onRename, onMove, onShare, onDuplicate, onDelete, onPreview }) {
    const { theme } = useTheme();
    const selectionMode = selectedIds.size > 0;

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
                    selected={selectedIds.has(item.id)}
                    selectionMode={selectionMode}
                    onToggleSelect={onToggleSelect}
                    onDownload={onDownload}
                    onRename={onRename}
                    onMove={onMove}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onPreview={onPreview}
                />
            ))}
        </div>
    );
}
