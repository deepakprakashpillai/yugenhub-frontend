import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import api from '../api/axios';
import TaskKanbanColumn from './TaskKanbanColumn';
import TaskSummaryBar from './TaskSummaryBar';
import TaskKanbanCard from './TaskKanbanCard';
import SkeletonCard from './SkeletonCard';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const STATUSES = ['todo', 'in_progress', 'review', 'blocked', 'done'];

const TaskKanbanBoard = ({ fetchParams = {}, onEditTask, refreshTrigger = 0, users = [] }) => {
    const { theme } = useTheme();
    const [groups, setGroups] = useState({});
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Responsive
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // Sensors for drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const fetchGroupedTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...fetchParams };
            Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
            // Remove flat-list specific params
            delete params.sort_by;
            delete params.status;
            delete params.completed;

            const res = await api.get('/tasks/grouped', { params });
            setGroups(res.data.groups || {});
            setSummary(res.data.summary || {});
        } catch (err) {
            console.error('Failed to load grouped tasks', err);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(fetchParams)]);

    useEffect(() => {
        fetchGroupedTasks();
    }, [fetchGroupedTasks, refreshTrigger]);

    // Drag handlers
    const handleDragStart = (event) => {
        const { active } = event;
        // Find the task across all groups
        for (const status of STATUSES) {
            const task = groups[status]?.tasks?.find(t => t.id === active.id);
            if (task) {
                setActiveTask(task);
                break;
            }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        // Determine target status (the droppable container ID is the status)
        const targetStatus = over.id;
        // If dropped on a card, find which column that card belongs to
        let newStatus = STATUSES.includes(targetStatus) ? targetStatus : null;

        if (!newStatus) {
            // Dropped on a card — find which group this card belongs to
            for (const s of STATUSES) {
                if (groups[s]?.tasks?.some(t => t.id === over.id)) {
                    newStatus = s;
                    break;
                }
            }
        }

        if (!newStatus) return;

        // Find the dragged task's current status
        let sourceStatus = null;
        let draggedTask = null;
        for (const s of STATUSES) {
            const task = groups[s]?.tasks?.find(t => t.id === active.id);
            if (task) {
                sourceStatus = s;
                draggedTask = task;
                break;
            }
        }

        if (!draggedTask || sourceStatus === newStatus) return;

        // Blocked requires comment — open modal instead
        if (newStatus === 'blocked') {
            onEditTask?.(draggedTask);
            toast.info('Please add a blocking reason in the modal');
            return;
        }

        // Optimistic update
        const newGroups = { ...groups };
        // Remove from source
        newGroups[sourceStatus] = {
            ...newGroups[sourceStatus],
            tasks: newGroups[sourceStatus].tasks.filter(t => t.id !== active.id),
            count: newGroups[sourceStatus].count - 1
        };
        // Add to target
        const updatedTask = { ...draggedTask, status: newStatus };
        newGroups[newStatus] = {
            ...newGroups[newStatus],
            tasks: [updatedTask, ...(newGroups[newStatus]?.tasks || [])],
            count: (newGroups[newStatus]?.count || 0) + 1
        };
        setGroups(newGroups);

        // API call
        try {
            await api.patch(`/tasks/${active.id}`, { status: newStatus });
            toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
        } catch (err) {
            console.error('Drag status update failed', err);
            toast.error('Failed to update status');
            fetchGroupedTasks(); // Revert
        }
    };

    const handleDragCancel = () => {
        setActiveTask(null);
    };

    if (loading) {
        return (
            <div>
                <div className="flex gap-2 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`h-10 rounded-xl ${theme.canvas.card} ${theme.canvas.border} border flex-1 animate-pulse`} />
                    ))}
                </div>
                <div className="flex gap-4">
                    {STATUSES.map(s => (
                        <div key={s} className={`flex-1 rounded-xl border ${theme.canvas.border} p-3 min-w-[200px]`}>
                            <div className={`h-8 rounded-lg ${theme.canvas.card} animate-pulse mb-3`} />
                            {Array.from({ length: 2 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <TaskSummaryBar summary={summary} groups={groups} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                {isMobile ? (
                    // Mobile: Stacked accordions
                    <div className="space-y-3">
                        {STATUSES.map(status => (
                            <TaskKanbanColumn
                                key={status}
                                status={status}
                                tasks={groups[status]?.tasks || []}
                                overdueCount={groups[status]?.overdue_count || 0}
                                onTaskClick={onEditTask}
                                onTaskUpdate={fetchGroupedTasks}
                                users={users}
                                isMobile
                            />
                        ))}
                    </div>
                ) : (
                    // Desktop: Horizontal columns
                    <div className="flex gap-6 overflow-x-auto pb-6 px-1">
                        {STATUSES.map(status => (
                            <TaskKanbanColumn
                                key={status}
                                status={status}
                                tasks={groups[status]?.tasks || []}
                                overdueCount={groups[status]?.overdue_count || 0}
                                onTaskClick={onEditTask}
                                onTaskUpdate={fetchGroupedTasks}
                                users={users}
                            />
                        ))}
                    </div>
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTask ? (
                        <div className="opacity-90 rotate-2 scale-105">
                            <TaskKanbanCard
                                task={activeTask}
                                users={users}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default TaskKanbanBoard;
