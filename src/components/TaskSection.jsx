import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { Icons } from './Icons';
import TaskCard from './TaskCard';
import TaskTable from './TaskTable';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const TaskSection = ({
    title,
    icon: Icon,
    color = "text-white",
    bgColor = "bg-zinc-800",
    viewMode = 'cards',
    fetchParams = {},
    onEditTask,
    refreshTrigger = 0
}) => {
    const { theme } = useTheme();
    const [tasks, setTasks] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);

    const LIMIT = 12; // 3 rows of 4 cards, or 12 rows of table

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {
                ...fetchParams,
                page,
                limit: LIMIT,
                completed: showCompleted,
                order: fetchParams.sort_by === 'due_date' ? 'asc' : 'desc'
            };

            // Clean undefined params
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const res = await api.get('/tasks', { params });
            setTasks(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error(`Failed to load tasks for ${title}`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [page, showCompleted, refreshTrigger, JSON.stringify(fetchParams)]);

    // Reset page when toggle changes
    useEffect(() => {
        setPage(1);
    }, [showCompleted, JSON.stringify(fetchParams)]);

    // Enrich task (helper)
    const enrichTask = (task) => {
        // Project info is already in the task object or can be derived? 
        // The backend doesn't populate project info extensively, but for basic display it might be enough if added.
        // Actually current backend just returns task fields. 
        // But TaskTable expects project_name. 
        // We might need to fetch projects map ONCE in parent or fetch expanded tasks.
        // For scalability, backend SHOULD probably return project_name/code if needed.
        // Or we can rely on what we have. 
        // Let's assume for now we might miss project names unless backend provides them.
        // I'll update backend to populate project details? Or just fetch projects in parent and pass down?
        // Scalability: Fetching all projects is bad.
        // Ideally task object has `project_name` or `client_name`.
        // I'll check if I can add lookup in backend or frontend.
        // For now, I'll proceed without enriching in SECTION (TaskTable handles missing props gracefully).
        return task;
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="mb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
                        {Icon && <Icon className={clsx("w-5 h-5", color)} />}
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${theme.text.primary} uppercase tracking-tight`}>{title}</h2>
                        <p className={`${theme.text.secondary} text-xs font-medium`}>
                            {loading ? "Loading..." : `${total} task${total !== 1 ? 's' : ''} found`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Show Completed Toggle */}
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all",
                            showCompleted
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : `${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary}`
                        )}
                    >
                        {showCompleted ? <Icons.CheckCircle className="w-3.5 h-3.5" /> : <Icons.Circle className="w-3.5 h-3.5" />}
                        {showCompleted ? "Showing Completed" : "Show Completed"}
                    </button>

                    {/* Pagination Controls (Header optional, maybe just footer) */}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : tasks.length === 0 ? (
                <EmptyState
                    title="No tasks found"
                    message={showCompleted ? "No completed tasks in this section." : "You're all caught up!"}
                    icon={Icons.ClipboardList}
                    action={showCompleted ? {
                        label: "Show Active Tasks",
                        onClick: () => setShowCompleted(false)
                    } : undefined}
                />
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <TaskTable tasks={tasks} onTaskClick={onEditTask} />
                    ) : (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <AnimatePresence>
                                {tasks.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`p-2 rounded-lg ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} disabled:opacity-50 hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                            >
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className={`px-4 py-2 text-sm ${theme.text.secondary} font-medium`}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`p-2 rounded-lg ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} disabled:opacity-50 hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                            >
                                <Icons.ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TaskSection;
