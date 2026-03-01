import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Toolbar from '../components/Toolbar';
import ProjectCard from '../components/ProjectCard';
import ProjectTable from '../components/ProjectTable';
import StatsHeader from '../components/StatsHeader';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import { Icons } from '../components/Icons';
import FloatingActionButton from '../components/FloatingActionButton';
import { ProjectSlideOver, ClientModal } from '../components/modals';
import { v4 as uuidv4 } from 'uuid';

import { useTheme } from '../context/ThemeContext';

const VerticalPage = ({ vertical, title }) => {
    const { theme } = useTheme();

    const [searchParams, setSearchParams] = useSearchParams();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Toolbar State ---
    const [search, setSearch] = useState('');
    const [view, setView] = useState('active'); // Default to 'active' (Booked & Ongoing)
    const [filter, setFilter] = useState('all'); // Default to 'all' status for the active view
    const [sort, setSort] = useState('newest'); // 'newest', 'oldest', 'upcoming'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // --- Refetch Trigger ---
    const [refreshTrigger, setRefreshTrigger] = useState(0); // For child components to trigger refresh

    // --- Modal State ---
    const [projectSlideOver, setProjectSlideOver] = useState(false);
    const [clientModal, setClientModal] = useState({ open: false, callback: null });
    const [actionLoading, setActionLoading] = useState(false);

    // Auto-open Project SlideOver if ?action=new exists
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setProjectSlideOver(true);
        }
    }, [searchParams]);

    // Handle closing slideover and clearing param
    const handleCloseSlideOver = () => {
        setProjectSlideOver(false);
        // Remove action param but keep others if any (though currently we don't use others in URL for filter state sync yet)
        if (searchParams.get('action') === 'new') {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('action');
            setSearchParams(newParams);
        }
    };

    // --- Pagination & Filter State ---
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 12;

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [search]);

    // Reset page when filters change (except page itself)
    useEffect(() => {
        setPage(1);
    }, [vertical, debouncedSearch, filter, sort, view, refreshTrigger]);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch with PAGINATION & FILTERS (Backend Side)
                const response = await api.get('/projects', {
                    params: {
                        vertical,
                        limit: LIMIT,
                        page: page,
                        search: debouncedSearch,
                        status: filter,
                        sort: sort,
                        view: view // Pass view to backend
                    },
                });
                setProjects(response.data.data);

                if (response.data.total !== undefined) {
                    setTotalPages(Math.ceil(response.data.total / LIMIT));
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setError("Could not load projects.");
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [vertical, page, debouncedSearch, filter, sort, view, refreshTrigger]);

    // --- HANDLERS ---
    const handleClearFilters = () => {
        setSearch('');
        setFilter('all');
        setSort('newest');
        setView('active');
    };

    const handleAddProject = async (projectData) => {
        setActionLoading(true);
        try {
            // 1. Validation: Ensure every event has a start date
            const invalidEvents = (projectData.events || []).filter(e => !e.start_date);
            if (invalidEvents.length > 0) {
                toast.error(`Please provide a start date for all events (${invalidEvents.map(e => e.type).join(', ')})`);
                return;
            }

            // 1.5 Clean payload for backend validation
            const cleanedEvents = (projectData.events || []).map(event => {
                const cleanedEvent = { ...event };

                // Combine date and time
                if (cleanedEvent.start_date) {
                    cleanedEvent.start_date = cleanedEvent.start_time
                        ? `${cleanedEvent.start_date}T${cleanedEvent.start_time}:00`
                        : `${cleanedEvent.start_date}T00:00:00`;
                }

                if (cleanedEvent.end_date) {
                    cleanedEvent.end_date = cleanedEvent.end_time
                        ? `${cleanedEvent.end_date}T${cleanedEvent.end_time}:00`
                        : `${cleanedEvent.end_date}T00:00:00`;
                } else {
                    cleanedEvent.end_date = null; // Fix "" -> null
                }

                // Remove frontend-only helper fields
                delete cleanedEvent.start_time;
                delete cleanedEvent.end_time;

                // Clean deliverables
                if (cleanedEvent.deliverables) {
                    cleanedEvent.deliverables = cleanedEvent.deliverables.map(del => {
                        const cleanedDel = { ...del };
                        if (!cleanedDel.due_date) {
                            cleanedDel.due_date = null;
                        } else if (cleanedDel.due_date.length === 10) {
                            // If it's just a date 'YYYY-MM-DD', append time
                            cleanedDel.due_date = `${cleanedDel.due_date}T00:00:00`;
                        }
                        return cleanedDel;
                    });
                }

                return cleanedEvent;
            });

            const payload = {
                ...projectData,
                events: cleanedEvents
            };

            // 2. Send unified payload to backend (including events, deliverables, assignments)
            const response = await api.post('/projects', payload);

            // The backend returns the created project including its generated ID and sequential code
            const savedProject = response.data;

            setProjects(prev => [savedProject, ...prev]);
            toast.success(`Project ${savedProject.code} created successfully!`);
            setProjectSlideOver(false);
            setRefreshTrigger(p => p + 1);

        } catch (err) {
            console.error('Failed to create project:', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
            toast.error(`Failed to create project: ${errorMsg}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddClient = (callback) => {
        setClientModal({ open: true, callback });
    };

    const handleSaveClient = async (clientData) => {
        setActionLoading(true);
        try {
            const response = await api.post('/clients', { id: uuidv4(), ...clientData });
            const newClient = response.data;
            setClientModal({ open: false, callback: null });
            // Call the callback to select this client in the project form
            if (clientModal.callback) {
                clientModal.callback(newClient);
            }
        } catch (err) {
            console.error('Failed to create client:', err);
            toast.error('Failed to create client');
        } finally {
            setActionLoading(false);
        }
    };

    // --- RENDER HELPERS ---
    // Direct pass-through since backend does the heavy lifting
    const displayProjects = projects;


    return (
        <div className={`p-4 md:p-8 pb-20 max-w-[1600px] mx-auto ${theme.text.primary}`}>
            <h1 className={`text-2xl md:text-4xl font-black mb-4 md:mb-8 ${theme.text.primary} uppercase tracking-tighter flex items-center gap-3`}>
                {title}
            </h1>

            {/* STATS HEADER */}
            <StatsHeader vertical={vertical} view={view} />

            {/* TOOLBAR */}
            <Toolbar
                search={search} setSearch={setSearch}
                filter={filter} setFilter={setFilter}
                sort={sort} setSort={setSort}
                viewMode={viewMode} setViewMode={setViewMode}
                view={view} setView={setView}
            />

            {error && <div className="text-red-500 bg-red-500/10 p-4 rounded border border-red-500/20 mb-8">{error}</div>}

            {/* LOADING STATE - SKELETONS */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && displayProjects.length === 0 && (
                <EmptyState onClear={handleClearFilters} />
            )}

            {/* VIEW CONTENT */}
            {!loading && displayProjects.length > 0 && (
                <AnimatePresence mode='wait'>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayProjects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    onRefresh={() => setRefreshTrigger(p => p + 1)}
                                />
                            ))}
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <ProjectTable
                            projects={displayProjects}
                            onRefresh={() => setRefreshTrigger(p => p + 1)}
                        />
                    )}
                </AnimatePresence>
            )}

            {/* PAGINATION CONTROLS */}
            {!loading && totalPages > 1 && (
                <div className={`flex justify-center items-center gap-4 mt-12 ${theme.canvas.card} py-3 px-6 rounded-full w-fit mx-auto border ${theme.canvas.border} backdrop-blur-sm shadow-2xl`}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        title={`Go to page ${page - 1}`}
                        className={`p-2 rounded-full ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95`}
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className={`${theme.text.secondary} font-mono text-xs uppercase tracking-widest px-4 border-l border-r ${theme.canvas.border}`}>
                        Page <span className={`${theme.text.primary} font-bold text-sm mx-1`}>{page}</span> of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        title={`Go to page ${page + 1}`}
                        className={`p-2 rounded-full ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95`}
                    >
                        <Icons.ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Floating Action Button */}
            <FloatingActionButton
                onClick={() => setProjectSlideOver(true)}
                label="Add Project"
            />

            {/* Project Slide-Over */}
            <ProjectSlideOver
                isOpen={projectSlideOver}
                onClose={handleCloseSlideOver}
                onSave={handleAddProject}
                onAddClient={handleAddClient}
                vertical={vertical}
                loading={actionLoading}
            />

            {/* Client Modal */}
            <ClientModal
                isOpen={clientModal.open}
                onClose={() => setClientModal({ open: false, callback: null })}
                onSave={handleSaveClient}
                loading={actionLoading}
            />

        </div>
    );
};

export default VerticalPage;
