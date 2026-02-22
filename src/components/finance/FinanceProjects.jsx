import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { getProjects } from '../../api/projects';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Search, Loader, RefreshCw, ChevronDown } from 'lucide-react';
import ProjectFinance from './ProjectFinance';
import { Skeleton } from '../ui/Skeleton';

const VerticalProjectList = ({ vertical, onSelectProject, selectedProjectId }) => {
    const { theme } = useTheme();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expanded, setExpanded] = useState(true);

    const LIMIT = 10;

    const fetchProjects = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            const res = await getProjects({
                page: pageNum,
                limit: LIMIT,
                vertical: vertical.id
            }, true);

            const newData = res.data || [];

            setProjects(prev => pageNum === 1 ? newData : [...prev, ...newData]);

            const total = res.total || 0;
            const loaded = (pageNum - 1) * LIMIT + newData.length;
            setHasMore(loaded < total);
        } catch (error) {
            console.error(`Failed to load projects for ${vertical.label}`, error);
        } finally {
            setLoading(false);
        }
    }, [vertical.id, vertical.label]);

    useEffect(() => {
        if (expanded) {
            fetchProjects(1);
        }
    }, [fetchProjects, expanded]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage);
    };

    if (!expanded) {
        return (
            <div className={`mb-2 border-b ${theme.canvas.border}`}>
                <button
                    onClick={() => setExpanded(true)}
                    className="flex items-center w-full py-2 px-1 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded text-left"
                >
                    <span className="transform -rotate-90 mr-2 transition-transform">
                        <ChevronDown size={14} />
                    </span>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.text.secondary}`}>
                        {vertical.label}
                    </h3>
                </button>
            </div>
        );
    }

    return (
        <div className="mb-6 animate-in slide-in-from-left-2 duration-300">
            <button
                onClick={() => setExpanded(false)}
                className={`flex items-center w-full mb-3 px-1 border-b ${theme.canvas.border} pb-1 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded text-left`}
            >
                <span className="transform rotate-0 mr-2 transition-transform">
                    <ChevronDown size={14} />
                </span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.text.secondary}`}>
                    {vertical.label} ({projects.length}{hasMore ? '+' : ''})
                </h3>
            </button>

            <div className="space-y-2">
                {projects.map(project => (
                    <button
                        key={project.id || project._id}
                        onClick={() => onSelectProject(project)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedProjectId === (project._id || project.id)
                            ? `bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800`
                            : `${theme.canvas.card} ${theme.canvas.border} hover:border-indigo-300 dark:hover:border-indigo-700`
                            }`}
                    >
                        <h4 className={`font-medium ${theme.text.primary} truncate`}>
                            {project.metadata?.project_type
                                ? project.metadata.project_type
                                : (project.vertical === 'knots' && (project.metadata?.groom_name || project.metadata?.bride_name))
                                    ? `${project.metadata.groom_name || ''} & ${project.metadata.bride_name || ''}`
                                    : project.code}
                        </h4>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`text-xs ${theme.text.secondary} truncate max-w-[90%] text-left`}>
                                {project.metadata?.client_name || 'No Client'}
                            </span>
                        </div>
                    </button>
                ))}

                {loading && (
                    <div className="flex justify-center py-2">
                        <Loader size={16} className="animate-spin text-indigo-500" />
                    </div>
                )}

                {hasMore && !loading && (
                    <button
                        onClick={handleLoadMore}
                        className={`w-full py-2 text-xs font-medium ${theme.text.secondary} hover:${theme.text.primary} hover:bg-gray-50 dark:hover:bg-zinc-800 rounded transition-colors`}
                    >
                        Load More from {vertical.label}
                    </button>
                )}

                {!loading && projects.length === 0 && (
                    <p className={`text-xs ${theme.text.secondary} italic px-2`}>No projects</p>
                )}
            </div>
        </div>
    );
};

const FinanceProjects = () => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig(); // To get verticals
    const [selectedProject, setSelectedProject] = useState(null);
    const [search, setSearch] = useState('');
    const isMobile = useIsMobile(); // NEW: Hook for device detection

    // Global Search State
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Debounced Search
    useEffect(() => {
        const performSearch = async () => {
            if (!search.trim()) {
                setIsSearching(false);
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            setSearchLoading(true);
            try {
                const res = await getProjects({
                    limit: 50, // Higher limit for search
                    search: search
                }, true);
                setSearchResults(res.data || []);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setSearchLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Handle initial selection if needed or deep linking?
    // For now, simple state.

    return (
        <div className="h-full flex flex-col md:flex-row gap-0 md:gap-6 overflow-hidden">
            {/* Left: Project List */}
            {(!isMobile || !selectedProject) && (
                <div className={`w-full md:w-1/3 flex flex-col md:border-r ${theme.canvas.border} md:pr-4 h-full`}>
                    <div className="mb-4 relative flex-shrink-0">
                        <Search className={`absolute left-3 top-2.5 w-4 h-4 ${theme.text.secondary}`} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {isSearching ? (
                            // SEARCH RESULTS VIEW
                            <div className="space-y-2">
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.text.secondary} mb-3 px-1`}>
                                    Search Results
                                </h3>
                                {searchLoading ? (
                                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(project => (
                                        <button
                                            key={project.id || project._id}
                                            onClick={() => setSelectedProject(project)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedProject?._id === project._id || selectedProject?.id === project.id
                                                ? `bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800`
                                                : `${theme.canvas.card} ${theme.canvas.border} hover:border-indigo-300 dark:hover:border-indigo-700`
                                                }`}
                                        >
                                            <h4 className={`font-medium ${theme.text.primary} truncate`}>
                                                {project.code}
                                            </h4>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className={`text-xs ${theme.text.secondary} truncate`}>
                                                    {project.metadata?.client_name || 'No Client'}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500">
                                                    {project.vertical || 'Gen'}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className={`text-center py-8 ${theme.text.secondary}`}>
                                        No matching projects
                                    </div>
                                )}
                            </div>
                        ) : (
                            // VERTICAL LISTS VIEW
                            <div className="pb-4">
                                {config && config.verticals ? (
                                    config.verticals.map(vertical => (
                                        <VerticalProjectList
                                            key={vertical.id}
                                            vertical={vertical}
                                            onSelectProject={setSelectedProject}
                                            selectedProjectId={selectedProject?.id || selectedProject?._id}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-4">Loading configuration...</div>
                                )}

                                {/* General / Other if needed, but config.verticals should cover main ones. 
                                Could add a 'General' fallback if you have projects without verticals 
                            */}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Right: Project Details */}
            {(!isMobile || selectedProject) && (
                <div className={`flex-1 overflow-y-auto h-full md:pl-2`}>
                    {selectedProject ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6">
                                <div>
                                    {isMobile && (
                                        <button
                                            onClick={() => setSelectedProject(null)}
                                            className={`mb-2 text-xs font-semibold ${theme.text.secondary} hover:${theme.text.primary} transition flex items-center gap-1`}
                                        >
                                            &larr; Back to List
                                        </button>
                                    )}
                                    <h2 className="text-lg sm:text-xl font-bold">{selectedProject.code}</h2>
                                    <p className={`text-[10px] sm:text-sm ${theme.text.secondary}`}>
                                        {selectedProject.metadata?.client_name}
                                    </p>
                                </div>
                            </div>

                            <ProjectFinance
                                projectId={selectedProject._id || selectedProject.id}
                                projectData={selectedProject}
                                onUpdateProject={() => {
                                    // Trigger refresh? Probably handled internally in ProjectFinance or context
                                }}
                            />
                        </div>
                    ) : (
                        <div className={`hidden md:flex h-full flex-col items-center justify-center ${theme.text.secondary} opacity-50`}>
                            <RefreshCw className="w-12 h-12 mb-4" />
                            <p>Select a project to view financials</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FinanceProjects;
