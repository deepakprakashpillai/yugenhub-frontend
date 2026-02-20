import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import { TaskModal } from '../components/modals';
import FloatingActionButton from '../components/FloatingActionButton';
import { toast } from 'sonner';
import TaskSection from '../components/TaskSection';
import TaskFilters from '../components/TaskFilters';
import TaskKanbanBoard from '../components/TaskKanbanBoard';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';
import { useTheme } from '../context/ThemeContext';

const CATEGORY_TABS = [
    { key: 'all', label: 'All Tasks', icon: Icons.Layers },
    { key: 'deliverable', label: 'Deliverables', icon: Icons.Package },
    { key: 'project', label: 'Project Tasks', icon: Icons.ClipboardList },
    { key: 'general', label: 'General', icon: Icons.ListTodo },
];

const VIEW_MODES = [
    { key: 'kanban', label: 'Board', icon: Icons.Columns },
    { key: 'cards', label: 'Cards', icon: Icons.Grid },
    { key: 'list', label: 'List', icon: Icons.List },
];

const TasksPage = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const canViewAll = usePermission(PERMISSIONS.VIEW_ALL_TASKS);
    const [searchParams, setSearchParams] = useSearchParams();

    // UI State
    const [tab, setTab] = useState('my_tasks');
    const [viewMode, setViewMode] = useState('kanban'); // default to kanban
    const [categoryTab, setCategoryTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        priority: 'all',
        sort_by: 'created_at'
    });

    // Fetch users for assignment
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to load users", err);
            }
        };
        fetchUsers();
    }, []);

    // Auto-open modal from URL
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setTimeout(() => {
                setEditingTask(null);
                setIsModalOpen(true);
            }, 0);
        }
    }, [searchParams]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (searchParams.get('action') === 'new') {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('action');
            setSearchParams(newParams);
        }
    };

    const handleSaveTask = async (formData) => {
        try {
            if (editingTask) {
                await api.patch(`/tasks/${editingTask.id}`, formData);
                toast.success("Task updated successfully");
            } else {
                await api.post('/tasks', { ...formData });
                toast.success("Task created successfully");
            }
            setRefreshTrigger(prev => prev + 1);
            setIsModalOpen(false);
            setEditingTask(null);

            if (searchParams.get('action') === 'new') {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('action');
                setSearchParams(newParams);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save task");
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // Build params for the active category tab
    const categoryParams = useMemo(() => {
        const params = {
            assigned_to: tab === 'my_tasks' ? user?.id : undefined,
        };

        if (categoryTab === 'deliverable') {
            params.category = 'deliverable';
        } else if (categoryTab === 'project') {
            params.category = 'general';
            params.has_project = true;
        } else if (categoryTab === 'general') {
            params.category = 'general';
            params.has_project = false;
        }
        // 'all' = no category/has_project filter

        return params;
    }, [categoryTab, tab, user?.id]);

    // Combined params with filters (for kanban: only search + priority)
    const kanbanParams = useMemo(() => ({
        ...categoryParams,
        search: filters.search || undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
    }), [categoryParams, filters.search, filters.priority]);

    // Section-based configs (for card/list fallback views)
    const sections = [
        {
            title: "Deliverables",
            icon: Icons.Package,
            bgColor: "bg-blue-500/20",
            color: "text-blue-400",
            params: {
                category: 'deliverable',
                assigned_to: tab === 'my_tasks' ? user?.id : undefined,
                ...filters
            }
        },
        {
            title: "Project Tasks",
            icon: Icons.ClipboardList,
            bgColor: "bg-amber-500/20",
            color: "text-amber-400",
            params: {
                category: 'general',
                has_project: true,
                assigned_to: tab === 'my_tasks' ? user?.id : undefined,
                ...filters
            }
        },
        {
            title: "General Tasks",
            icon: Icons.Layers,
            bgColor: "bg-purple-500/20",
            color: "text-purple-400",
            params: {
                category: 'general',
                has_project: false,
                assigned_to: tab === 'my_tasks' ? user?.id : undefined,
                ...filters
            }
        }
    ];

    return (
        <div className="p-4 md:p-8 pb-32 max-w-[1800px] mx-auto min-h-screen relative">
            {/* Header + Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className={`text-2xl md:text-4xl font-black ${theme.text.primary} uppercase tracking-tighter`}>Tasks</h1>
                    <p className={`${theme.text.secondary} text-sm mt-1`}>Manage your deliverables and to-dos</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className={`flex gap-1 ${theme.canvas.card} p-1 rounded-xl border ${theme.canvas.border}`}>
                        {VIEW_MODES.map(vm => (
                            <button
                                key={vm.key}
                                onClick={() => setViewMode(vm.key)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                                    viewMode === vm.key ? "shadow" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={viewMode === vm.key ? {
                                    backgroundColor: `${theme.accents?.default?.primary}1A`,
                                    color: theme.accents?.default?.primary
                                } : {}}
                                title={vm.label}
                            >
                                <vm.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{vm.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* My Tasks / All Tasks Toggle */}
                    <div className={`flex gap-1 ${theme.canvas.card} p-1 rounded-xl border ${theme.canvas.border}`}>
                        <button
                            onClick={() => setTab('my_tasks')}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                                tab === 'my_tasks' ? "shadow" : `${theme.text.secondary} ${theme.canvas.hover}`
                            )}
                            style={tab === 'my_tasks' ? {
                                backgroundColor: `${theme.accents?.default?.primary}1A`,
                                color: theme.accents?.default?.primary
                            } : {}}
                        >
                            My Tasks
                        </button>
                        {canViewAll && (
                            <button
                                onClick={() => setTab('all_tasks')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                                    tab === 'all_tasks' ? "shadow" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={tab === 'all_tasks' ? {
                                    backgroundColor: `${theme.accents?.default?.primary}1A`,
                                    color: theme.accents?.default?.primary
                                } : {}}
                            >
                                All Tasks
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Tabs (for Kanban view) */}
            {viewMode === 'kanban' && (
                <div className={`flex gap-1 p-1 rounded-xl border ${theme.canvas.border} ${theme.canvas.card} mb-4 overflow-x-auto`}>
                    {CATEGORY_TABS.map(ct => (
                        <button
                            key={ct.key}
                            onClick={() => setCategoryTab(ct.key)}
                            className={clsx(
                                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                                categoryTab === ct.key
                                    ? "shadow-sm"
                                    : `${theme.text.secondary} ${theme.canvas.hover}`
                            )}
                            style={categoryTab === ct.key ? {
                                backgroundColor: `${theme.accents?.default?.primary}1A`,
                                color: theme.accents?.default?.primary
                            } : {}}
                        >
                            <ct.icon className="w-3.5 h-3.5" />
                            {ct.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Filters */}
            <TaskFilters filters={filters} onChange={setFilters} />

            {/* Main Content */}
            {viewMode === 'kanban' ? (
                <TaskKanbanBoard
                    key={categoryTab + tab}
                    fetchParams={kanbanParams}
                    onEditTask={handleEditTask}
                    refreshTrigger={refreshTrigger}
                    users={users}
                />
            ) : (
                <div className="space-y-4">
                    {sections.map((section) => (
                        <TaskSection
                            key={section.title + tab}
                            title={section.title}
                            icon={section.icon}
                            bgColor={section.bgColor}
                            color={section.color}
                            viewMode={viewMode}
                            fetchParams={section.params}
                            onEditTask={handleEditTask}
                            refreshTrigger={refreshTrigger}
                        />
                    ))}
                </div>
            )}

            {/* Create Task Button */}
            {['owner', 'admin'].includes(user?.role) && (
                <FloatingActionButton label="Add Task" onClick={() => { setEditingTask(null); setIsModalOpen(true); }} />
            )}

            {/* Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
                task={editingTask}
                users={users}
            />
        </div>
    );
};

export default TasksPage;
