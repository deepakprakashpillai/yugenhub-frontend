import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// Modals
import { ConfirmDeleteModal, TeamMemberModal, MetadataModal, EventSlideOver, TaskModal } from '../components/modals';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';

// Vertical-specific templates
import { WeddingTemplate, KidsTemplate, EventsTemplate, GenericTemplate } from '../components/templates';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Pending': { bg: 'bg-zinc-700', text: 'text-zinc-300', icon: Icons.Clock },
        'In Progress': { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Icons.Loader },
        'Completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Icons.CheckCircle },
        'Delivered': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Icons.Package },
        'enquiry': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Icons.AlertCircle },
        'booked': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: Icons.CheckCircle },
        'ongoing': { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Icons.Loader },
        'completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Icons.CheckCircle },
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
        <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
            config.bg, config.text
        )}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    );
};

// Progress Bar Component
const ProgressBar = ({ total, completed, className }) => {
    if (total === 0) return null;
    const percent = Math.round((completed / total) * 100);
    return (
        <div className={clsx("w-full max-w-xs", className)}>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Progress</span>
                <span>{percent}% ({completed}/{total})</span>
            </div>
            <div className="h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// Template Switcher Component
const VerticalTemplate = ({ project }) => {
    const vertical = project?.vertical?.toLowerCase();

    switch (vertical) {
        case 'knots':
            return <WeddingTemplate project={project} />;
        case 'pluto':
            return <KidsTemplate project={project} />;
        case 'festia':
            return <EventsTemplate project={project} />;
        case 'thryv':
        default:
            return <GenericTemplate project={project} />;
    }
};

// Task Item Component (for Deliverables display)
const TaskItem = ({ task, onEdit, onDelete }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'No Due Date';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 group">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
                    <Icons.Package className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                    <h5 className="text-white font-medium">{task.title}</h5>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        {task.quantity && <span>Qty: {task.quantity}</span>}
                        {task.quantity && <span>•</span>}
                        <span className="flex items-center gap-1">
                            <Icons.Calendar className="w-3 h-3" />
                            {formatDate(task.due_date)}
                        </span>
                    </div>
                    {task.description && (
                        <p className="text-zinc-500 text-xs mt-2 italic">"{task.description}"</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <Icons.Trash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Assignment Item Component with Edit/Delete
const AssignmentItem = ({ assignment, onEdit, onDelete }) => {
    const name = assignment.associate_name || assignment.name || 'Unknown';

    return (
        <div className="flex items-center justify-between gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                    {name.charAt(0)}
                </div>
                <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    <p className="text-zinc-500 text-xs">{assignment.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">
                    {assignment.role}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <Icons.Trash className="w-4 h-4" />
                    </button>
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
    onAddTeamMember,
    onEditTeamMember,
    onDeleteTeamMember
}) => {
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Event Header (Clickable) */}
            <div className="flex items-center justify-between p-5 hover:bg-zinc-800/50 transition-colors">
                <button onClick={onToggle} className="flex items-center gap-4 text-left flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-lg">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{event.type}</h3>
                        <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Icons.Calendar className="w-4 h-4" />
                                {formatDate(event.start_date)}
                                {hasEndDate && (
                                    <> → {formatDate(event.end_date)}</>
                                )}
                            </span>
                            {(startTime || endTime) && (
                                <span className="flex items-center gap-1">
                                    <Icons.Clock className="w-4 h-4" />
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
                        <span className="text-zinc-500">{event.assignments?.length || 0} Team</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditEvent(); }}
                        className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteEvent(); }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <Icons.Trash className="w-4 h-4" />
                    </button>
                    <button onClick={onToggle} className="p-2">
                        <Icons.ChevronDown className={clsx(
                            "w-5 h-5 text-zinc-500 transition-transform",
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
                                <div className="flex items-center gap-2 mb-4 mt-4 text-sm text-zinc-400">
                                    <Icons.MapPin className="w-4 h-4" />
                                    <span className="text-white">{event.venue_name || 'Unnamed Venue'}</span>
                                    {event.venue_location && (
                                        <span className="text-zinc-500">— {event.venue_location}</span>
                                    )}
                                </div>
                            )}

                            {/* Event Notes */}
                            {event.notes && (
                                <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border-l-4 border-amber-500/50">
                                    <p className="text-sm text-zinc-400 italic">"{event.notes}"</p>
                                </div>
                            )}

                            {/* Deliverables Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500 font-medium">
                                        <Icons.Package className="w-4 h-4" />
                                        Deliverables ({eventTasks?.length || 0})
                                    </h4>
                                    <button
                                        onClick={onAddDeliverable}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
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
                                                onEdit={() => onEditDeliverable(task)}
                                                onDelete={() => onDeleteDeliverable(task)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-zinc-600 text-sm italic p-4 bg-zinc-800/30 rounded-xl">
                                        No deliverables assigned to this event yet.
                                    </p>
                                )}
                            </div>

                            {/* Team/Assignments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500 font-medium">
                                        <Icons.Users className="w-4 h-4" />
                                        Team ({event.assignments?.length || 0})
                                    </h4>
                                    <button
                                        onClick={onAddTeamMember}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
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
                                    <p className="text-zinc-600 text-sm italic p-4 bg-zinc-800/30 rounded-xl">
                                        No team members assigned to this event yet.
                                    </p>
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
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEvents, setExpandedEvents] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    // Modal states
    const [deleteProjectModal, setDeleteProjectModal] = useState(false);
    const [eventModal, setEventModal] = useState({ open: false, event: null, eventId: null });
    const [deleteEventModal, setDeleteEventModal] = useState({ open: false, event: null });
    const [deleteDeliverableModal, setDeleteDeliverableModal] = useState({ open: false, task: null }); // Deleting a task/deliverable
    const [teamMemberModal, setTeamMemberModal] = useState({ open: false, eventId: null, assignment: null });
    const [deleteTeamMemberModal, setDeleteTeamMemberModal] = useState({ open: false, eventId: null, assignment: null });
    const [metadataModal, setMetadataModal] = useState(false);
    const [statusDropdown, setStatusDropdown] = useState(false);

    // Task Integration (Unified for both general tasks and deliverables)
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]); // For assignment
    const [activeTab, setActiveTab] = useState('overview');
    const [taskModal, setTaskModal] = useState({ open: false, task: null, eventId: null }); // Unified: eventId for deliverables

    const fetchProject = async () => {
        setLoading(true);
        setError(null);
        try {
            const [res, tasksRes, usersRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks?project_id=${id}`),
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
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

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

    // === TASK/DELIVERABLE CRUD (Unified) ===
    const handleSaveTask = async (formData) => {
        setActionLoading(true);
        try {
            const payload = { ...formData };

            // If eventId is set, this is a deliverable
            if (taskModal.eventId) {
                payload.type = 'project';
                payload.project_id = id;
                payload.event_id = taskModal.eventId;
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
            const res = await api.get(`/tasks?project_id=${id}`);
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
            const res = await api.get(`/tasks?project_id=${id}`);
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

    // === TEAM MEMBER CRUD ===
    const handleSaveTeamMember = async (memberData) => {
        setActionLoading(true);
        try {
            if (teamMemberModal.assignment) {
                // Update existing
                await api.patch(
                    `/projects/${id}/events/${teamMemberModal.eventId}/assignments/${teamMemberModal.assignment.id}`,
                    memberData
                );
            } else {
                // Add new
                await api.post(
                    `/projects/${id}/events/${teamMemberModal.eventId}/assignments`,
                    { id: uuidv4(), ...memberData }
                );
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
            await api.delete(
                `/projects/${id}/events/${deleteTeamMemberModal.eventId}/assignments/${deleteTeamMemberModal.assignment.id}`
            );
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
            toast.success(`Project moved to ${newStatus}`);
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

    if (loading) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 w-32 bg-zinc-800 rounded mb-8"></div>
                    <div className="h-48 bg-zinc-800 rounded-2xl mb-8"></div>
                    <div className="h-64 bg-zinc-800 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                    <Icons.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Project</h2>
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
        <div className="p-8 pb-20 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5" /> Back
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-mono text-sm">{project.code}</span>
                    <div className="w-48 ml-4">
                        <ProgressBar total={projectTotal} completed={projectCompleted} />
                    </div>

                    {/* Status Transition Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setStatusDropdown(!statusDropdown)}
                            className="flex items-center gap-2"
                        >
                            <StatusBadge status={project.status} />
                            <Icons.ChevronDown className="w-4 h-4 text-zinc-400" />
                        </button>
                        {statusDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {STATUS_FLOW.filter(s => s !== project.status).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white capitalize transition-colors flex items-center gap-2 group"
                                    >
                                        <Icons.ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                        {status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setMetadataModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
                    >
                        <Icons.Edit className="w-4 h-4" />
                        Edit Details
                    </button>
                    <button
                        onClick={() => setDeleteProjectModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <Icons.Trash className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 mb-8 border-b border-zinc-800">
                {['overview', 'tasks'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "pb-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2",
                            activeTab === tab ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300"
                        )}
                    >
                        {tab}
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
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Icons.Package className="w-5 h-5 text-zinc-500" />
                                Deliverables ({deliverables.length})
                            </h3>
                            {/* We don't usually add deliverables here directly, but could if needed */}
                        </div>
                        {deliverables.length === 0 ? (
                            <p className="text-zinc-600 italic">No deliverables tracked.</p>
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
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Icons.ClipboardList className="w-5 h-5 text-zinc-500" />
                                Other Tasks ({generalTasks.length})
                            </h3>
                            <button
                                onClick={() => setTaskModal({ open: true, task: null })}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-zinc-200 transition-colors"
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

            {/* Events Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Icons.Calendar className="w-5 h-5 text-zinc-500" />
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

                                // NEW: Pass Tasks linked to this Event
                                eventTasks={tasks.filter(t => t.event_id === event.id)}

                                // Use unified TaskModal for event deliverables
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

                {/* Skeleton Add Event Button */}
                <button
                    onClick={() => setEventModal({ open: true, event: null, eventId: null })}
                    className="w-full mt-4 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300 transition-all group hover:bg-zinc-900/50"
                >
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                        <Icons.Plus className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-medium">Add New Event</span>
                    <span className="text-sm text-zinc-600">Click to add a new event to this project</span>
                </button>
            </div>

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
                loading={actionLoading}
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
