import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import api from '../../api/axios';
import clsx from 'clsx';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import { useAuth } from '../../context/AuthContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * TaskModal - For general project tasks (non-deliverable).
 * Simplified form without Quantity or Category toggles.
 * JIRA-style inline editing.
 */
const TaskModal = ({ isOpen, onClose, onSave, task = null, users = [], projectId = null, eventId = null, loading = false }) => {
    // Current User Context (for fallback assignee info)
    const { user: currentUser } = useAuth();
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const isDeliverable = !!eventId || task?.category === 'deliverable' || !!task?.event_id;

    // Determine initial "isNew" state for title display logic
    const isNewTask = !task;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        comment: ''
    });

    // Project Selection State
    const [selectedVertical, setSelectedVertical] = useState('general');
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || ''); // Prop or local state

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Internal Users State (Bypass parent prop if needed)
    const [fetchedUsers, setFetchedUsers] = useState([]);

    const fetchHistory = useCallback(async () => {
        if (!task) return;
        setHistoryLoading(true);
        try {
            const res = await api.get(`/tasks/${task.id}/history`);
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [task]);

    // Initialize formData when modal opens or task changes
    useEffect(() => {
        if (isOpen && task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                assigned_to: task.assigned_to || '',
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                comment: ''
            });

            // Try to deduce vertical/project from task if available
            if (task.project_id) {
                setSelectedProjectId(task.project_id);
                // If the task has a project_vertical (added by backend lookup or provided in task object)
                if (task.project_vertical) {
                    setSelectedVertical(task.project_vertical);
                } else if (task.category === 'deliverable') {
                    // Safety: deliverables always have a project, but we might not have the vertical string yet
                    // We'll let the user change it if needed, but we don't reset to 'general'
                } else if (task.type === 'project') {
                    // For project-linked general tasks, we should try to stay in that project context
                }
            } else {
                setSelectedProjectId('');
                setSelectedVertical('general');
            }

            fetchHistory();
        } else if (isOpen) {
            setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                assigned_to: '',
                due_date: '',
                comment: ''
            });
            setHistory([]);
            setSelectedVertical('general');
            setSelectedProjectId('');
        }

        // Robustness: Fetch users directly when modal opens to ensure list is populated
        if (isOpen) {
            api.get('/users')
                .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setFetchedUsers(res.data);
                    }
                })
                .catch(err => console.error("Modal user fetch failed", err));
        }
    }, [isOpen, task, fetchHistory]);

    // Fetch Projects when Vertical Changes
    useEffect(() => {
        if (selectedVertical === 'general' || !isOpen) {
            setProjects([]);
            return;
        }

        const fetchProjects = async () => {
            setProjectsLoading(true);
            try {
                // Fetch ongoing projects for this vertical
                const res = await api.get('/projects', {
                    params: {
                        vertical: selectedVertical,
                        status: 'ongoing', // Only active projects
                        limit: 100 // Reasonable limit for dropdown
                    }
                });
                setProjects(res.data.data || []);
            } catch (err) {
                console.error("Failed to load projects", err);
            } finally {
                setProjectsLoading(false);
            }
        };

        fetchProjects();
    }, [selectedVertical, isOpen]);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return alert('Title is required');

        // Blocked rule
        if (formData.status === 'blocked' && (!formData.comment || !formData.comment.trim())) {
            return alert('A comment is required when blocking a task.');
        }

        const payload = {
            ...formData,
            due_date: formData.due_date || null,
            assigned_to: formData.assigned_to || null,
            // PRESERVE category if it was a deliverable
            category: isDeliverable ? 'deliverable' : 'general',
            // PRESERVE type logic
            type: (isDeliverable || selectedProjectId) ? 'project' : 'internal',
            project_id: selectedProjectId || projectId || task?.project_id,
            event_id: eventId || task?.event_id
        };

        onSave(payload);
    };



    // --- OPTIONS CONFIG ---
    const statusOptions = [
        { value: 'todo', label: 'To Do', icon: Icons.Circle, color: `text-zinc-500 bg-zinc-500/10 border-zinc-500/20` },
        { value: 'in_progress', label: 'In Progress', icon: Icons.Loader, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { value: 'review', label: 'Review', icon: Icons.Eye, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
        { value: 'blocked', label: 'Blocked', icon: Icons.AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
        { value: 'done', label: 'Done', icon: Icons.CheckCircle, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low', icon: Icons.ArrowDown, color: 'text-blue-500' },
        { value: 'medium', label: 'Medium', icon: Icons.Minus, color: 'text-yellow-500' },
        { value: 'high', label: 'High', icon: Icons.ArrowUp, color: 'text-orange-500' },
        { value: 'urgent', label: 'Urgent', icon: Icons.Zap, color: 'text-red-600 font-bold' },
    ];

    // Priority: Fetched Users > Props Users
    // Make sure we have a list to display. If props are empty (bug), use fetched.
    const finalUsers = fetchedUsers.length > 0 ? fetchedUsers : users;

    // Build Assignee Options including fallback for current user if missing from list
    const assigneeOptions = [
        { value: '', label: 'Unassigned', icon: Icons.User, color: theme.text.secondary },
        ...finalUsers.map(u => ({ value: u.id, label: u.name, icon: Icons.User, color: theme.text.primary }))
    ];

    // Fallback: If current user is assigned but not in list (e.g. list failed to load), add them manually
    // This fixes the "Unassigned" display bug if users list is empty but task is assigned to me.
    if (currentUser && formData.assigned_to === currentUser.id && !finalUsers.find(u => u.id === currentUser.id)) {
        assigneeOptions.push({ value: currentUser.id, label: currentUser.name || 'Me', icon: Icons.User, color: theme.text.primary });
    }


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isNewTask ? (isDeliverable ? 'New Deliverable' : 'New Task') : (isDeliverable ? 'Deliverable Details' : 'Task Details')}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header Section: Title & Status */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        {/* Status (Top Right or inline for mobile) */}
                        <div className="flex justify-between items-start">
                            {isDeliverable ? (
                                <select
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`text-2xl font-black bg-transparent border-none p-0 ${theme.text.primary} focus:ring-0 w-full`}
                                    autoFocus={isNewTask}
                                >
                                    <option value="">Select Deliverable Type</option>
                                    {(config?.deliverableTypes || []).map(dt => (
                                        <option key={dt} value={dt}>{dt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Task Title"
                                    className={`text-2xl font-black bg-transparent border-none p-0 ${theme.text.primary} placeholder:${theme.text.secondary} focus:ring-0 w-full`}
                                    autoFocus={isNewTask}
                                />
                            )}
                        </div>
                    </div>

                    {/* Metadata Bar (JIRA style) */}
                    <div className={`flex flex-wrap gap-3 items-center ${theme.canvas.bg} p-3 rounded-lg border ${theme.canvas.border}`}>
                        <Select
                            value={formData.status}
                            onChange={(val) => handleSelectChange('status', val)}
                            options={statusOptions}
                            placeholder="Status"
                            className="w-full md:w-36"
                        />
                        <Select
                            value={formData.priority}
                            onChange={(val) => handleSelectChange('priority', val)}
                            options={priorityOptions}
                            placeholder="Priority"
                            className="w-full md:w-32"
                        />
                        <Select
                            value={formData.assigned_to}
                            onChange={(val) => handleSelectChange('assigned_to', val)}
                            options={assigneeOptions}
                            placeholder="Assignee"
                            className="w-full md:w-40"
                        />

                        {/* Vertical Selection */}
                        <Select
                            value={selectedVertical}
                            onChange={(val) => {
                                setSelectedVertical(val);
                                setSelectedProjectId(''); // Reset project on vertical change
                            }}
                            options={[
                                { value: 'general', label: 'General Task', icon: Icons.Layers, color: theme.text.secondary },
                                ...(config?.verticals?.map(v => ({
                                    value: v.id,
                                    label: v.label,
                                    icon: Icons.Briefcase, // Or dynamic icon if available
                                    color: v.color ? `text-[${v.color}]` : theme.text.secondary // Note: dynamic classes might need style prop or safelist
                                })) || [])
                            ]}
                            placeholder="Type"
                            className="w-full md:w-40"
                        />

                        {/* Project Selection (Conditional) */}
                        {selectedVertical !== 'general' && (
                            <Select
                                value={selectedProjectId}
                                onChange={setSelectedProjectId}
                                options={projects.map(p => ({
                                    value: p._id,
                                    label: p.title || p.code,
                                    icon: Icons.Briefcase,
                                    color: theme.text.primary
                                }))}
                                placeholder={projectsLoading ? "Loading..." : "Select Project"}
                                className="w-full md:w-48"
                                disabled={projectsLoading}
                            />
                        )}

                        {/* Due Date (Calendar Picker) */}
                        <DatePicker
                            value={formData.due_date}
                            onChange={(val) => handleSelectChange('due_date', val)}
                            placeholder="Due Date"
                            className="w-full md:w-44"
                            icon={Icons.Calendar}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className={`block text-xs uppercase ${theme.text.secondary} font-bold mb-2 ml-1`}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Add a more detailed description..."
                        className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-3 ${theme.text.primary} focus:outline-none focus:${theme.canvas.card} focus:border-purple-500 transition-all resize-none text-sm leading-relaxed placeholder:${theme.text.secondary} hover:${theme.canvas.hover}`}
                    />
                </div>

                {/* Comment Section (Conditional for Blocked or just optional note) */}
                <div className={clsx("p-4 rounded-lg transition-colors border", formData.status === 'blocked' ? "bg-red-500/10 border-red-500/30" : "bg-transparent border-transparent")}>
                    {formData.status === 'blocked' && (
                        <label className="block text-xs uppercase font-bold mb-2 text-red-400">
                            Blocking Reason (Required) *
                        </label>
                    )}
                    <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        rows={formData.status === 'blocked' ? 2 : 1}
                        placeholder={formData.status === 'blocked' ? "Why is this task blocked?" : "Add a comment..."}
                        className={clsx(
                            `w-full bg-transparent border-0 p-0 ${theme.text.primary} focus:ring-0 placeholder:${theme.text.secondary} resize-none text-sm`,
                            formData.status !== 'blocked' && `border-b ${theme.canvas.border} focus:${theme.canvas.border} py-2`
                        )}
                    />
                </div>

                {/* History Log (Only show if existing task) */}
                {!isNewTask && (
                    <div className={`border-t ${theme.canvas.border} pt-6 mt-6`}>
                        <h4 className={`text-xs uppercase ${theme.text.secondary} font-bold mb-4 flex items-center gap-2`}>
                            <Icons.History className="w-3 h-3" /> Recent Activity
                        </h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                            {historyLoading ? (
                                <div className={`${theme.text.secondary} text-xs italic`}>Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className={`${theme.text.secondary} text-xs italic`}>No history available.</div>
                            ) : (
                                history.map((entry, i) => (
                                    <div key={i} className={`text-xs ${theme.text.secondary} flex flex-col gap-1`}>
                                        <div className="flex justify-between">
                                            <span className={`font-bold ${theme.text.primary}`}>
                                                {entry.field === 'creation' ? 'Task Created' : `Changed ${entry.field}`}
                                            </span>
                                            <span className={`text-[10px] ${theme.text.secondary}`}>
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        {entry.field !== 'creation' && (
                                            <div className={`flex gap-2 items-center ${theme.text.secondary}`}>
                                                <span className="line-through opacity-50">{entry.old_value || 'None'}</span>
                                                <Icons.ChevronRight className="w-3 h-3" />
                                                <span className={theme.text.primary}>{entry.new_value}</span>
                                            </div>
                                        )}
                                        {entry.comment && (
                                            <div className={`bg-zinc-500/10 p-2 rounded border-l-2 ${theme.canvas.border} mt-1 italic ${theme.text.secondary}`}>
                                                "{entry.comment}"
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Actions (Sticky Footer? Or just bottom) */}
                <div
                    className={`flex justify-end gap-3 pt-4 border-t ${theme.canvas.border}`}
                    style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)'
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors font-medium text-sm`}
                    >
                        Close
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={clsx(
                            "px-6 py-2 rounded-lg text-white transition-colors font-bold text-sm flex items-center gap-2 shadow-lg",
                            formData.status === 'blocked' ? "bg-red-600 hover:bg-red-700 shadow-red-900/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-900/20"
                        )}
                    >
                        {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskModal;
