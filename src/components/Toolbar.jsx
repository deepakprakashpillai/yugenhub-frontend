
import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import clsx from 'clsx';
import { useAgencyConfig } from '../context/AgencyConfigContext';

const Toolbar = ({
    search, setSearch,
    filter, setFilter,
    sort, setSort,
    viewMode, setViewMode,
    view, setView
}) => {
    // We will combine 'view' and 'filter' into a single UI concept "Filter"
    // However, we still need to pass them separately to the parent/API.
    // Logic:
    // - "Upcoming" -> view='upcoming', filter='all'
    // - "All Projects" -> view='all', filter='all'
    // - Specific Status -> view='all', filter='status_id'

    const [activeDropdown, setActiveDropdown] = useState(null); // 'filter', 'sort' or null
    const toolbarRef = useRef(null);
    const { config } = useAgencyConfig();

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
        <div ref={toolbarRef} className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm sticky top-0 z-10 transition-all">

            {/* 1. Search Bar */}
            <div className="relative w-full md:w-1/3">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-red-500 transition-colors"
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">



                {/* 2. Combined Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('filter')}
                        className={clsx(
                            "flex items-center gap-2 bg-zinc-950 border px-3 py-2 rounded-lg text-sm transition-colors",
                            activeDropdown === 'filter' ? "border-purple-500 text-white" : "border-zinc-800 text-zinc-300 hover:text-white"
                        )}
                    >
                        <Icons.Filter className="w-4 h-4" />
                        <span className="capitalize">{getCurrentFilterLabel()}</span>
                        <Icons.ChevronDown className="w-3 h-3 opacity-50" />
                    </button>

                    {activeDropdown === 'filter' && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Special Views */}
                            <button
                                onClick={() => { setView('all'); setFilter('all'); setActiveDropdown(null); }}
                                className={clsx(
                                    "w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 flex items-center gap-3 transition-colors",
                                    (view === 'all' && filter === 'all') ? "text-purple-500 font-medium bg-purple-500/10" : "text-zinc-400"
                                )}
                            >
                                <Icons.Grid className="w-4 h-4" />
                                All Projects
                            </button>
                            <button
                                onClick={() => { setView('upcoming'); setFilter('all'); setActiveDropdown(null); }}
                                className={clsx(
                                    "w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 flex items-center gap-3 transition-colors",
                                    view === 'upcoming' ? "text-purple-500 font-medium bg-purple-500/10" : "text-zinc-400"
                                )}
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
                                        "w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 flex items-center gap-2 transition-colors",
                                        filter === status.id ? "text-purple-500 font-medium bg-purple-500/10" : "text-zinc-400"
                                    )}
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
                            "flex items-center gap-2 bg-zinc-950 border px-3 py-2 rounded-lg text-sm transition-colors",
                            activeDropdown === 'sort' ? "border-red-500 text-white" : "border-zinc-800 text-zinc-300 hover:text-white"
                        )}
                    >
                        <Icons.Sort className="w-4 h-4" />
                        <span>Sort</span>
                    </button>

                    {activeDropdown === 'sort' && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
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
                                        "block w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 transition-colors",
                                        sort === opt.id ? "text-red-500 font-medium" : "text-zinc-400"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. View Toggle */}
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Icons.Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "p-2 rounded-md transition-colors",
                            viewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Icons.List className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div >
    );
};

export default Toolbar;
