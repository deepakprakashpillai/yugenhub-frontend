import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import api from '../../api/axios';
import clsx from 'clsx';
import Select from '../ui/Select';
import { useAuth } from '../../context/AuthContext';

/**
 * TaskModal - For general project tasks (non-deliverable).
 * Simplified form without Quantity or Category toggles.
 * JIRA-style inline editing.
 */
const TaskModal = ({ isOpen, onClose, onSave, task = null, users = [], projectId = null, loading = false }) => {
    // Current User Context (for fallback assignee info)
    const { user: currentUser } = useAuth();

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

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Internal Users State (Bypass parent prop if needed)
    const [fetchedUsers, setFetchedUsers] = useState([]);

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
    }, [isOpen, task]);

    const fetchHistory = async () => {
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
    };

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
            category: 'general', // Auto-set for tasks
            type: 'project',
            project_id: projectId,
        };

        onSave(payload);
    };


    // --- OPTIONS CONFIG ---
    const statusOptions = [
        { value: 'todo', label: 'To Do', icon: Icons.Circle, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
        { value: 'in_progress', label: 'In Progress', icon: Icons.Loader, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { value: 'review', label: 'Review', icon: Icons.Eye, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
        { value: 'blocked', label: 'Blocked', icon: Icons.AlertCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
        { value: 'done', label: 'Done', icon: Icons.CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low', icon: Icons.ArrowDown, color: 'text-blue-400' },
        { value: 'medium', label: 'Medium', icon: Icons.Minus, color: 'text-yellow-400' },
        { value: 'high', label: 'High', icon: Icons.ArrowUp, color: 'text-orange-400' },
        { value: 'urgent', label: 'Urgent', icon: Icons.Zap, color: 'text-red-500 font-bold' },
    ];

    // Priority: Fetched Users > Props Users
    // Make sure we have a list to display. If props are empty (bug), use fetched.
    const finalUsers = fetchedUsers.length > 0 ? fetchedUsers : users;

    // Build Assignee Options including fallback for current user if missing from list
    const assigneeOptions = [
        { value: '', label: 'Unassigned', icon: Icons.User, color: 'text-zinc-500' },
        ...finalUsers.map(u => ({ value: u.id, label: u.name, icon: Icons.User, color: 'text-zinc-300' }))
    ];

    // Fallback: If current user is assigned but not in list (e.g. list failed to load), add them manually
    // This fixes the "Unassigned" display bug if users list is empty but task is assigned to me.
    if (currentUser && formData.assigned_to === currentUser.id && !finalUsers.find(u => u.id === currentUser.id)) {
        assigneeOptions.push({ value: currentUser.id, label: currentUser.name || 'Me', icon: Icons.User, color: 'text-zinc-300' });
    }


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isNewTask ? 'New Task' : 'Task Details'}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header Section: Title & Status */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        {/* Status (Top Right or inline for mobile) */}
                        <div className="flex justify-between items-start">
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Task Title"
                                className="text-2xl font-black bg-transparent border-none p-0 text-white placeholder:text-zinc-600 focus:ring-0 w-full"
                                autoFocus={isNewTask}
                            />
                        </div>
                    </div>

                    {/* Metadata Bar (JIRA style) */}
                    <div className="flex flex-wrap gap-3 items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                        <Select
                            value={formData.status}
                            onChange={(val) => handleSelectChange('status', val)}
                            options={statusOptions}
                            placeholder="Status"
                            className="w-36"
                        />
                        <Select
                            value={formData.priority}
                            onChange={(val) => handleSelectChange('priority', val)}
                            options={priorityOptions}
                            placeholder="Priority"
                            className="w-32"
                        />
                        <Select
                            value={formData.assigned_to}
                            onChange={(val) => handleSelectChange('assigned_to', val)}
                            options={assigneeOptions}
                            placeholder="Assignee"
                            className="w-40"
                        />
                        {/* Due Date (Native Picker styled minimally) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Icons.Calendar className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                            </div>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className="pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-purple-500 hover:bg-zinc-800/50 hover:border-zinc-700 transition-colors w-36 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-2 ml-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Add a more detailed description..."
                        className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:bg-zinc-900 focus:border-purple-500 transition-all resize-none text-sm leading-relaxed custom-scrollbar placeholder:text-zinc-600 hover:bg-zinc-900/50"
                    />
                </div>

                {/* Comment Section (Conditional for Blocked or just optional note) */}
                <div className={clsx("p-4 rounded-lg transition-colors border", formData.status === 'blocked' ? "bg-red-900/10 border-red-500/30" : "bg-transparent border-transparent")}>
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
                            "w-full bg-transparent border-0 p-0 text-white focus:ring-0 placeholder:text-zinc-600 resize-none text-sm",
                            formData.status !== 'blocked' && "border-b border-zinc-800 focus:border-zinc-600 py-2"
                        )}
                    />
                </div>

                {/* History Log (Only show if existing task) */}
                {!isNewTask && (
                    <div className="border-t border-zinc-800 pt-6 mt-6">
                        <h4 className="text-xs uppercase text-zinc-500 font-bold mb-4 flex items-center gap-2">
                            <Icons.History className="w-3 h-3" /> Recent Activity
                        </h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {historyLoading ? (
                                <div className="text-zinc-600 text-xs italic">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="text-zinc-600 text-xs italic">No history available.</div>
                            ) : (
                                history.map((entry, i) => (
                                    <div key={i} className="text-xs text-zinc-400 flex flex-col gap-1">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-zinc-300">
                                                {entry.field === 'creation' ? 'Task Created' : `Changed ${entry.field}`}
                                            </span>
                                            <span className="text-[10px] text-zinc-600">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        {entry.field !== 'creation' && (
                                            <div className="flex gap-2 items-center text-zinc-500">
                                                <span className="line-through opacity-50">{entry.old_value || 'None'}</span>
                                                <Icons.ChevronRight className="w-3 h-3" />
                                                <span className="text-zinc-300">{entry.new_value}</span>
                                            </div>
                                        )}
                                        {entry.comment && (
                                            <div className="bg-zinc-800/50 p-2 rounded border-l-2 border-zinc-700 mt-1 italic text-zinc-400">
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
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm"
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
