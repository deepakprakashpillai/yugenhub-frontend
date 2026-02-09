
import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import clsx from 'clsx';

const Toolbar = ({
    search, setSearch,
    filter, setFilter,
    sort, setSort,
    viewMode, setViewMode,
    view, setView // New Props
}) => {
    const [activeDropdown, setActiveDropdown] = useState(null); // 'filter', 'sort', 'view' or null
    const toolbarRef = useRef(null);

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

                {/* 2. View Selector (Primary Scope) */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('view')}
                        className={clsx(
                            "flex items-center gap-2 bg-zinc-950 border px-3 py-2 rounded-lg text-sm transition-colors",
                            activeDropdown === 'view' ? "border-purple-500 text-white" : "border-zinc-800 text-zinc-300 hover:text-white"
                        )}
                    >
                        <Icons.Layers className="w-4 h-4" />
                        <span className="capitalize">{view || 'Ongoing'}</span>
                        <Icons.ChevronDown className="w-3 h-3 opacity-50" />
                    </button>

                    {activeDropdown === 'view' && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                            {[
                                { id: 'upcoming', label: 'Upcoming', icon: Icons.Calendar },
                                { id: 'ongoing', label: 'Ongoing', icon: Icons.Play },
                                { id: 'enquiry', label: 'Enquiry', icon: Icons.MessageSquare },
                                { id: 'completed', label: 'Completed', icon: Icons.Check },
                                { id: 'cancelled', label: 'Cancelled', icon: Icons.X },
                                { id: 'all', label: 'All Projects', icon: Icons.Grid },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setView(opt.id);
                                        setFilter('all'); // Reset status filter when view changes
                                        setActiveDropdown(null);
                                    }}
                                    className={clsx(
                                        "w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 flex items-center gap-3 transition-colors",
                                        view === opt.id ? "text-purple-500 font-medium bg-purple-500/10" : "text-zinc-400"
                                    )}
                                >
                                    <opt.icon className="w-4 h-4" />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Status Filter (Changes based on View) */}
                {view !== 'all' && (
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('filter')}
                            disabled={view === 'upcoming' || view === 'completed'} // Single status views don't need sub-filters usually, but keeping logic open
                            className={clsx(
                                "flex items-center gap-2 bg-zinc-950 border px-3 py-2 rounded-lg text-sm transition-colors",
                                activeDropdown === 'filter' ? "border-red-500 text-white" : "border-zinc-800 text-zinc-300 hover:text-white",
                                (view === 'upcoming' || view === 'completed') && "opacity-50 cursor-not-allowed hidden md:flex"
                            )}
                        >
                            <Icons.Filter className="w-4 h-4" />
                            <span className="capitalize">{filter === 'all' ? 'All Status' : filter}</span>
                        </button>

                        {activeDropdown === 'filter' && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                {(() => {
                                    let options = ['all'];
                                    if (view === 'ongoing') options = ['all', 'ongoing']; // Renamed production to ongoing here visually
                                    else if (view === 'cancelled') options = ['all', 'cancelled', 'archived'];
                                    else options = ['all'];  // Fallback

                                    return options.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilter(status);
                                                setActiveDropdown(null);
                                            }}
                                            className={clsx(
                                                "block w-full text-left px-4 py-2 text-sm hover:bg-zinc-900 capitalize transition-colors",
                                                filter === status ? "text-red-500 font-medium" : "text-zinc-400"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}

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
