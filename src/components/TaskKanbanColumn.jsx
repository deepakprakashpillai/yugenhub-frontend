import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Icons } from './Icons';
import TaskKanbanCard from './TaskKanbanCard';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

const STATUS_META = {
    todo: { label: 'To Do', icon: Icons.Circle, accent: 'border-t-zinc-500', dotColor: 'bg-zinc-500' },
    in_progress: { label: 'In Progress', icon: Icons.Timer, accent: 'border-t-blue-500', dotColor: 'bg-blue-500' },
    review: { label: 'Review', icon: Icons.Eye, accent: 'border-t-purple-500', dotColor: 'bg-purple-500' },
    blocked: { label: 'Blocked', icon: Icons.Ban, accent: 'border-t-red-500', dotColor: 'bg-red-500' },
    done: { label: 'Done', icon: Icons.CheckCircle, accent: 'border-t-emerald-500', dotColor: 'bg-emerald-500' },
};

const TaskKanbanColumn = ({ status, tasks = [], overdueCount = 0, onTaskClick, onTaskUpdate, users = [], isMobile = false }) => {
    const { theme } = useTheme();
    const meta = STATUS_META[status] || STATUS_META.todo;
    const Icon = meta.icon;
    const [collapsed, setCollapsed] = useState(false);

    const { setNodeRef, isOver } = useDroppable({ id: status });

    const taskIds = tasks.map(t => t.id);

    if (isMobile) {
        return (
            <div className={clsx("rounded-xl border overflow-hidden", theme.canvas.border)}>
                {/* Accordion Header */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={clsx(
                        "w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-t-2",
                        meta.accent,
                        theme.canvas.card
                    )}
                >
                    <div className="flex items-center gap-2">
                        <div className={clsx("w-2 h-2 rounded-full", meta.dotColor)} />
                        <span className={`text-sm font-bold ${theme.text.primary}`}>{meta.label}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${theme.canvas.bg} ${theme.text.secondary} font-bold`}>
                            {tasks.length}
                        </span>
                        {overdueCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">
                                {overdueCount} overdue
                            </span>
                        )}
                    </div>
                    <Icons.ChevronDown className={clsx(
                        "w-4 h-4 transition-transform",
                        theme.text.secondary,
                        collapsed && "-rotate-90"
                    )} />
                </button>

                {/* Accordion Body */}
                {!collapsed && (
                    <div ref={setNodeRef} className={clsx("p-2 sm:p-3 space-y-2", theme.canvas.bg, isOver && "bg-purple-500/5")}>
                        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                            {tasks.length === 0 ? (
                                <div className={`text-center py-4 text-xs ${theme.text.secondary} italic`}>
                                    No tasks
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <TaskKanbanCard
                                        key={task.id}
                                        task={task}
                                        onClick={onTaskClick}
                                        onTaskUpdate={onTaskUpdate}
                                        users={users}
                                    />
                                ))
                            )}
                        </SortableContext>
                    </div>
                )}
            </div>
        );
    }

    // Desktop: Vertical column
    return (
        <div className={clsx(
            "flex flex-col rounded-xl border min-w-[360px] w-[360px] xl:w-[400px] transition-all",
            theme.canvas.border,
            isOver && "border-purple-500/40 bg-purple-500/5"
        )}>
            {/* Column Header */}
            <div className={clsx("flex items-center justify-between px-3 py-3", theme.canvas.card, "rounded-t-xl")}>
                <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", meta.dotColor)} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.text.primary}`}>{meta.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${theme.canvas.bg} ${theme.text.secondary} font-bold tabular-nums`}>
                        {tasks.length}
                    </span>
                </div>
                {overdueCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold animate-pulse">
                        🔴 {overdueCount}
                    </span>
                )}
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className={clsx(
                    "flex-1 overflow-y-auto p-2 space-y-4 min-h-[120px] max-h-[calc(100vh-340px)]",
                    ""
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className={`text-center py-8 text-xs ${theme.text.secondary} italic`}>
                            Drop tasks here
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskKanbanCard
                                key={task.id}
                                task={task}
                                onClick={onTaskClick}
                                onTaskUpdate={onTaskUpdate}
                                users={users}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default TaskKanbanColumn;
