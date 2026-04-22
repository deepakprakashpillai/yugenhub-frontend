import { useEffect, useRef } from 'react';
import { Download, Pencil, FolderInput, Share2, Trash2, Copy } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function FileContextMenu({ x, y, item, onClose, onDownload, onRename, onMove, onShare, onDuplicate, onDelete }) {
    const { theme } = useTheme();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    // Adjust position so menu doesn't overflow viewport
    const adjustedX = Math.min(x, window.innerWidth - 180);
    const adjustedY = Math.min(y, window.innerHeight - 260);

    const actions = [
        { label: 'Download', icon: Download, action: onDownload },
        { label: 'Rename', icon: Pencil, action: onRename },
        { label: 'Move to', icon: FolderInput, action: onMove },
        { label: 'Duplicate', icon: Copy, action: onDuplicate },
        { label: 'Share', icon: Share2, action: onShare },
        { divider: true },
        { label: 'Delete', icon: Trash2, action: onDelete, danger: true },
    ];

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 w-44 rounded-xl border shadow-2xl overflow-hidden ${theme.canvas.card} ${theme.canvas.border}`}
            style={{ left: adjustedX, top: adjustedY }}
        >
            <div className={`px-3 py-2 border-b ${theme.canvas.border}`}>
                <p className={`text-[10px] font-semibold truncate ${theme.text.secondary}`}>{item.name}</p>
            </div>
            {actions.map((action, i) =>
                action.divider ? (
                    <div key={i} className={`h-px ${theme.canvas.border} my-1`} />
                ) : (
                    <button
                        key={action.label}
                        onClick={() => { action.action(); onClose(); }}
                        className={`
                            flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors
                            ${action.danger
                                ? 'text-red-500 hover:bg-red-500/10'
                                : `${theme.text.secondary} hover:${theme.text.primary} ${theme.canvas.hover}`}
                        `}
                    >
                        <action.icon size={13} />
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}
