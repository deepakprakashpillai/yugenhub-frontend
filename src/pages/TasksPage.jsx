import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import { TaskModal } from '../components/modals';
import FloatingActionButton from '../components/FloatingActionButton';
import { toast } from 'sonner';
import TaskSection from '../components/TaskSection';
import TaskFilters from '../components/TaskFilters';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/permissions';
import { useTheme } from '../context/ThemeContext';

const TasksPage = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const canViewAll = usePermission(PERMISSIONS.VIEW_ALL_TASKS);
    const [searchParams, setSearchParams] = useSearchParams();

    // UI State
    const [tab, setTab] = useState(canViewAll ? 'my_tasks' : 'my_tasks'); // Default to 'my_tasks'
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
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

    // Fetch users for assignment (needed for TaskModal)
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
            setEditingTask(null);
            setIsModalOpen(true);
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

            // Clear URL param if present
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
    }

    // Define Section Configs
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
        <div className="p-8 pb-32 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Header + Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">

                <div>
                    <h1 className={`text-4xl font-black ${theme.text.primary} uppercase tracking-tighter`}>Tasks</h1>
                    <p className={`${theme.text.secondary} text-sm mt-1`}>Manage your deliverables and to-dos</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className={`flex gap-1 ${theme.canvas.card} p-1 rounded-xl border ${theme.canvas.border}`}>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                viewMode === 'cards' ? `shadow-sm` : `${theme.text.secondary} ${theme.canvas.hover}`
                            )}
                            style={viewMode === 'cards' ? {
                                backgroundColor: `${theme.accents?.default?.primary}1A`,
                                color: theme.accents?.default?.primary
                            } : {}}
                            title="Card View"
                        >
                            <Icons.Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                viewMode === 'list' ? `shadow-sm` : `${theme.text.secondary} ${theme.canvas.hover}`
                            )}
                            style={viewMode === 'list' ? {
                                backgroundColor: `${theme.accents?.default?.primary}1A`,
                                color: theme.accents?.default?.primary
                            } : {}}
                            title="List View"
                        >
                            <Icons.List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tab Toggle */}
                    <div className={`flex gap-1 ${theme.canvas.card} p-1 rounded-xl border ${theme.canvas.border}`}>
                        <button
                            onClick={() => setTab('my_tasks')}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                tab === 'my_tasks' ? `shadow` : `${theme.text.secondary} ${theme.canvas.hover}`
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
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                    tab === 'all_tasks' ? `shadow` : `${theme.text.secondary} ${theme.canvas.hover}`
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

            {/* Filters */}
            <TaskFilters filters={filters} onChange={setFilters} />

            {/* Sections */}
            <div className="space-y-4">
                {sections.map((section) => (
                    <TaskSection
                        key={section.title + tab} // Remount on tab change to reset state/pagination
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

            {/* Create Task Button (Owner/Admin) */}
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
