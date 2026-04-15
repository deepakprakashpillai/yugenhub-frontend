import { useState, useMemo } from 'react';
import { ChevronRight, Folder, FolderOpen, Lock } from 'lucide-react';
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

function TreeNode({ node, selectedId, onSelect, depth = 0 }) {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(depth === 0);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === selectedId;

    return (
        <div>
            <button
                onClick={() => {
                    onSelect(node.id);
                    if (hasChildren) setExpanded(e => !e);
                }}
                className={`
                    flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-lg text-[12px] transition-all
                    ${isSelected
                        ? 'bg-accent/10 text-accent font-semibold'
                        : `${theme.canvas.inactive} ${theme.canvas.hover}`}
                `}
                style={{ paddingLeft: `${8 + depth * 14}px` }}
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
                    : <Folder size={13} className={`shrink-0 ${theme.text.secondary}`} />
                }
                <span className="truncate flex-1">{node.name}</span>
                {node.is_system && (
                    <Lock size={9} className={`shrink-0 ${theme.text.secondary} opacity-50`} />
                )}
            </button>
            {expanded && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders, selectedId, onSelect }) {
    const { theme } = useTheme();
    const tree = useMemo(() => buildTree(folders), [folders]);

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
                />
            ))}
        </div>
    );
}
