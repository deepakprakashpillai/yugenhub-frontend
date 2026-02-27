import { useEffect, useState, useCallback, useRef } from 'react';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Skeleton } from '../components/ui/Skeleton';
import { Icons } from '../components/Icons';
import clsx from 'clsx';
import DatePicker from '../components/ui/DatePicker';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from 'lucide-react';

// Modals
import { ConfirmDeleteModal, TeamMemberModal, MetadataModal, EventSlideOver, TaskModal, TemplateModal } from '../components/modals';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';

// Vertical-specific templates
import { WeddingTemplate, KidsTemplate, EventsTemplate, GenericTemplate } from '../components/templates';
import ProjectFinance from '../components/finance/ProjectFinance';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const { config } = useAgencyConfig();
    const statusConfig = config?.statusOptions?.find(s => s.id === status);
    const color = statusConfig?.color || '#71717a';
    const label = statusConfig?.label || status;

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize border"
            style={{
                borderColor: `${color}33`,
                color: color,
                backgroundColor: `${color}15`,
            }}
        >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
        </span>
    );
};

// Progress Bar Component
const ProgressBar = ({ total, completed, className }) => {
    const { theme } = useTheme();
    if (total === 0) return null;
    const percent = Math.round((completed / total) * 100);
    return (
        <div className={clsx("w-full max-w-xs", className)}>
            <div className={`flex justify-between text-xs ${theme.text.secondary} mb-1`}>
                <span>Progress</span>
                <span>{percent}% ({completed}/{total})</span>
            </div>
            <div className={`h-1.5 ${theme.canvas.border} rounded-full overflow-hidden bg-opacity-30 bg-zinc-700 relative`}>
                <div className={`w-full h-full absolute top-0 left-0 opacity-20 ${theme.text.secondary} bg-current`}></div>
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 relative z-10"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// Template Switcher Component — Config-Driven
const VerticalTemplate = ({ project }) => {
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const verticalId = project?.vertical?.toLowerCase();

    // Find config for this vertical
    const configVertical = config?.verticals?.find(v => v.id === verticalId);
    const fields = configVertical?.fields || [];
    const metadata = project?.metadata || {};

    // If no fields configured, check for any metadata to display
    const hasAnyData = fields.some(f => metadata[f.name]) || Object.keys(metadata).length > 0;

    if (!hasAnyData && fields.length === 0) {
        return (
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-6`}>
                <p className={`${theme.text.secondary} italic`}>No additional details configured for this vertical.</p>
            </div>
        );
    }

    return (
        <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-4 sm:p-6`}>
            <h3 className={`text-base sm:text-lg font-bold ${theme.text.primary} mb-4 sm:mb-6 flex items-center gap-2`}>
                <Icons.Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                {configVertical?.label || 'Project'} Details
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {fields.map(field => {
                    const value = metadata[field.name];
                    if (!value && value !== 0) return null;

                    return (
                        <div key={field.name}>
                            <h4 className={`text-[10px] sm:text-xs ${theme.text.secondary} uppercase tracking-wider mb-0.5 sm:mb-1`}>
                                {field.label}
                            </h4>
                            {field.type === 'date' ? (
                                <p className={`${theme.text.primary} font-medium text-sm sm:text-base`}>
                                    {new Date(value).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                </p>
                            ) : field.type === 'select' ? (
                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-purple-500/10 text-purple-400 capitalize`}>
                                    {value}
                                </span>
                            ) : field.type === 'tel' ? (
                                <p className={`${theme.text.primary} text-xs sm:text-sm font-mono break-words`}>{value}</p>
                            ) : (
                                <p className={`${theme.text.primary} font-medium text-sm sm:text-base truncate`}>{value}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Task Item Component (for Deliverables display)
const TaskItem = ({ task, onEdit, onDelete, onUpdate, users = [] }) => {
    const { theme } = useTheme();
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);
    const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const priorityRef = useRef(null);
    const assigneeRef = useRef(null);
    const dateRef = useRef(null);
    const actionRef = useRef(null);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (priorityRef.current && !priorityRef.current.contains(event.target)) setShowPriorityMenu(false);
            if (assigneeRef.current && !assigneeRef.current.contains(event.target)) setShowAssigneeMenu(false);
            if (dateRef.current && !dateRef.current.contains(event.target)) setIsEditingDate(false);
            if (actionRef.current && !actionRef.current.contains(event.target)) setShowActionMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const priorityIcons = {
        low: <Icons.ArrowDown className="w-3 h-3 text-blue-400" />,
        medium: <Icons.Minus className="w-3 h-3 text-yellow-400" />,
        high: <Icons.ArrowUp className="w-3 h-3 text-orange-400" />,
        urgent: <Icons.AlertTriangle className="w-3 h-3 text-red-500" />,
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Date';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short'
        });
    };

    const assignedUser = users.find(u => u.id === task.assigned_to);
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePriorityChange = (priority) => {
        onUpdate(task.id, { priority });
        setShowPriorityMenu(false);
    };

    const handleAssigneeChange = (userId) => {
        onUpdate(task.id, { assigned_to: userId });
        setShowAssigneeMenu(false);
    };

    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 ${theme.canvas.hover || "bg-zinc-800/50"} rounded-xl border ${theme.canvas.border} group relative`}>
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${theme.canvas.card} flex items-center justify-center flex-shrink-0`}>
                    <Icons.Package className={`w-4 h-4 ${theme.text.secondary}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className={`${theme.text.primary} font-medium truncate`}>{task.title}</h5>
                    <div className={`flex items-center gap-3 text-xs ${theme.text.secondary} mt-1.5 flex-wrap`}>

                        {/* Inline Priority Marker */}
                        <div className="relative" ref={priorityRef}>
                            <button
                                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                                title={`Priority: ${task.priority}`}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${theme.canvas.card} border ${theme.canvas.border} hover:border-zinc-500 transition-all`}
                            >
                                {priorityIcons[task.priority] || <Icons.Minus className="w-3 h-3" />}
                                <span className="capitalize">{task.priority}</span>
                            </button>

                            <AnimatePresence>
                                {showPriorityMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute bottom-full left-0 mb-2 w-32 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden backdrop-blur-xl bg-opacity-95`}
                                    >
                                        {Object.keys(priorityIcons).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => handlePriorityChange(p)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:${theme.canvas.hover} transition-colors capitalize`}
                                            >
                                                {priorityIcons[p]}
                                                {p}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Inline Assignee Marker */}
                        <div className="relative" ref={assigneeRef}>
                            <button
                                onClick={() => {
                                    setShowAssigneeMenu(!showAssigneeMenu);
                                    setSearchQuery('');
                                }}
                                title={assignedUser ? `Assigned to: ${assignedUser.name}` : "Unassigned"}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${theme.canvas.card} border ${theme.canvas.border} hover:border-zinc-500 transition-all`}
                            >
                                {assignedUser ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                                            {assignedUser.name.charAt(0)}
                                        </div>
                                        <span className="max-w-[100px] truncate">{assignedUser.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Icons.UserPlus className="w-3 h-3" />
                                        <span>Assign</span>
                                    </>
                                )}
                            </button>

                            <AnimatePresence>
                                {showAssigneeMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute bottom-full left-0 mb-2 w-64 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden backdrop-blur-xl bg-opacity-95`}
                                    >
                                        <div className={`p-2 border-b ${theme.canvas.border}`}>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search members..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={`w-full bg-transparent px-2 py-1 text-sm border-none focus:outline-none ${theme.text.primary}`}
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            <button
                                                onClick={() => handleAssigneeChange(null)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:${theme.canvas.hover} transition-colors text-zinc-500`}
                                            >
                                                <Icons.UserMinus className="w-3 h-3" />
                                                Unassign
                                            </button>
                                            {filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleAssigneeChange(user.id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:${theme.canvas.hover} transition-colors`}
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium ${theme.text.primary} truncate`}>{user.name}</p>
                                                        <p className={`text-[10px] ${theme.text.secondary} truncate`}>{user.role}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Inline Due Date Marker */}
                        <div className="relative" ref={dateRef}>
                            <button
                                onClick={() => setIsEditingDate(!isEditingDate)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all",
                                    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                                        ? "bg-red-500/10 border-red-500/30 text-red-400 font-medium"
                                        : `${theme.canvas.card} ${theme.canvas.border} hover:border-zinc-500`
                                )}
                            >
                                <Icons.Calendar className="w-3 h-3" />
                                {formatDate(task.due_date)}
                            </button>

                            <AnimatePresence>
                                {isEditingDate && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute bottom-full left-0 mb-2 z-[60]"
                                    >
                                        <DatePicker
                                            value={task.due_date ? task.due_date.split('T')[0] : ''}
                                            onChange={(val) => {
                                                onUpdate(task.id, { due_date: val });
                                                setIsEditingDate(false);
                                            }}
                                            placeholder="Select date"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {task.quantity && (
                            <span className={`px-2 py-0.5 rounded-md ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary}`}>
                                Qty: {task.quantity}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <StatusBadge status={task.status} />
                <div className="relative" ref={actionRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowActionMenu(!showActionMenu); }}
                        className={`p-1.5 rounded-lg sm:hover:${theme.canvas.card} ${theme.text.secondary} sm:hover:${theme.text.primary} transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 ${showActionMenu ? 'opacity-100' : ''}`}
                    >
                        <Icons.More className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                        {showActionMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute right-0 top-full mt-2 w-36 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden`}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowActionMenu(false); onEdit(); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                                >
                                    <Icons.Edit className="w-4 h-4" /> Edit Task
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowActionMenu(false); onDelete(); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors border-t ${theme.canvas.border}`}
                                >
                                    <Icons.Trash className="w-4 h-4" /> Delete Task
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Assignment Item Component with Edit/Delete
const AssignmentItem = ({ assignment, onEdit, onDelete }) => {
    const { theme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const name = assignment.associate_name || assignment.name || 'Unknown';

    return (
        <div className={`flex items-center justify-between gap-3 p-3 ${theme.canvas.hover || "bg-zinc-800/50"} rounded-xl border ${theme.canvas.border} group`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                    {name.charAt(0)}
                </div>
                <div>
                    <p className={`${theme.text.primary} text-sm font-medium`}>{name}</p>
                    <p className={`${theme.text.secondary} text-xs`}>{assignment.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${theme.canvas.card} ${theme.text.secondary}`}>
                    {assignment.role}
                </span>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className={`p-1.5 rounded-lg sm:hover:${theme.canvas.card} ${theme.text.secondary} sm:hover:${theme.text.primary} transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 ${showMenu ? 'opacity-100' : ''}`}
                    >
                        <Icons.More className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute right-0 top-full mt-2 w-36 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden`}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                                >
                                    <Icons.Edit className="w-4 h-4" /> Edit Member
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors border-t ${theme.canvas.border}`}
                                >
                                    <Icons.Trash className="w-4 h-4" /> Remove Member
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Event Section Component (Collapsible) with Edit/Delete
const EventSection = ({
    event,
    index,
    isExpanded,
    onToggle,
    onEditEvent,
    onDeleteEvent,
    eventTasks = [], // Tasks linked to this event (Deliverables)
    onAddDeliverable, // Opens TaskModal with eventId
    onEditDeliverable, // Opens TaskModal with task
    onDeleteDeliverable,
    onUpdateTask, // NEW: Inline update handler
    onAddTeamMember,
    onEditTeamMember,
    onDeleteTeamMember,
    users // Added users prop
}) => {
    const { theme } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'TBD';
        return date.toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;

        // Check if time is midnight (00:00) - treat as no time specified
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (hours === 0 && minutes === 0) return null;

        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });
    };

    // Check if end date is different from start date
    const hasEndDate = event.end_date && event.end_date !== event.start_date;
    const startTime = formatTime(event.start_date);
    const endTime = formatTime(event.end_date);

    // Calculate Event Progress
    const eventCompleted = eventTasks.filter(t => ['done', 'completed'].includes(t.status)).length;
    const eventTotal = eventTasks.length;

    return (
        <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden`}>
            {/* Event Header (Clickable) */}
            <div className={`flex items-center justify-between p-5 hover:${theme.canvas.hover} transition-colors`}>
                <button onClick={onToggle} className="flex items-center gap-4 text-left flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-lg">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${theme.text.primary}`}>{event.type}</h3>
                        <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm flex-wrap ${theme.text.secondary} mt-1`}>
                            <span className="flex items-center gap-1.5 break-words">
                                <Icons.Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1 sm:line-clamp-none">
                                    {formatDate(event.start_date)}
                                    {hasEndDate && <> → {formatDate(event.end_date)}</>}
                                </span>
                            </span>
                            {(startTime || endTime) && (
                                <span className="flex items-center gap-1.5 shrink-0">
                                    <Icons.Clock className="w-3.5 h-3.5" />
                                    {startTime || '—'}
                                    {endTime && <> → {endTime}</>}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block min-w-[150px] mr-4">
                        <ProgressBar total={eventTotal} completed={eventCompleted} />
                    </div>
                    <div className="text-right text-sm hidden sm:block">
                        <span className={`${theme.text.secondary} mr-1`}>{event.assignments?.length || 0} Team</span>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className={`p-2 rounded-lg sm:hover:${theme.canvas.hover} ${theme.text.secondary} sm:hover:${theme.text.primary} transition-colors ${showMenu ? `sm:${theme.canvas.hover} sm:${theme.text.primary}` : ''}`}
                        >
                            <Icons.More className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`absolute right-0 top-full mt-2 w-36 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden`}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditEvent(); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                                    >
                                        <Icons.Edit className="w-4 h-4" /> Edit Event
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDeleteEvent(); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors border-t ${theme.canvas.border}`}
                                    >
                                        <Icons.Trash className="w-4 h-4" /> Delete Event
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button onClick={onToggle} className="p-2">
                        <Icons.ChevronDown className={clsx(
                            `w-5 h-5 ${theme.text.secondary} transition-transform`,
                            isExpanded && "rotate-180"
                        )} />
                    </button>
                </div>
            </div>

            {/* Event Details (Expandable) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0 border-t border-zinc-800">
                            {/* Venue Info */}
                            {(event.venue_name || event.venue_location) && (
                                <div className={`flex items-center gap-2 mb-4 mt-4 text-sm ${theme.text.secondary}`}>
                                    <Icons.MapPin className="w-4 h-4" />
                                    <span className={`${theme.text.primary}`}>{event.venue_name || 'Unnamed Venue'}</span>
                                    {event.venue_location && (
                                        <span className={`${theme.text.secondary}`}>— {event.venue_location}</span>
                                    )}
                                </div>
                            )}

                            {/* Event Notes */}
                            {event.notes && (
                                <div className={`mb-4 p-3 ${theme.canvas.hover || "bg-zinc-800/50"} rounded-lg border-l-4 border-amber-500/50`}>
                                    <p className={`text-sm ${theme.text.secondary} italic`}>"{event.notes}"</p>
                                </div>
                            )}

                            {/* Deliverables Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className={`flex items-center gap-2 text-sm uppercase tracking-widest ${theme.text.secondary} font-medium`}>
                                        <Icons.Package className="w-4 h-4" />
                                        Deliverables ({eventTasks?.length || 0})
                                    </h4>
                                    <button
                                        onClick={onAddDeliverable}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${theme.canvas.card} hover:${theme.canvas.hover} ${theme.text.secondary} text-xs font-medium transition-colors`}
                                    >
                                        <Icons.Plus className="w-3 h-3" />
                                        Add
                                    </button>
                                </div>
                                {eventTasks && eventTasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {eventTasks.map((task) => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                users={users}
                                                onEdit={() => onEditDeliverable(task)}
                                                onDelete={() => onDeleteDeliverable(task)}
                                                onUpdate={onUpdateTask}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="No deliverables yet"
                                        message="Add deliverables to track for this event."
                                        icon={Icons.Package}
                                        compact={true}
                                        action={{
                                            label: "Add Deliverable",
                                            onClick: onAddDeliverable
                                        }}
                                    />
                                )}
                            </div>

                            {/* Team/Assignments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className={`flex items-center gap-2 text-sm uppercase tracking-widest ${theme.text.secondary} font-medium`}>
                                        <Icons.Users className="w-4 h-4" />
                                        Team ({event.assignments?.length || 0})
                                    </h4>
                                    <button
                                        onClick={onAddTeamMember}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${theme.canvas.card} hover:${theme.canvas.hover} ${theme.text.secondary} text-xs font-medium transition-colors`}
                                    >
                                        <Icons.Plus className="w-3 h-3" />
                                        Add
                                    </button>
                                </div>
                                {event.assignments && event.assignments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {event.assignments.map((asgn, i) => (
                                            <AssignmentItem
                                                key={asgn.id || i}
                                                assignment={asgn}
                                                onEdit={() => onEditTeamMember(asgn)}
                                                onDelete={() => onDeleteTeamMember(asgn)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="No team assigned"
                                        message="Assign team members to this event."
                                        icon={Icons.Users}
                                        compact={true}
                                        action={{
                                            label: "Assign Member",
                                            onClick: onAddTeamMember
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Main Page Component
const ProjectPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { config } = useAgencyConfig();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEvents, setExpandedEvents] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    // Vertical config for has_events check
    const configVertical = config?.verticals?.find(v => v.id === project?.vertical?.toLowerCase());
    const hasEvents = configVertical?.has_events !== false;

    // Modal states
    const [deleteProjectModal, setDeleteProjectModal] = useState(false);
    const [eventModal, setEventModal] = useState({ open: false, event: null, eventId: null });
    const [deleteEventModal, setDeleteEventModal] = useState({ open: false, event: null });
    const [deleteDeliverableModal, setDeleteDeliverableModal] = useState({ open: false, task: null }); // Deleting a task/deliverable
    const [teamMemberModal, setTeamMemberModal] = useState({ open: false, eventId: null, assignment: null });
    const [deleteTeamMemberModal, setDeleteTeamMemberModal] = useState({ open: false, eventId: null, assignment: null });
    const [metadataModal, setMetadataModal] = useState(false);
    const [saveTemplateModal, setSaveTemplateModal] = useState(false); // NEW
    const [statusDropdown, setStatusDropdown] = useState(false);
    const [headerMenu, setHeaderMenu] = useState(false);

    const headerMenuRefMobile = useRef(null);
    const headerMenuRefDesktop = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const inMobile = headerMenuRefMobile.current?.contains(event.target);
            const inDesktop = headerMenuRefDesktop.current?.contains(event.target);
            if (!inMobile && !inDesktop) setHeaderMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Task Integration (Unified for both general tasks and deliverables)
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]); // For assignment
    const { user } = useAuth();
    // ... other hooks

    const allTabs = [
        { id: 'overview', label: 'Overview', icon: Icons.LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: Icons.ListTodo },
        { id: 'finance', label: 'Finance', icon: Icons.CircleDollarSign },
    ];

    const tabs = allTabs.filter(tab => {
        if (tab.id === 'finance' || tab.id === 'invoices') {
            return user?.role === 'admin' || user?.role === 'owner';
        }
        return true;
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [taskModal, setTaskModal] = useState({ open: false, task: null, eventId: null, isDeliverable: false }); // Unified: eventId for event deliverables, isDeliverable for project deliverables

    const fetchProject = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [res, tasksRes, usersRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks?project_id=${id}&context=project_page`),
                api.get('/users')
            ]);
            setProject(res.data);
            setTasks(tasksRes.data.data || []);
            setUsers(usersRes.data);
            const expanded = {};
            res.data.events?.forEach((_, i) => { expanded[i] = true; });
            setExpandedEvents(expanded);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProject();
    }, [id, fetchProject]);

    const toggleEvent = (index) => {
        setExpandedEvents(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // === DELETE PROJECT ===
    const handleDeleteProject = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/projects/${id}`);
            navigate(-1);
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete project');
        } finally {
            setActionLoading(false);
            setDeleteProjectModal(false);
        }
    };

    // === SAVE AS TEMPLATE ===
    const handleSaveTemplate = async (templateData) => {
        setActionLoading(true);
        try {
            // Add project_id to the payload to tell backend to copy structure
            await api.post('/templates', { ...templateData, project_id: id });
            toast.success("Project saved as template!");
            setSaveTemplateModal(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save template");
        } finally {
            setActionLoading(false);
        }
    };

    // === TASK/DELIVERABLE CRUD (Unified) ===
    const handleSaveTask = async (formData) => {
        setActionLoading(true);
        try {
            const payload = { ...formData };

            // If eventId is set, this is an event deliverable
            if (taskModal.eventId) {
                payload.type = 'project';
                payload.project_id = id;
                payload.event_id = taskModal.eventId;
                payload.category = 'deliverable';
            } else if (!hasEvents && taskModal.isDeliverable) {
                // Project-level deliverable (non-event vertical)
                payload.type = 'project';
                payload.project_id = id;
                payload.category = 'deliverable';
            } else {
                // General project task
                payload.type = 'project';
                payload.project_id = id;
            }

            if (taskModal.task) {
                await api.patch(`/tasks/${taskModal.task.id}`, payload);
            } else {
                await api.post('/tasks', payload);
            }
            const res = await api.get(`/tasks?project_id=${id}&context=project_page`);
            setTasks(res.data.data || []);
            setTaskModal({ open: false, task: null, eventId: null });
            toast.success(taskModal.task ? 'Saved successfully' : 'Created successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTaskInline = async (taskId, updates) => {
        try {
            await api.patch(`/tasks/${taskId}`, updates);
            // Refresh tasks
            const res = await api.get(`/tasks?project_id=${id}&context=project_page`);
            setTasks(res.data.data || []);
            toast.success('Task updated');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update task');
        }
    };

    // === EVENT CRUD ===
    const handleSaveEvent = async (eventData) => {
        setActionLoading(true);
        try {
            if (eventModal.eventId) {
                // Update existing event
                await api.patch(`/projects/${id}/events/${eventModal.eventId}`, eventData);
            } else {
                // Add new event
                await api.post(`/projects/${id}/events`, { id: uuidv4(), ...eventData });
            }
            await fetchProject();
            setEventModal({ open: false, event: null, eventId: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to save event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/projects/${id}/events/${deleteEventModal.event.id}`);
            await fetchProject();
            setDeleteEventModal({ open: false, event: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete event');
        } finally {
            setActionLoading(false);
        }
    };

    // === DELETED TASK (Deliverable) CRUD ===
    const handleDeleteTask = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/tasks/${deleteDeliverableModal.task.id}`);
            // Refresh Tasks
            const res = await api.get(`/tasks?project_id=${id}&context=project_page`);
            setTasks(res.data.data || []);
            setDeleteDeliverableModal({ open: false, task: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete');
        } finally {
            setActionLoading(false);
        }
    };

    // Removed Legacy Deliverable CRUD

    // === TEAM MEMBER CRUD (supports both event-level and project-level) ===
    const handleSaveTeamMember = async (memberData) => {
        setActionLoading(true);
        try {
            const eventId = teamMemberModal.eventId;
            if (teamMemberModal.assignment) {
                // Update existing
                const url = eventId
                    ? `/projects/${id}/events/${eventId}/assignments/${teamMemberModal.assignment.id}`
                    : `/projects/${id}/assignments/${teamMemberModal.assignment.id}`;
                await api.patch(url, memberData);
            } else {
                // Add new
                const url = eventId
                    ? `/projects/${id}/events/${eventId}/assignments`
                    : `/projects/${id}/assignments`;
                await api.post(url, { id: uuidv4(), ...memberData });
            }
            await fetchProject();
            setTeamMemberModal({ open: false, eventId: null, assignment: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to save team member');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTeamMember = async () => {
        setActionLoading(true);
        try {
            const eventId = deleteTeamMemberModal.eventId;
            const url = eventId
                ? `/projects/${id}/events/${eventId}/assignments/${deleteTeamMemberModal.assignment.id}`
                : `/projects/${id}/assignments/${deleteTeamMemberModal.assignment.id}`;
            await api.delete(url);
            await fetchProject();
            setDeleteTeamMemberModal({ open: false, eventId: null, assignment: null });
        } catch (err) {
            console.error(err);
            toast.error('Failed to remove team member');
        } finally {
            setActionLoading(false);
        }
    };

    // === STATUS TRANSITION ===
    const STATUS_FLOW = ['enquiry', 'booked', 'ongoing', 'completed', 'cancelled'];
    const handleStatusChange = async (newStatus) => {
        setStatusDropdown(false);
        // Validation: Cannot complete project with incomplete tasks
        if (newStatus === 'completed') {
            const incompleteTasks = tasks.filter(t => !['done', 'completed'].includes(t.status));
            if (incompleteTasks.length > 0) {
                toast.error(`Cannot mark as Completed. ${incompleteTasks.length} task(s) are still pending.`);
                return;
            }
        }
        setActionLoading(true);
        try {
            await api.patch(`/projects/${id}`, { status: newStatus });
            await fetchProject();
            const statusLabel = config?.statusOptions?.find(s => s.id === newStatus)?.label || newStatus;
            toast.success(`Project moved to ${statusLabel}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Failed to change status');
        } finally {
            setActionLoading(false);
        }
    };

    // === METADATA UPDATE ===
    const handleSaveMetadata = async (data) => {
        setActionLoading(true);
        try {
            await api.patch(`/projects/${id}`, data);
            await fetchProject();
            setMetadataModal(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save details');
        } finally {
            setActionLoading(false);
        }
    };

    const { theme } = useTheme();

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-32" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-48 rounded-2xl" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-96 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
                <button onClick={() => navigate(-1)} className={`flex items-center gap-2 ${theme.text.secondary} hover:${theme.text.primary} mb-8 transition-colors`}>
                    <Icons.ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                    <Icons.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className={`text-xl font-bold ${theme.text.primary} mb-2`}>Error Loading Project</h2>
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    // Calculate Project Progress
    const projectCompleted = tasks.filter(t => ['done', 'completed'].includes(t.status)).length;
    const projectTotal = tasks.length;

    // Split Tasks
    const deliverables = tasks.filter(t => t.category === 'deliverable');
    const generalTasks = tasks.filter(t => t.category !== 'deliverable');

    return (
        <div className="p-4 md:p-8 pb-20 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`flex items-center gap-2 ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}>
                            <Icons.ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <span className={`${theme.text.secondary} font-mono text-sm`}>{project.code}</span>
                    </div>

                    {/* Mobile Actions: Status + 3-Dot */}
                    <div className="flex sm:hidden items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setStatusDropdown(!statusDropdown)}
                                className="flex items-center gap-2"
                            >
                                <StatusBadge status={project.status} />
                                <Icons.ChevronDown className={`w-4 h-4 ${theme.text.secondary}`} />
                            </button>
                            {statusDropdown && (
                                <div className={`absolute top-full right-0 mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    {(config?.statusOptions || []).filter(s => s.id !== project.status).map(status => (
                                        <button
                                            key={status.id}
                                            onClick={() => handleStatusChange(status.id)}
                                            className={`w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} capitalize transition-colors flex items-center gap-2 group`}
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={headerMenuRefMobile}>
                            <button
                                onClick={() => setHeaderMenu(!headerMenu)}
                                className={`flex items-center justify-center p-2 rounded-lg ${theme.canvas.card} sm:hover:${theme.canvas.hover} border ${theme.canvas.border} ${theme.text.secondary} sm:hover:${theme.text.primary} transition-colors ${headerMenu ? `sm:${theme.canvas.hover} sm:${theme.text.primary}` : ''}`}
                            >
                                <Icons.More className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {headerMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`absolute right-0 top-full mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden`}
                                    >
                                        <button
                                            onClick={() => { setHeaderMenu(false); setMetadataModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                                        >
                                            <Icons.Edit className="w-4 h-4" /> Edit Details
                                        </button>
                                        <button
                                            onClick={() => { setHeaderMenu(false); setSaveTemplateModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors border-t ${theme.canvas.border}`}
                                        >
                                            <Icons.LayoutTemplate className="w-4 h-4" /> Save as Template
                                        </button>
                                        <button
                                            onClick={() => { setHeaderMenu(false); setDeleteProjectModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors border-t ${theme.canvas.border}`}
                                        >
                                            <Icons.Trash className="w-4 h-4" /> Delete Project
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-48">
                        <ProgressBar total={projectTotal} completed={projectCompleted} />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setStatusDropdown(!statusDropdown)}
                                className="flex items-center gap-2"
                            >
                                <StatusBadge status={project.status} />
                                <Icons.ChevronDown className={`w-4 h-4 ${theme.text.secondary}`} />
                            </button>
                            {statusDropdown && (
                                <div className={`absolute top-full left-0 mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    {(config?.statusOptions || []).filter(s => s.id !== project.status).map(status => (
                                        <button
                                            key={status.id}
                                            onClick={() => handleStatusChange(status.id)}
                                            className={`w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} capitalize transition-colors flex items-center gap-2 group`}
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={headerMenuRefDesktop}>
                            <button
                                onClick={() => setHeaderMenu(!headerMenu)}
                                className={`flex items-center justify-center p-2 rounded-lg ${theme.canvas.card} sm:hover:${theme.canvas.hover} border ${theme.canvas.border} ${theme.text.secondary} sm:hover:${theme.text.primary} transition-colors ${headerMenu ? `sm:${theme.canvas.hover} sm:${theme.text.primary}` : ''}`}
                            >
                                <Icons.More className="w-5 h-5" />
                            </button>

                            <AnimatePresence>
                                {headerMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`absolute right-0 top-full mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl z-[60] overflow-hidden`}
                                    >
                                        <button
                                            onClick={() => { setHeaderMenu(false); setMetadataModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`}
                                        >
                                            <Icons.Edit className="w-4 h-4" /> Edit Details
                                        </button>
                                        <button
                                            onClick={() => { setHeaderMenu(false); setSaveTemplateModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors border-t ${theme.canvas.border}`}
                                        >
                                            <Icons.LayoutTemplate className="w-4 h-4" /> Save as Template
                                        </button>
                                        <button
                                            onClick={() => { setHeaderMenu(false); setDeleteProjectModal(true); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-500/10 transition-colors border-t ${theme.canvas.border}`}
                                        >
                                            <Icons.Trash className="w-4 h-4" /> Delete Project
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={`flex items-center gap-4 md:gap-6 mb-6 md:mb-8 border-b ${theme.canvas.border} overflow-x-auto`}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                            activeTab === tab.id ? `text-accent border-accent` : `${theme.text.secondary} border-transparent hover:${theme.text.primary}`
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Vertical-Specific Template (Overview) */}
            {activeTab === 'overview' && (
                <div className="mb-8">
                    <VerticalTemplate project={project} />
                </div>
            )}

            {/* Tasks Tab (Split View) */}
            {activeTab === 'tasks' && (
                <div className="mb-8 space-y-10">
                    {/* 1. Deliverables Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2`}>
                                <Icons.Package className={`w-5 h-5 ${theme.text.secondary}`} />
                                Deliverables ({deliverables.length})
                            </h3>
                            {/* We don't usually add deliverables here directly, but could if needed */}
                        </div>
                        {deliverables.length === 0 ? (
                            <p className={`${theme.text.secondary} italic`}>No deliverables tracked.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {deliverables.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setTaskModal({ open: true, task })} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Other Tasks Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2`}>
                                <Icons.ClipboardList className={`w-5 h-5 ${theme.text.secondary}`} />
                                Other Tasks ({generalTasks.length})
                            </h3>
                            <button
                                onClick={() => setTaskModal({ open: true, task: null })}
                                className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.card} hover:${theme.canvas.hover} ${theme.text.primary} border ${theme.canvas.border} rounded-lg font-bold text-sm transition-colors`}
                            >
                                <Icons.Plus className="w-4 h-4" /> Add Task
                            </button>
                        </div>

                        {generalTasks.length === 0 ? (
                            <EmptyState
                                title="No other tasks"
                                message="Create general tasks for internal work."
                                onClear={() => setTaskModal({ open: true, task: null })}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {generalTasks.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setTaskModal({ open: true, task })} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Finance Tab */}
            {activeTab === 'finance' && (
                <div className="mb-8">
                    <ProjectFinance
                        projectId={id}
                        projectData={project}
                        onUpdateProject={fetchProject}
                    />
                </div>
            )}

            {/* Events Section (only for event-based verticals) */}
            {hasEvents && (
                <div className="mb-8">
                    <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2 mb-4`}>
                        <Icons.Calendar className={`w-5 h-5 ${theme.text.secondary}`} />
                        Events ({project.events?.length || 0})
                    </h3>

                    {project.events && project.events.length > 0 ? (
                        <div className="space-y-4">
                            {project.events.map((event, index) => (
                                <EventSection
                                    key={event.id || index}
                                    event={event}
                                    index={index}
                                    isExpanded={expandedEvents[index]}
                                    onToggle={() => toggleEvent(index)}
                                    onEditEvent={() => setEventModal({ open: true, event, eventId: event.id })}
                                    onDeleteEvent={() => setDeleteEventModal({ open: true, event })}
                                    users={users}
                                    onUpdateTask={handleUpdateTaskInline}

                                    eventTasks={tasks.filter(t => t.event_id === event.id)}

                                    onAddDeliverable={() => setTaskModal({ open: true, task: null, eventId: event.id })}
                                    onEditDeliverable={(task) => setTaskModal({ open: true, task, eventId: event.id })}
                                    onDeleteDeliverable={(task) => setDeleteDeliverableModal({ open: true, task })}

                                    onAddTeamMember={() => setTeamMemberModal({ open: true, eventId: event.id, assignment: null })}
                                    onEditTeamMember={(asgn) => setTeamMemberModal({ open: true, eventId: event.id, assignment: asgn })}
                                    onDeleteTeamMember={(asgn) => setDeleteTeamMemberModal({ open: true, eventId: event.id, assignment: asgn })}
                                />
                            ))}
                        </div>
                    ) : null}

                    <button
                        onClick={() => setEventModal({ open: true, event: null, eventId: null })}
                        className={`w-full mt-4 border-2 border-dashed ${theme.canvas.border} hover:border-zinc-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 ${theme.text.secondary} hover:${theme.text.primary} transition-all group hover:${theme.canvas.hover}`}
                    >
                        <div className={`w-12 h-12 rounded-xl ${theme.canvas.card} group-hover:${theme.canvas.hover} flex items-center justify-center transition-colors`}>
                            <Icons.Plus className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-medium">Add New Event</span>
                        <span className={`text-sm ${theme.text.secondary}`}>Click to add a new event to this project</span>
                    </button>
                </div>
            )}

            {/* Project-Level Deliverables & Team (for non-event verticals) */}
            {!hasEvents && (
                <div className="mb-8 space-y-8">
                    {/* Project Deliverables */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2`}>
                                <Icons.Package className={`w-5 h-5 ${theme.text.secondary}`} />
                                Deliverables ({deliverables.length})
                            </h3>
                            <button
                                onClick={() => setTaskModal({ open: true, task: null, eventId: null, isDeliverable: true })}
                                className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.card} hover:${theme.canvas.hover} ${theme.text.primary} border ${theme.canvas.border} rounded-lg font-bold text-sm transition-colors`}
                            >
                                <Icons.Plus className="w-4 h-4" /> Add Deliverable
                            </button>
                        </div>
                        {deliverables.length === 0 ? (
                            <EmptyState
                                title="No deliverables yet"
                                message="Add deliverables to track for this project."
                                onClear={() => setTaskModal({ open: true, task: null, eventId: null, isDeliverable: true })}
                            />
                        ) : (
                            <div className="space-y-3">
                                {deliverables.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onEdit={() => setTaskModal({ open: true, task, eventId: null, isDeliverable: true })}
                                        onDelete={() => setDeleteDeliverableModal({ open: true, task })}
                                        onUpdate={handleUpdateTaskInline}
                                        users={users}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Project Team */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2`}>
                                <Icons.Users className={`w-5 h-5 ${theme.text.secondary}`} />
                                Team ({project.assignments?.length || 0})
                            </h3>
                            <button
                                onClick={() => setTeamMemberModal({ open: true, eventId: null, assignment: null })}
                                className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.card} hover:${theme.canvas.hover} ${theme.text.primary} border ${theme.canvas.border} rounded-lg font-bold text-sm transition-colors`}
                            >
                                <Icons.Plus className="w-4 h-4" /> Add Member
                            </button>
                        </div>
                        {(!project.assignments || project.assignments.length === 0) ? (
                            <EmptyState
                                title="No team members"
                                message="Assign associates to this project."
                                onClear={() => setTeamMemberModal({ open: true, eventId: null, assignment: null })}
                            />
                        ) : (
                            <div className="space-y-3">
                                {project.assignments.map(asgn => (
                                    <AssignmentItem
                                        key={asgn.id}
                                        assignment={asgn}
                                        onEdit={() => setTeamMemberModal({ open: true, eventId: null, assignment: asgn })}
                                        onDelete={() => setDeleteTeamMemberModal({ open: true, eventId: null, assignment: asgn })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === MODALS === */}

            {/* Delete Project Modal */}
            <ConfirmDeleteModal
                isOpen={deleteProjectModal}
                onClose={() => setDeleteProjectModal(false)}
                onConfirm={handleDeleteProject}
                title="Delete Project"
                message="This will permanently delete this project and all its events, deliverables, and assignments."
                itemName={project.code}
                loading={actionLoading}
            />

            {/* Event Slide-Over */}
            <EventSlideOver
                isOpen={eventModal.open}
                onClose={() => setEventModal({ open: false, event: null, eventId: null })}
                event={eventModal.event}
                onSave={handleSaveEvent}
                onDelete={eventModal.event ? () => {
                    setEventModal({ open: false, event: null, eventId: null });
                    setDeleteEventModal({ open: true, event: eventModal.event });
                } : null}
                loading={actionLoading}
            />

            {/* Delete Event Modal */}
            <ConfirmDeleteModal
                isOpen={deleteEventModal.open}
                onClose={() => setDeleteEventModal({ open: false, event: null })}
                onConfirm={handleDeleteEvent}
                title="Delete Event"
                message="Are you sure you want to delete this event? All deliverables and team assignments within it will also be removed."
                itemName={deleteEventModal.event?.type}
                loading={actionLoading}
            />

            {/* Template Modal */}
            <TemplateModal
                isOpen={saveTemplateModal}
                onClose={() => setSaveTemplateModal(false)}
                onSave={handleSaveTemplate}
                mode="create"
                initialVertical={project?.vertical}
                projectId={id}
            />

            {/* Metadata Modal */}
            <MetadataModal
                isOpen={metadataModal}
                onClose={() => setMetadataModal(false)}
                project={project}
                onSave={handleSaveMetadata}
                loading={actionLoading}
            />

            {/* Removed Legacy Deliverable Modal & Delete Modal */}

            {/* Team Member Modal */}
            <TeamMemberModal
                isOpen={teamMemberModal.open}
                onClose={() => setTeamMemberModal({ open: false, eventId: null, assignment: null })}
                onSave={handleSaveTeamMember}
                assignment={teamMemberModal.assignment}
            />

            {/* Delete Team Member Modal */}
            <ConfirmDeleteModal
                isOpen={deleteTeamMemberModal.open}
                onClose={() => setDeleteTeamMemberModal({ open: false, eventId: null, assignment: null })}
                onConfirm={handleDeleteTeamMember}
                title="Remove Team Member"
                message="Are you sure you want to remove this team member from this event?"
                loading={actionLoading}
            />

            {/* Task Modal (Unified for both Project Tasks and Event Deliverables) */}
            <TaskModal
                isOpen={taskModal.open}
                onClose={() => setTaskModal({ open: false, task: null, eventId: null })}
                onSave={handleSaveTask}
                task={taskModal.task}
                projectId={id}
                eventId={taskModal.eventId}
                users={users}
                loading={actionLoading}
            />

            {/* Delete Task/Deliverable Modal */}
            <ConfirmDeleteModal
                isOpen={deleteDeliverableModal.open}
                onClose={() => setDeleteDeliverableModal({ open: false, task: null })}
                onConfirm={handleDeleteTask}
                title="Delete Item"
                message="Are you sure you want to delete this? This cannot be undone."
                loading={actionLoading}
            />
        </div>
    );
};

export default ProjectPage;
