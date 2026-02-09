import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Icons } from './Icons';
import { Link } from 'react-router-dom';

const TaskCard = ({ task, onClick, onStatusChange }) => {
    // Helpers
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const isUrgent = task.priority === 'urgent';

    const statusColors = {
        todo: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        in_progress: 'bg-blue-900/20 text-blue-400 border-blue-900/50',
        review: 'bg-purple-900/20 text-purple-400 border-purple-900/50',
        blocked: 'bg-red-900/20 text-red-400 border-red-900/50',
        done: 'bg-green-900/20 text-green-400 border-green-900/50',
    };

    const priorityIcons = {
        low: <Icons.ArrowDown className="w-3 h-3 text-blue-400" />,
        medium: <Icons.Minus className="w-3 h-3 text-yellow-400" />,
        high: <Icons.ArrowUp className="w-3 h-3 text-orange-400" />,
        urgent: <Icons.AlertTriangle className="w-3 h-3 text-red-500" />,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={clsx(
                "group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-3",
                isUrgent ? "bg-red-950/10 border-red-900/30 hover:border-red-500/50" : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-600"
            )}
        >
            {/* Header: Priority & Status */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <span title={`Priority: ${task.priority}`} className="p-1 rounded bg-zinc-900 border border-zinc-800">
                        {priorityIcons[task.priority]}
                    </span>
                    {task.project_name && (
                        <Link
                            to={`/projects/${task.project_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                        >
                            <div className={clsx("w-1.5 h-1.5 rounded-full bg-gradient-to-r", task.project_color || "from-zinc-500 to-zinc-400")} />
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide truncate max-w-[80px]">
                                {task.project_name}
                            </span>
                        </Link>
                    )}
                </div>

                {/* Status Badge (Click to cycle? Or just display?) */}
                <div className={clsx(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border",
                    statusColors[task.status]
                )}>
                    {task.status.replace('_', ' ')}
                </div>
            </div>

            {/* Title */}
            <div>
                <h4 className={clsx("font-bold text-sm leading-snug group-hover:text-purple-400 transition-colors", task.status === 'done' && "line-through text-zinc-500")}>
                    {task.title}
                </h4>
            </div>

            {/* Footer: Date & Assignee */}
            <div className="mt-auto pt-3 flex justify-between items-center border-t border-zinc-800/50">
                {/* Due Date */}
                <div className={clsx(
                    "text-xs flex items-center gap-1.5",
                    isOverdue ? "text-red-400 font-bold" : "text-zinc-500"
                )}>
                    <Icons.Calendar className="w-3 h-3" />
                    {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                </div>

                {/* Assignee Avatar (Placeholder) */}
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white font-bold" title="Unassigned">
                        {task.assigned_to ? '👤' : '?'}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
