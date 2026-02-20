import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
 
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Icons } from './Icons';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { toast } from 'sonner';

const STATUS_CONFIG = {
    todo: { label: 'To Do', icon: Icons.Circle, colorClass: 'text-zinc-400' },
    in_progress: { label: 'In Progress', icon: Icons.Timer, colorClass: 'text-blue-400' },
    review: { label: 'Review', icon: Icons.Eye, colorClass: 'text-purple-400' },
    blocked: { label: 'Blocked', icon: Icons.Ban, colorClass: 'text-red-400' },
    done: { label: 'Done', icon: Icons.CheckCircle, colorClass: 'text-emerald-400' },
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', icon: Icons.ArrowDown, colorClass: 'text-blue-400' },
    medium: { label: 'Medium', icon: Icons.Minus, colorClass: 'text-yellow-400' },
    high: { label: 'High', icon: Icons.ArrowUp, colorClass: 'text-orange-400' },
    urgent: { label: 'Urgent', icon: Icons.AlertTriangle, colorClass: 'text-red-500' },
};

const InlineDropdown = ({ options, value, onChange, trigger, alignRight = false }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="cursor-pointer">
                {trigger}
            </div>
            {open && (
                <div className={clsx(
                    "absolute z-50 mt-1 py-1 rounded-lg border bg-zinc-950 border-zinc-800 shadow-2xl min-w-[140px]",
                    alignRight ? "right-0" : "left-0"
                )}>
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                            className={clsx(
                                "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-800 transition-colors",
                                value === opt.value ? "bg-zinc-800/50" : ""
                            )}
                        >
                            {opt.icon && <opt.icon className={clsx("w-3 h-3", opt.colorClass)} />}
                            <span className={clsx(opt.colorClass)}>{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const TaskKanbanCard = ({ task, onClick, onTaskUpdate, users = [] }) => {
    const { theme } = useTheme();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const daysOverdue = isOverdue ? Math.ceil((new Date() - new Date(task.due_date)) / (1000 * 60 * 60 * 24)) : 0;

    const handleInlineUpdate = async (field, value) => {
        try {
            const payload = { [field]: value };
            // If changing to blocked, we'd need a comment — skip inline for that
            if (field === 'status' && value === 'blocked') {
                // Open modal instead
                onClick?.(task);
                return;
            }
            await api.patch(`/tasks/${task.id}`, payload);
            onTaskUpdate?.();
            toast.success(`Updated ${field}`);
        } catch (err) {
            console.error('Inline update failed', err);
            toast.error('Update failed');
        }
    };

    // eslint-disable-next-line
    const statusOpts = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, ...c }));
    const priorityOpts = Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ value: v, ...c }));
    const assigneeOpts = [
        { value: '', label: 'Unassigned', icon: Icons.UserCircle, colorClass: 'text-zinc-500' },
        ...users.map(u => ({ value: u.id, label: u.name, icon: Icons.User, colorClass: 'text-zinc-300' }))
    ];

    const assigneeName = users.find(u => u.id === task.assigned_to)?.name;

    const currentPriority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const PriorityIcon = currentPriority.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={clsx(
                "group relative rounded-xl border p-3 transition-all cursor-pointer",
                isDragging
                    ? "opacity-50 shadow-2xl scale-[1.02] border-purple-500/50 bg-zinc-900"
                    : `${theme.canvas.card} ${theme.canvas.border} hover:border-zinc-600`,
                isOverdue && !isDragging && "ring-1 ring-red-500/30"
            )}
            onClick={() => onClick?.(task)}
        >
            {/* Drag handle + Priority */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <div
                        {...attributes}
                        {...listeners}
                        className={`${theme.text.secondary} opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Icons.GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <InlineDropdown
                        value={task.priority}
                        options={priorityOpts}
                        onChange={(val) => handleInlineUpdate('priority', val)}
                        trigger={
                            <div className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase border border-transparent hover:border-zinc-700 transition-colors", currentPriority.colorClass)}>
                                <PriorityIcon className="w-3 h-3" />
                                <span className="hidden xl:inline">{currentPriority.label}</span>
                            </div>
                        }
                    />
                </div>

                {/* Project Tag */}
                {(task.project_name || task.project_code) && (
                    <Link
                        to={`/projects/${task.project_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${theme.canvas.border} ${theme.canvas.bg} text-[9px] font-bold ${theme.text.secondary} uppercase tracking-wide truncate max-w-[90px] hover:border-zinc-600 transition-colors`}
                    >
                        <div className={clsx("w-1.5 h-1.5 rounded-full bg-gradient-to-r shrink-0", task.project_color || "from-zinc-500 to-zinc-400")} />
                        {task.project_name || task.project_code}
                    </Link>
                )}
            </div>

            {/* Title */}
            <h4 className={clsx(
                "text-sm font-semibold leading-snug mb-2",
                task.status === 'done' ? `line-through ${theme.text.secondary}` : theme.text.primary
            )}>
                {task.title}
            </h4>

            {/* Footer: Due Date + Assignee */}
            <div className="flex items-center justify-between">
                <div className={clsx(
                    "text-[11px] flex items-center gap-1",
                    isOverdue ? "text-red-400 font-bold" : theme.text.secondary
                )}>
                    {task.due_date ? (
                        <>
                            <Icons.Calendar className="w-3 h-3" />
                            {isOverdue ? (
                                <span>{daysOverdue}d overdue</span>
                            ) : (
                                <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            )}
                        </>
                    ) : (
                        <span className={theme.text.secondary}>No date</span>
                    )}
                </div>

                {/* Assignee inline dropdown */}
                <InlineDropdown
                    value={task.assigned_to || ''}
                    options={assigneeOpts}
                    onChange={(val) => handleInlineUpdate('assigned_to', val || null)}
                    alignRight
                    trigger={
                        <div className={`w-6 h-6 rounded-full ${theme.canvas.bg} border ${theme.canvas.border} flex items-center justify-center text-[10px] font-bold hover:border-zinc-600 transition-colors`}
                            title={assigneeName || 'Unassigned'}
                        >
                            {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default TaskKanbanCard;
