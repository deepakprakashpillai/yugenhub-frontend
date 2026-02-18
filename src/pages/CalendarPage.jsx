import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, addMonths, subMonths, isSameMonth,
    isSameDay, isToday, parseISO
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import clsx from 'clsx';
import SkeletonCard from '../components/SkeletonCard';
import TaskModal from '../components/modals/TaskModal';
import { usePermission } from '../hooks/usePermissions';
import { PERMISSIONS, ROLES } from '../config/permissions';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMediaQuery';

const CalendarPage = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month' | 'week' (future scope)
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [hoveredMoreDay, setHoveredMoreDay] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [moreTooltipPos, setMoreTooltipPos] = useState({ top: 0, left: 0 });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [users, setUsers] = useState([]);

    // Permission Check (kept for future use, not used for Calendar access)
    const canViewAll = usePermission(PERMISSIONS.VIEW_ALL_CALENDAR);

    // Filter States
    const { user } = useAuth();
    const [showType, setShowType] = useState('all'); // 'all' | 'event' | 'task'
    const isMobile = useIsMobile();

    // On mobile, auto-select today
    const [mobileSelectedDate, setMobileSelectedDate] = useState(new Date());

    // Default: Show all events for admins, but assigned only for members
    const [assignedOnly, setAssignedOnly] = useState(user?.role === ROLES.MEMBER);

    // Sync default state when user loads (in case of refresh)
    useEffect(() => {
        if (user?.role === ROLES.MEMBER) {
            setAssignedOnly(true);
        }
    }, [user]);

    // Compute Calendar Grid
    const { days, startDate, endDate } = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        return { days, startDate, endDate };
    }, [currentDate]);

    // Fetch Users (for Task Modal)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to load users", err);
            }
        };
        fetchUsers();
    }, []);

    // Fetch Data when range or filters change
    const fetchCalendar = async () => {
        setLoading(true);
        try {
            const startStr = format(startDate, 'yyyy-MM-dd');
            const endStr = format(endDate, 'yyyy-MM-dd');

            const params = {
                start: startStr,
                end: endStr,
                assigned_only: assignedOnly
            };

            // Add type filter if not 'all'
            if (showType !== 'all') {
                params.type = showType;
            }

            const res = await api.get('/calendar', { params });
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to load calendar", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendar();
    }, [startDate, endDate, showType, assignedOnly]);

    // Handlers
    const handleEventClick = (evt, e) => {
        e.stopPropagation();

        if (evt.type === 'event' || (evt.type === 'task' && evt.project_id)) {
            // Redirect to Project Page
            if (evt.project_id) {
                navigate(`/projects/${evt.project_id}`);
            }
        } else if (evt.type === 'task' && !evt.project_id) {
            // Open Task Modal for General Tasks
            setSelectedTask(evt);
            setIsModalOpen(true);
        }
    };

    const handleTaskSave = async (formData) => {
        try {
            if (selectedTask) {
                await api.patch(`/tasks/${selectedTask.id}`, formData);
            } else {
                await api.post('/tasks', formData);
            }
            setIsModalOpen(false);
            fetchCalendar(); // Refresh calendar
        } catch (err) {
            console.error("Failed to save task", err);
        }
    };

    // Navigation Handlers
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    // Helper: Get events for a specific day
    const getEventsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return events.filter(e => e.date === dayStr);
    };

    // Helper: Render Event Tooltip
    const renderEventTooltip = (evt, isOverflowItem = false) => {
        const isHovered = hoveredEvent?.id === evt.id;

        const content = (
            <motion.div
                key="tooltip"
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={clsx(
                    `fixed z-[9999] ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-xl min-w-[240px] p-3 pointer-events-none`,
                    isOverflowItem && (!tooltipPos.placement || tooltipPos.placement === 'right') && "ml-2",
                    isOverflowItem && tooltipPos.placement === 'left' && "mr-2",
                    !isOverflowItem && "-translate-y-full -mt-2"
                )}
                style={{ top: tooltipPos.top, left: tooltipPos.left, right: tooltipPos.right }}
            >
                <div className="flex items-start gap-2 mb-2">
                    <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        evt.type === 'event' ? "bg-blue-500/20" : "bg-amber-500/20"
                    )}>
                        {evt.type === 'event'
                            ? <Icons.Video className="w-4 h-4 text-blue-400" />
                            : <Icons.CheckSquare className="w-4 h-4 text-amber-400" />
                        }
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${theme.text.primary} leading-tight`}>{evt.title}</p>
                        <p className={`text-[10px] ${theme.text.secondary} uppercase tracking-wider mt-0.5`}>
                            {evt.type === 'event' ? 'Event / Shoot' : 'Deliverable'}
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                    {evt.project_code && (
                        <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                            <Icons.Package className="w-3 h-3 opacity-70" />
                            <span>{evt.project_code}</span>
                        </div>
                    )}
                    {evt.details?.venue && (
                        <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                            <Icons.MapPin className="w-3 h-3 opacity-70" />
                            <span>{evt.details.venue}</span>
                        </div>
                    )}
                    {evt.details?.status && (
                        <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                            <Icons.Clock className="w-3 h-3 opacity-70" />
                            <span className="capitalize">{evt.details.status}</span>
                        </div>
                    )}
                    {evt.details?.assignee && (
                        <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                            <Icons.Users className="w-3 h-3 opacity-70" />
                            <span>{evt.details.assignee}</span>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                        <Icons.Calendar className="w-3 h-3 opacity-70" />
                        <span>{evt.date}</span>
                    </div>
                </div>

                {/* Arrow (Dynamic position based on type) */}
                <div className={clsx(
                    "absolute w-0 h-0 border-8 border-transparent",
                    (!tooltipPos.placement || tooltipPos.placement === 'right') && `right-full top-3 border-r-current -translate-x-[1px] ${themeMode === 'light' ? 'text-white' : 'text-zinc-950'}`,
                    tooltipPos.placement === 'left' && `left-full top-3 border-l-current translate-x-[1px] ${themeMode === 'light' ? 'text-white' : 'text-zinc-950'}`,
                    tooltipPos.placement === 'top' && `left-4 bottom-0 translate-y-full border-t-current -translate-y-[1px] ${themeMode === 'light' ? 'text-white' : 'text-zinc-950'}`
                )} />
            </motion.div>
        );

        return createPortal(
            <AnimatePresence>
                {isHovered && content}
            </AnimatePresence>,
            document.body
        );
    };

    // Need themeMode for tooltip arrow color
    const { themeMode } = useTheme();

    return (
        <div className="p-4 md:p-8 pb-20 max-w-[1600px] mx-auto min-h-screen relative">
            {/* ... Header ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className={`text-2xl md:text-4xl font-black ${theme.text.primary} uppercase tracking-tighter`}>Calendar</h1>
                    <p className={`${theme.text.secondary} text-sm mt-1`}>Global schedule of shoots and deadlines.</p>
                </div>
                {/* ... Filter Controls ... */}
                <div className="flex items-center gap-3 flex-wrap">
                    {(canViewAll || showType !== 'task') && (
                        <button
                            onClick={() => setAssignedOnly(!assignedOnly)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                                assignedOnly
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                    : `${theme.canvas.card} ${theme.text.secondary} ${theme.canvas.border} ${theme.canvas.hover}`
                            )}
                        >
                            <Icons.User className="w-3.5 h-3.5" />
                            My Schedule
                            {assignedOnly && <Icons.Check className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    <div className={`flex items-center gap-1 ${theme.canvas.card} p-1 rounded-xl border ${theme.canvas.border}`}>
                        <button
                            onClick={() => setShowType('all')}
                            className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all", showType === 'all' ? "text-white" : `${theme.text.secondary} ${theme.canvas.hover}`)}
                            style={showType === 'all' ? { backgroundColor: theme.accents?.default?.primary } : {}}
                        >
                            All
                        </button>
                        <button onClick={() => setShowType('event')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5", showType === 'event' ? "bg-blue-500/20 text-blue-400" : `${theme.text.secondary} ${theme.canvas.hover}`)}><Icons.Video className="w-3.5 h-3.5" />Events</button>
                        <button onClick={() => setShowType('task')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5", showType === 'task' ? "bg-amber-500/20 text-amber-400" : `${theme.text.secondary} ${theme.canvas.hover}`)}><Icons.CheckSquare className="w-3.5 h-3.5" />Tasks</button>
                    </div>
                    {/* Month Nav */}
                    <div className={`flex items-center gap-4 ${theme.canvas.card} p-2 rounded-2xl border ${theme.canvas.border} backdrop-blur-sm`}>
                        <button onClick={prevMonth} className={`p-2 ${theme.text.secondary} ${theme.canvas.hover} hover:${theme.text.primary} rounded-xl transition-colors`}><Icons.ChevronRight className="w-5 h-5 rotate-180" /></button>
                        <div className="text-center min-w-[140px]"><h2 className={`text-lg font-bold ${theme.text.primary} uppercase`}>{format(currentDate, 'MMMM yyyy')}</h2></div>
                        <button onClick={nextMonth} className={`p-2 ${theme.text.secondary} ${theme.canvas.hover} hover:${theme.text.primary} rounded-xl transition-colors`}><Icons.ChevronRight className="w-5 h-5" /></button>
                        <div className={`w-px h-6 ${theme.canvas.border} mx-2`} />
                        <button onClick={jumpToToday} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${theme.text.secondary} hover:${theme.text.primary} border ${theme.canvas.border} rounded-lg ${theme.canvas.hover} transition-all`}>Today</button>
                    </div>
                </div>
            </div>

            {/* === MOBILE CALENDAR VIEW === */}
            {isMobile ? (
                <div>
                    {/* Compact Mini-Calendar */}
                    <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden shadow-sm mb-4`}>
                        {/* Day headers */}
                        <div className={`grid grid-cols-7 border-b ${theme.canvas.border}`}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className={clsx("py-2 text-center text-[10px] font-bold uppercase tracking-widest", (i === 0 || i === 6) ? "text-red-500/70" : theme.text.secondary)}>{d}</div>
                            ))}
                        </div>
                        {/* Date cells */}
                        <div className="grid grid-cols-7">
                            {days.map((day) => {
                                const dayEvents = getEventsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isTodayDate = isToday(day);
                                const isSelected = isSameDay(day, mobileSelectedDate);
                                const hasEvents = dayEvents.length > 0;
                                const hasEventType = dayEvents.some(e => e.type === 'event');
                                const hasTaskType = dayEvents.some(e => e.type === 'task');

                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => setMobileSelectedDate(day)}
                                        className={clsx(
                                            "flex flex-col items-center justify-center py-2.5 relative transition-all",
                                            !isCurrentMonth && "opacity-30",
                                            isSelected && "bg-blue-500/15",
                                        )}
                                    >
                                        <span className={clsx(
                                            "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all",
                                            isTodayDate && !isSelected && "bg-blue-500 text-white",
                                            isSelected && "bg-blue-500 text-white scale-110",
                                            !isTodayDate && !isSelected && theme.text.secondary
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {/* Dot indicators */}
                                        {hasEvents && (
                                            <div className="flex gap-0.5 mt-1">
                                                {hasEventType && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                {hasTaskType && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                            </div>
                                        )}
                                        {!hasEvents && <div className="h-[10px]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Daily Event List */}
                    <div>
                        <h3 className={`text-sm font-bold ${theme.text.primary} mb-3 uppercase tracking-wider`}>
                            {format(mobileSelectedDate, 'EEEE, MMMM d')}
                        </h3>
                        {(() => {
                            const dayEvents = getEventsForDay(mobileSelectedDate);
                            if (dayEvents.length === 0) {
                                return (
                                    <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-xl p-6 text-center`}>
                                        <p className={`${theme.text.secondary} text-sm`}>No events on this day</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-2">
                                    {dayEvents.map((evt) => (
                                        <div
                                            key={evt.id}
                                            onClick={(e) => handleEventClick(evt, e)}
                                            className={clsx(
                                                `${theme.canvas.card} border ${theme.canvas.border} rounded-xl p-3 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-all`,
                                                evt.type === 'event' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-amber-500'
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                                evt.type === 'event' ? "bg-blue-500/20" : "bg-amber-500/20"
                                            )}>
                                                {evt.type === 'event'
                                                    ? <Icons.Video className="w-4 h-4 text-blue-400" />
                                                    : <Icons.CheckSquare className="w-4 h-4 text-amber-400" />
                                                }
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-bold ${theme.text.primary} leading-tight`}>{evt.title}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                    {evt.project_code && (
                                                        <span className={`text-[11px] ${theme.text.secondary} flex items-center gap-1`}>
                                                            <Icons.Package className="w-3 h-3 opacity-70" />
                                                            {evt.project_code}
                                                        </span>
                                                    )}
                                                    {evt.details?.venue && (
                                                        <span className={`text-[11px] ${theme.text.secondary} flex items-center gap-1`}>
                                                            <Icons.MapPin className="w-3 h-3 opacity-70" />
                                                            {evt.details.venue}
                                                        </span>
                                                    )}
                                                    {evt.details?.assignee && (
                                                        <span className={`text-[11px] ${theme.text.secondary} flex items-center gap-1`}>
                                                            <Icons.Users className="w-3 h-3 opacity-70" />
                                                            {evt.details.assignee}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Icons.ChevronRight className={`w-4 h-4 ${theme.text.secondary} shrink-0 mt-1`} />
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            ) : (
                /* === DESKTOP CALENDAR GRID === */
                <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden shadow-sm`}>
                    {/* Day Headers */}
                    <div className={`grid grid-cols-7 border-b ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-30`}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <div key={day} className={clsx("py-3 text-center text-xs font-bold uppercase tracking-widest", (i === 0 || i === 6) ? "text-red-500/70" : theme.text.secondary)}>{day}</div>
                        ))}
                    </div>

                    {/* Days Cells */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {days.map((day, idx) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={clsx(
                                        `min-h-[120px] p-2 border-b border-r ${theme.canvas.border} relative group transition-colors cursor-pointer`,
                                        !isCurrentMonth ? `${theme.canvas.bg} opacity-50` : `${theme.canvas.card} hover:${theme.canvas.hover}`,
                                        isTodayDate && "bg-blue-500/5"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx("w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold", isTodayDate ? "bg-blue-500 text-white" : `${theme.text.secondary} group-hover:${theme.text.primary}`)}>{format(day, 'd')}</span>
                                        {dayEvents.length > 0 && <span className={`text-[10px] font-bold ${theme.text.secondary} ${theme.canvas.bg} px-1.5 py-0.5 rounded border ${theme.canvas.border}`}>{dayEvents.length}</span>}
                                    </div>

                                    <div className="space-y-1 overflow-visible">
                                        {/* Visible Events */}
                                        {dayEvents.slice(0, 4).map((evt) => (
                                            <div
                                                key={evt.id}
                                                className={clsx(
                                                    "text-[10px] px-1.5 py-0.5 rounded font-medium border-l-2 relative cursor-pointer transition-all overflow-visible",
                                                    evt.type === 'event' ? "bg-blue-500/10 text-blue-400 border-blue-500 hover:bg-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500 hover:bg-amber-500/20"
                                                )}
                                                onClick={(e) => handleEventClick(evt, e)}
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setTooltipPos({ top: rect.top, left: rect.left, placement: 'top' });
                                                    setHoveredEvent(evt);
                                                }}
                                                onMouseLeave={() => setHoveredEvent(null)}
                                            >
                                                <span className="flex items-center truncate">
                                                    {evt.type === 'task' && <Icons.CheckSquare className="w-2.5 h-2.5 mr-1 opacity-70 shrink-0" />}
                                                    {evt.type === 'event' && <Icons.Video className="w-2.5 h-2.5 mr-1 opacity-70 shrink-0" />}
                                                    <span className="truncate">{evt.title}</span>
                                                </span>
                                                {/* Main Tooltip */}
                                                {renderEventTooltip(evt, false)}
                                            </div>
                                        ))}

                                        {/* Overflow Indicator */}
                                        {dayEvents.length > 4 && (
                                            <div
                                                className="relative"
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const viewportWidth = window.innerWidth;
                                                    const listWidth = 240;

                                                    let left, placement;

                                                    if (rect.left + listWidth > viewportWidth) {
                                                        left = rect.right - listWidth;
                                                        placement = 'left';
                                                    } else {
                                                        left = rect.left;
                                                        placement = 'right';
                                                    }

                                                    const bottom = window.innerHeight - rect.top;

                                                    setMoreTooltipPos({ bottom, left, placement });
                                                    setHoveredMoreDay(day.toString());
                                                }}
                                                onMouseLeave={() => setHoveredMoreDay(null)}
                                            >
                                                <div className={`text-[10px] ${theme.text.secondary} pl-1 font-bold cursor-pointer hover:${theme.text.primary}`}>
                                                    + {dayEvents.length - 4} more
                                                </div>

                                                {/* Hidden Events List Tooltip */}
                                                {createPortal(
                                                    <AnimatePresence>
                                                        {hoveredMoreDay === day.toString() && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 5 }}
                                                                transition={{ duration: 0.15 }}
                                                                className={`fixed w-56 p-2 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-xl z-[150]`}
                                                                style={{
                                                                    bottom: moreTooltipPos.bottom,
                                                                    left: moreTooltipPos.left
                                                                }}
                                                                onMouseEnter={() => setHoveredMoreDay(day.toString())}
                                                                onMouseLeave={() => setHoveredMoreDay(null)}
                                                            >
                                                                <div className={`text-[10px] uppercase font-bold ${theme.text.secondary} mb-2 px-1`}>Hidden Items</div>
                                                                <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar overflow-visible p-1">
                                                                    {dayEvents.slice(4).map((evt) => (
                                                                        <div
                                                                            key={evt.id}
                                                                            className={clsx(
                                                                                "text-[10px] px-2 py-1.5 rounded font-medium border-l-2 relative cursor-pointer transition-all",
                                                                                evt.type === 'event'
                                                                                    ? "bg-blue-500/10 text-blue-400 border-blue-500 hover:bg-blue-500/20"
                                                                                    : "bg-amber-500/10 text-amber-400 border-amber-500 hover:bg-amber-500/20"
                                                                            )}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEventClick(evt, e);
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const viewportWidth = window.innerWidth;
                                                                                const tooltipWidth = 280;

                                                                                if (rect.right + tooltipWidth > viewportWidth) {
                                                                                    const rightPos = viewportWidth - rect.left;
                                                                                    setTooltipPos({ top: rect.top, right: rightPos, placement: 'left' });
                                                                                    setHoveredEvent(evt);
                                                                                } else {
                                                                                    setTooltipPos({ top: rect.top, left: rect.right + 8, placement: 'right' });
                                                                                    setHoveredEvent(evt);
                                                                                }
                                                                            }}
                                                                            onMouseLeave={() => setHoveredEvent(null)}
                                                                        >
                                                                            <span className="flex items-center truncate">
                                                                                {evt.type === 'task' && <Icons.CheckSquare className="w-2.5 h-2.5 mr-1.5 opacity-70 shrink-0" />}
                                                                                {evt.type === 'event' && <Icons.Video className="w-2.5 h-2.5 mr-1.5 opacity-70 shrink-0" />}
                                                                                <span className="truncate">{evt.title}</span>
                                                                            </span>
                                                                            {/* Nested Tooltip (Overflow Item) */}
                                                                            {renderEventTooltip(evt, true)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className={clsx(
                                                                    "absolute w-0 h-0 border-8 border-transparent -bottom-4",
                                                                    moreTooltipPos.placement === 'left' ? "right-4" : "left-4",
                                                                    `border-t-current ${themeMode === 'light' ? 'text-white' : 'text-zinc-950'}`
                                                                )} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>,
                                                    document.body
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {loading && (
                <div className={`absolute inset-0 ${theme.canvas.bg} bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl`}>
                    <Icons.Loader className={`w-8 h-8 ${theme.text.primary} animate-spin`} />
                </div>
            )}

            <div className={`mt-6 flex gap-6 justify-center text-xs font-bold uppercase ${theme.text.secondary}`}>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500/20 border-l-2 border-blue-500" /> Event / Shoot
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500/20 border-l-2 border-amber-500" /> Pending Task
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500/20 border-l-2 border-emerald-500" /> Completed Task
                </div>
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleTaskSave}
                task={selectedTask}
                users={users}
            />
        </div>
    );
};

export default CalendarPage;
