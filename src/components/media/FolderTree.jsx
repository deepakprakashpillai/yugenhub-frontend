import { useState, useMemo } from 'react';
import { ChevronRight, Folder, FolderOpen, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function buildTree(folders) {
    const byId = {};
    const roots = [];
    folders.forEach(f => { byId[f.id] = { ...f, children: [] }; });
    folders.forEach(f => {
        if (f.parent_id && byId[f.parent_id]) {
            byId[f.parent_id].children.push(byId[f.id]);
        } else if (!f.parent_id) {
            roots.push(byId[f.id]);
        }
    });
    return roots;
}

function buildAncestorIds(folders, currentId) {
    if (!currentId) return new Set();
    const byId = {};
    folders.forEach(f => { byId[f.id] = f; });
    const ids = new Set();
    let node = byId[currentId];
    while (node?.parent_id) {
        ids.add(node.parent_id);
        node = byId[node.parent_id];
    }
    return ids;
}

function TreeNode({ node, selectedId, onSelect, onRename, onDelete, ancestorIds, depth = 0 }) {
    const { theme } = useTheme();
    const isAncestor = ancestorIds.has(node.id);
    // userExpanded tracks manual toggle; ancestors are always shown expanded
    const [userExpanded, setUserExpanded] = useState(depth === 0);
    const expanded = isAncestor || userExpanded;
    const [menuOpen, setMenuOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === selectedId;

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setMenuOpen(o => !o);
    };

    const handleRename = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        onRename?.(node);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        onDelete?.(node);
    };

    return (
        <div className="relative">
            <div className="group flex items-center">
                <button
                    onClick={() => {
                        onSelect(node.id);
                        if (hasChildren) setUserExpanded(!expanded);
                    }}
                    className={`
                        flex items-center gap-1.5 flex-1 text-left px-2 py-1.5 rounded-lg text-[12px] transition-all min-w-0
                        ${isSelected
                            ? 'bg-accent/10 text-accent font-semibold'
                            : `${theme.canvas.inactive} ${theme.canvas.hover}`}
                    `}
                    style={{ paddingLeft: `${8 + depth * 10}px` }}
                >
                    {hasChildren ? (
                        <ChevronRight
                            size={12}
                            className={`shrink-0 transition-transform ${expanded ? 'rotate-90' : ''} ${theme.text.secondary}`}
                        />
                    ) : (
                        <span className="w-3 shrink-0" />
                    )}
                    {isSelected
                        ? <FolderOpen size={13} className="shrink-0 text-accent" />
                        : <Folder size={13} className={`shrink-0 ${isAncestor ? 'text-accent/60' : theme.text.secondary}`} />
                    }
                    <span className="truncate flex-1">{node.name}</span>
                    {node.is_system && (
                        <Lock size={9} className={`shrink-0 ${theme.text.secondary} opacity-50`} title="System folder" />
                    )}
                </button>

                {/* Actions menu — shown on hover, hidden for system folders */}
                {!node.is_system && (onRename || onDelete) && (
                    <div className="relative shrink-0">
                        <button
                            onClick={handleMenuClick}
                            className={`p-1 rounded transition-all ${theme.text.secondary} hover:${theme.text.primary} ${theme.canvas.hover} opacity-30 md:opacity-0 group-hover:opacity-100`}
                            aria-label="Folder options"
                        >
                            <MoreHorizontal size={12} />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className={`absolute right-0 top-6 z-20 min-w-[120px] rounded-xl border shadow-lg overflow-hidden ${theme.canvas.card} ${theme.canvas.border}`}>
                                    {onRename && (
                                        <button
                                            onClick={handleRename}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-xs ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                                        >
                                            <Pencil size={11} /> Rename
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={11} /> Delete
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {expanded && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onRename={onRename}
                            onDelete={onDelete}
                            ancestorIds={ancestorIds}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders, selectedId, onSelect, onRename, onDelete }) {
    const { theme } = useTheme();
    const tree = useMemo(() => buildTree(folders), [folders]);
    const ancestorIds = useMemo(() => buildAncestorIds(folders, selectedId), [folders, selectedId]);

    if (!folders.length) {
        return (
            <div className={`text-center py-8 ${theme.text.secondary} text-xs`}>
                No folders yet
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {tree.map(node => (
                <TreeNode
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete}
                    ancestorIds={ancestorIds}
                />
            ))}
        </div>
    );
}
