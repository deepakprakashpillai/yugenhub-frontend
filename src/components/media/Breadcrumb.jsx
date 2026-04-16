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
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-h-[24px] flex-nowrap">
            <button
                onClick={() => onNavigate(null)}
                className={`flex items-center gap-1 text-xs whitespace-nowrap shrink-0 transition-colors ${
                    !currentFolderId
                        ? `${theme.text.primary} font-semibold`
                        : `${theme.text.secondary} hover:${theme.text.primary}`
                }`}
            >
                <Home size={12} />
                <span>Root</span>
            </button>
            {crumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1 shrink-0">
                    <ChevronRight size={11} className={`${theme.text.secondary} opacity-40`} />
                    <button
                        onClick={() => onNavigate(crumb.id)}
                        className={`text-xs whitespace-nowrap transition-colors ${
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
