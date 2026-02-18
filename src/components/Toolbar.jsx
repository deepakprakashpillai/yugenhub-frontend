
import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import clsx from 'clsx';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { SlidersHorizontal } from 'lucide-react';

const Toolbar = ({
    search, setSearch,
    filter, setFilter,
    sort, setSort,
    viewMode, setViewMode,
    view, setView
}) => {
    const isMobile = useIsMobile();
    // We will combine 'view' and 'filter' into a single UI concept "Filter"
    // However, we still need to pass them separately to the parent/API.
    // Logic:
    // - "Upcoming" -> view='upcoming', filter='all'
    // - "All Projects" -> view='all', filter='all'
    // - Specific Status -> view='all', filter='status_id'

    const [activeDropdown, setActiveDropdown] = useState(null); // 'filter', 'sort' or null
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const toolbarRef = useRef(null);
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const accent = theme.accents?.default || { primary: '#ef4444', glow: '#ef4444' };

    // Helper to get current label
    const getCurrentFilterLabel = () => {
        if (view === 'upcoming') return 'Upcoming Events';
        if (filter === 'all' && view === 'all') return 'All Projects';
        // Check if it's a known status
        const status = config?.statusOptions?.find(s => s.id === filter);
        return status ? status.label : (filter === 'all' ? 'Filter' : filter);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    return (
        <div ref={toolbarRef} className={`flex flex-col md:flex-row justify-between items-center mb-8 gap-3 md:gap-4 ${theme.canvas.card} p-3 md:p-4 rounded-xl border ${theme.canvas.border} backdrop-blur-sm sticky top-0 z-10 transition-all`}>

            {/* 1. Search Bar */}
            <div className="relative w-full md:w-1/3">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} ${theme.text.primary} rounded-lg pl-10 pr-4 py-2 focus:outline-none transition-colors`}
                    style={{
                        outlineColor: activeDropdown ? 'transparent' : accent.primary // Use accent for focus ring if possible, or just border
                    }}
                    onFocus={(e) => e.target.style.borderColor = accent.primary}
                    onBlur={(e) => e.target.style.borderColor = ''}
                />
            </div>

            {/* Mobile: filter toggle button */}
            {isMobile && (
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                        showMobileFilters ? '' : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.secondary}`
                    )}
                    style={showMobileFilters ? { borderColor: accent.primary, color: accent.primary } : {}}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                </button>
            )}

            <div className={clsx(
                "items-center gap-3 w-full md:w-auto flex-wrap",
                isMobile ? (showMobileFilters ? 'flex' : 'hidden') : 'flex'
            )}>



                {/* 2. Combined Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('filter')}
                        className={clsx(
                            "flex items-center gap-2 border px-3 py-2 rounded-lg text-sm transition-colors",
                            activeDropdown === 'filter' ? "" : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.secondary} ${theme.canvas.hover}`
                        )}
                        style={activeDropdown === 'filter' ? {
                            borderColor: accent.primary,
                            color: accent.primary
                        } : {}}
                    >
                        <Icons.Filter className="w-4 h-4" />
                        <span className="capitalize">{getCurrentFilterLabel()}</span>
                        <Icons.ChevronDown className="w-3 h-3 opacity-50" />
                    </button>

                    {activeDropdown === 'filter' && (
                        <div className={`absolute top-full right-0 mt-2 w-56 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200`}>
                            {/* Special Views */}
                            <button
                                onClick={() => { setView('all'); setFilter('all'); setActiveDropdown(null); }}
                                className={clsx(
                                    "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                                    (view === 'all' && filter === 'all') ? "font-medium" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={(view === 'all' && filter === 'all') ? {
                                    color: accent.primary,
                                    backgroundColor: `${accent.primary}1A`
                                } : {}}
                            >
                                <Icons.Grid className="w-4 h-4" />
                                All Projects
                            </button>
                            <button
                                onClick={() => { setView('upcoming'); setFilter('all'); setActiveDropdown(null); }}
                                className={clsx(
                                    "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                                    view === 'upcoming' ? "font-medium" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={view === 'upcoming' ? {
                                    color: accent.primary,
                                    backgroundColor: `${accent.primary}1A`
                                } : {}}
                            >
                                <Icons.Calendar className="w-4 h-4" />
                                Upcoming Events
                            </button>

                            <div className="h-px bg-zinc-800 my-1" />
                            <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-zinc-600 tracking-wider">
                                By Status
                            </div>

                            {/* Status List */}
                            {(config?.statusOptions || []).map(status => (
                                <button
                                    key={status.id}
                                    onClick={() => {
                                        setView('all'); // Force 'all' view so backend applies strict status filter
                                        setFilter(status.id);
                                        setActiveDropdown(null);
                                    }}
                                    className={clsx(
                                        "w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors",
                                        filter === status.id ? "font-medium" : `${theme.text.secondary} ${theme.canvas.hover}`
                                    )}
                                    style={filter === status.id ? {
                                        color: accent.primary,
                                        backgroundColor: `${accent.primary}1A`
                                    } : {}}
                                >
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('sort')}
                        className={clsx(
                            "flex items-center gap-2 border px-3 py-2 rounded-lg text-sm transition-colors",
                            activeDropdown === 'sort' ? "" : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.secondary} ${theme.canvas.hover}`
                        )}
                        style={activeDropdown === 'sort' ? {
                            borderColor: accent.primary,
                            color: accent.primary
                        } : {}}
                    >
                        <Icons.Sort className="w-4 h-4" />
                        <span>Sort</span>
                    </button>

                    {activeDropdown === 'sort' && (
                        <div className={`absolute top-full right-0 mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200`}>
                            {[
                                { id: 'newest', label: 'Newest First' },
                                { id: 'oldest', label: 'Oldest First' },
                                { id: 'upcoming', label: 'Upcoming Event' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setSort(opt.id);
                                        setActiveDropdown(null);
                                    }}
                                    className={clsx(
                                        "block w-full text-left px-4 py-2 text-sm transition-colors",
                                        sort === opt.id ? "font-medium" : `${theme.text.secondary} ${theme.canvas.hover}`
                                    )}
                                    style={sort === opt.id ? {
                                        color: accent.primary
                                    } : {}}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. View Toggle - hidden on mobile */}
                <div className={`hidden md:flex ${theme.canvas.card} border ${theme.canvas.border} rounded-lg p-1`}>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'grid' ? "" : `${theme.text.secondary} ${theme.canvas.hover}`
                        )}
                        style={viewMode === 'grid' ? {
                            backgroundColor: `${accent.primary}25`,
                            color: accent.primary
                        } : {}}
                    >
                        <Icons.Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'list' ? "" : `${theme.text.secondary} ${theme.canvas.hover}`
                        )}
                        style={viewMode === 'list' ? {
                            backgroundColor: `${accent.primary}25`,
                            color: accent.primary
                        } : {}}
                    >
                        <Icons.List className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div >
    );
};

export default Toolbar;
