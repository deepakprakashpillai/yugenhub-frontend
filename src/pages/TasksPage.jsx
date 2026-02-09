import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import { TaskModal } from '../components/modals';
import FloatingActionButton from '../components/FloatingActionButton';
import TaskSection from '../components/TaskSection';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const TasksPage = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // UI State
    const [tab, setTab] = useState('my_tasks'); // 'my_tasks' | 'all_tasks'
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [users, setUsers] = useState([]);

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

    const handleSaveTask = async (formData) => {
        try {
            if (editingTask) {
                await api.patch(`/tasks/${editingTask.id}`, formData);
            } else {
                await api.post('/tasks', { ...formData, type: 'internal' });
            }
            setRefreshTrigger(prev => prev + 1);
            setIsModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            console.error(err);
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
                assigned_to: tab === 'my_tasks' ? user?.id : undefined
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
                assigned_to: tab === 'my_tasks' ? user?.id : undefined
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
                assigned_to: tab === 'my_tasks' ? user?.id : undefined
            }
        }
    ];

    return (
        <div className="p-8 pb-32 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Header + Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Tasks</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage your deliverables and to-dos</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                viewMode === 'cards' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                            )}
                            title="Card View"
                        >
                            <Icons.Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                viewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                            )}
                            title="List View"
                        >
                            <Icons.List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tab Toggle */}
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                            onClick={() => setTab('my_tasks')}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                tab === 'my_tasks' ? "bg-white text-black shadow" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            My Tasks
                        </button>
                        {['owner', 'admin'].includes(user?.role) && (
                            <button
                                onClick={() => setTab('all_tasks')}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                    tab === 'all_tasks' ? "bg-white text-black shadow" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                All Tasks
                            </button>
                        )}
                    </div>
                </div>
            </div>

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
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
                users={users}
            />
        </div>
    );
};

export default TasksPage;
