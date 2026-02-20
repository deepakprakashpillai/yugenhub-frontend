import clsx from 'clsx';
import { Icons } from './Icons';

// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const statusColors = {
    todo: 'bg-zinc-800/50 text-zinc-300 border-zinc-700',
    in_progress: 'bg-blue-900/20 text-blue-400 border-blue-900/50',
    review: 'bg-purple-900/20 text-purple-400 border-purple-900/50',
    blocked: 'bg-red-900/20 text-red-400 border-red-900/50',
    done: 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50',
};

const priorityIcons = {
    low: { icon: Icons.ArrowDown, color: 'text-zinc-500' },
    medium: { icon: Icons.Minus, color: 'text-blue-400' },
    high: { icon: Icons.ArrowUp, color: 'text-amber-400' },
    urgent: { icon: Icons.AlertTriangle, color: 'text-red-500' },
};

const TaskTable = ({ tasks, onTaskClick }) => {
    const { theme } = useTheme();
    if (!tasks.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`overflow-x-auto rounded-xl border ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-30 backdrop-blur-sm`}
        >
            <table className={`w-full text-left text-sm ${theme.text.secondary}`}>
                <thead className={`${theme.canvas.card} bg-opacity-50 text-xs uppercase font-medium ${theme.text.secondary} border-b ${theme.canvas.border}`}>
                    <tr>
                        <th className="px-6 py-4 w-10"></th>
                        <th className="px-6 py-4">Task</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Project</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${theme.canvas.border}`}>
                    {tasks.map((task) => {
                        const PriorityIcon = priorityIcons[task.priority]?.icon || Icons.Minus;
                        const priorityColor = priorityIcons[task.priority]?.color || 'text-zinc-500';

                        return (
                            <tr
                                key={task.id}
                                onClick={() => onTaskClick?.(task)}
                                className={`hover:${theme.canvas.hover} transition-colors cursor-pointer group`}
                            >
                                {/* Checkbox placeholder */}
                                <td className="px-6 py-4">
                                    <div className={clsx(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                        task.status === 'done'
                                            ? "bg-emerald-500 border-emerald-500"
                                            : `border-zinc-700 group-hover:${theme.text.primary}` // Keep zinc border for unchecked, generic
                                    )}>
                                        {task.status === 'done' && (
                                            <Icons.Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                </td>

                                {/* Task Title */}
                                <td className="px-6 py-4">
                                    <div className={clsx(
                                        "font-medium",
                                        task.status === 'done' ? `${theme.text.secondary} line-through` : `${theme.text.primary}`
                                    )}>
                                        {task.title}
                                    </div>
                                    {task.description && (
                                        <div className={`text-xs ${theme.text.secondary} truncate max-w-xs`}>
                                            {task.description}
                                        </div>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "text-xs px-2 py-1 rounded-full font-medium capitalize border",
                                        statusColors[task.status] || `${theme.canvas.card} ${theme.text.secondary} border-zinc-700` // Fallback
                                    )}>
                                        {task.status?.replace('_', ' ')}
                                    </span>
                                </td>

                                {/* Priority */}
                                <td className="px-6 py-4">
                                    <div className={clsx("flex items-center gap-1.5", priorityColor)}>
                                        <PriorityIcon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium capitalize">{task.priority}</span>
                                    </div>
                                </td>

                                {/* Due Date */}
                                <td className="px-6 py-4">
                                    {task.due_date ? (
                                        <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                                            <Icons.Calendar className={`w-3 h-3 ${theme.text.secondary}`} />
                                            <span className="text-xs">
                                                {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600 text-xs">-</span>
                                    )}
                                </td>

                                {/* Project */}
                                <td className="px-6 py-4">
                                    {(task.project_name || task.project_code) ? (
                                        <Link
                                            to={`/projects/${task.project_id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`text-xs ${theme.text.secondary} ${theme.canvas.card} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors px-2 py-1 rounded inline-block`}
                                        >
                                            {task.project_name || task.project_code}
                                        </Link>
                                    ) : (
                                        <span className={`${theme.text.secondary} text-xs`}>Internal</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </motion.div>
    );
};

export default TaskTable;
