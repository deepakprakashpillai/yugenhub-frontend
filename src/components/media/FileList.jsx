import { useState } from 'react';
import { Image, Video, FileText, File, MoreVertical, Play, Check } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
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

export default function FileList({ items, selectedIds, onToggleSelect, onDownload, onRename, onMove, onShare, onDuplicate, onDelete, onPreview }) {
    const { theme } = useTheme();
    const [menuState, setMenuState] = useState(null);
    const selectionMode = selectedIds.size > 0;

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
            <div className={`grid grid-cols-[28px_1fr_40px] md:grid-cols-[28px_1fr_80px_100px_80px_40px] gap-3 px-4 py-2 border-b ${theme.canvas.border} ${theme.canvas.card}`}>
                <span />
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
                    <FileRow
                        key={item.id}
                        item={item}
                        Icon={Icon}
                        selected={selectedIds.has(item.id)}
                        selectionMode={selectionMode}
                        onToggleSelect={onToggleSelect}
                        onPreview={onPreview}
                        setMenuState={setMenuState}
                        theme={theme}
                    />
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
                    onDuplicate={() => onDuplicate(menuState.item)}
                    onShare={() => onShare(menuState.item)}
                    onDelete={() => onDelete(menuState.item)}
                />
            )}
        </div>
    );
}

function FileRow({ item, Icon, selected, selectionMode, onToggleSelect, onPreview, setMenuState, theme }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: { item } });

    const isVid = item.content_type?.startsWith('video/');
    const isImg = item.content_type?.startsWith('image/');
    const hasThumb = item.thumbnail_r2_url && item.thumbnail_status === 'done';
    const processing = (isVid || isImg) && !hasThumb &&
        (item.thumbnail_status === 'pending' || item.thumbnail_status === 'processing');
    const failed = (isVid || isImg) && !hasThumb && item.thumbnail_status === 'failed';

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
            className={`group grid grid-cols-[28px_1fr_40px] md:grid-cols-[28px_1fr_80px_100px_80px_40px] gap-3 px-4 py-3 border-b ${theme.canvas.border} last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors
                ${selected ? 'bg-accent/5' : ''}
                ${isDragging ? 'opacity-50' : ''}`}
            onClick={handleClick}
            onContextMenu={(e) => {
                e.preventDefault();
                setMenuState({ item, x: e.clientX, y: e.clientY });
            }}
        >
            {/* Checkbox */}
            <div
                className={`self-center w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                    ${selected
                        ? 'bg-accent border-accent'
                        : `border-white/20 hover:border-white/40 ${selectionMode ? '' : 'opacity-0 group-hover:opacity-100'}`
                    }`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect(item, e); }}
            >
                {selected && <Check size={9} className="text-white" strokeWidth={3} />}
            </div>

            {/* Name + thumbnail */}
            {(() => {
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        {hasThumb ? (
                            <div className="relative w-7 h-7 shrink-0 hidden md:block">
                                <img src={item.thumbnail_r2_url} alt="" className="w-7 h-7 rounded object-cover" />
                                {isVid && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                                        <Play size={8} className="text-white fill-white ml-px" />
                                    </div>
                                )}
                            </div>
                        ) : isVid ? (
                            <div className="relative w-7 h-7 rounded bg-slate-700/60 flex items-center justify-center shrink-0 hidden md:block">
                                <Play size={10} className="text-white/70 fill-white/70 ml-px" />
                                {processing && <div className="absolute inset-0 rounded border border-white/20 border-t-white/60 animate-spin" />}
                                {failed && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500/80 flex items-center justify-center"><span className="text-white text-[6px] font-bold">!</span></div>}
                            </div>
                        ) : processing ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin shrink-0 hidden md:block" />
                        ) : failed ? (
                            <div className={`w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 hidden md:block`}>
                                <span className="text-red-400 text-[9px] font-bold">!</span>
                            </div>
                        ) : (
                            <Icon size={15} className={`shrink-0 ${theme.text.secondary} hidden md:block`} />
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                            {isVid && <Play size={11} className={`shrink-0 ${theme.text.secondary} md:hidden`} />}
                            <span title={item.name} className={`text-xs truncate ${theme.text.primary}`}>{item.name}</span>
                        </div>
                    </div>
                );
            })()}

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
}
