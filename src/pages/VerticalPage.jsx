import { useEffect, useState, useMemo } from 'react';
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

const VerticalPage = ({ vertical, title }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Toolbar State ---
    const [search, setSearch] = useState('');
    const [view, setView] = useState('all'); // Default to 'all' so we can apply specific status filters
    const [filter, setFilter] = useState('ongoing'); // Default to 'ongoing' status
    const [sort, setSort] = useState('newest'); // 'newest', 'oldest', 'upcoming'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // --- Refetch Trigger ---
    const [refreshTrigger, setRefreshTrigger] = useState(0); // For child components to trigger refresh

    // --- Modal State ---
    const [projectSlideOver, setProjectSlideOver] = useState(false);
    const [clientModal, setClientModal] = useState({ open: false, callback: null });
    const [actionLoading, setActionLoading] = useState(false);

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
        setFilter('ongoing');
        setSort('newest');
        setView('all');
    };

    const handleAddProject = async (projectData) => {
        setActionLoading(true);
        try {
            // 1. Separate events from core project data
            const { events, ...coreProjectData } = projectData;

            // Generate Project Code (e.g., KNOTS-8392)
            const projectCode = `${vertical.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

            const newProject = {
                id: uuidv4(),
                code: projectCode,
                ...coreProjectData
            };

            // 2. Create Project
            const projectRes = await api.post('/projects', newProject);
            const projectId = projectRes.data?.data?._id || projectRes.data?._id || newProject.id; // Use returned ID if available

            // 3. Create Events & Children
            if (events && events.length > 0) {
                await Promise.all(events.map(async (event) => {
                    // Normalize Date/Time
                    // Combine date and time if present
                    let startDateTime = event.start_date;
                    if (event.start_date && event.start_time) {
                        startDateTime = `${event.start_date}T${event.start_time}:00`;
                    } else if (event.start_date) {
                        startDateTime = `${event.start_date}T00:00:00`;
                    }

                    let endDateTime = event.end_date;
                    if (event.end_date && event.end_time) {
                        endDateTime = `${event.end_date}T${event.end_time}:00`;
                    } else if (event.end_date) {
                        endDateTime = `${event.end_date}T00:00:00`;
                    }

                    // Create Event (Send deliverables IN payload)
                    const { assignments, ...eventPayload } = event; // Keep deliverables in payload, strip assignments to handle separately if needed, or check backend support.
                    // Backend add_event_to_project supports deliverables via EventModel -> TaskModel creation.
                    // It does NOT seem to support inline assignments in EventModel based on project.py code reading?
                    // Let's check EventModel definition? Assuming assignments need separate call.

                    const eventRes = await api.post(`/projects/${projectId}/events`, {
                        ...eventPayload,
                        start_date: startDateTime,
                        end_date: endDateTime,
                        project_id: projectId
                    });

                    const eventId = eventRes.data?.data?._id || eventRes.data?._id;

                    if (eventId) {
                        // Deliverables are handled by backend when passed in event payload

                        // Create Assignments (Backend requires separate call)
                        if (assignments && assignments.length > 0) {
                            await Promise.all(assignments.map(assign =>
                                api.post(`/projects/${projectId}/events/${eventId}/assignments`, { ...assign, event_id: eventId })
                            ));
                        }
                    }
                }));
            }

            setProjectSlideOver(false);
            // Refresh projects list
            setPage(1);
            const response = await api.get('/projects', {
                params: { vertical, limit: LIMIT, page: 1, search: debouncedSearch, status: filter, sort, view }
            });
            setProjects(response.data.data);
            toast.success('Project created successfully!');
        } catch (err) {
            console.error('Failed to create project:', err);
            console.error('Validation Error Details:', err.response?.data);
            const errorMsg = err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || err.message || 'Unknown error';
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
        <div className="p-8 pb-20 max-w-[1600px] mx-auto">
            <h1 className="text-4xl font-black mb-8 text-white uppercase tracking-tighter flex items-center gap-3">
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
                <div className="flex justify-center items-center gap-4 mt-12 bg-zinc-900/50 py-3 px-6 rounded-full w-fit mx-auto border border-zinc-800 backdrop-blur-sm shadow-2xl">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        title={`Go to page ${page - 1}`}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest px-4 border-l border-r border-zinc-800/50">
                        Page <span className="text-white font-bold text-sm mx-1">{page}</span> of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        title={`Go to page ${page + 1}`}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95"
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
                onClose={() => setProjectSlideOver(false)}
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
