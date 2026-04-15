import { ChevronRight, Home } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function buildCrumbs(folders, currentId) {
    if (!currentId) return [];
    const byId = {};
    folders.forEach(f => { byId[f.id] = f; });

    const crumbs = [];
    let node = byId[currentId];
    while (node) {
        crumbs.unshift(node);
        node = node.parent_id ? byId[node.parent_id] : null;
    }
    return crumbs;
}

export default function Breadcrumb({ folders, currentFolderId, onNavigate }) {
    const { theme } = useTheme();
    const crumbs = buildCrumbs(folders, currentFolderId);

    return (
        <div className="flex items-center gap-1 flex-wrap min-h-[24px]">
            <button
                onClick={() => onNavigate(null)}
                className={`flex items-center gap-1 text-xs ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
            >
                <Home size={12} />
                <span>Root</span>
            </button>
            {crumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                    <ChevronRight size={11} className={theme.text.secondary} />
                    <button
                        onClick={() => onNavigate(crumb.id)}
                        className={`text-xs transition-colors ${
                            i === crumbs.length - 1
                                ? `${theme.text.primary} font-semibold`
                                : `${theme.text.secondary} hover:${theme.text.primary}`
                        }`}
                    >
                        {crumb.name}
                    </button>
                </span>
            ))}
        </div>
    );
}
