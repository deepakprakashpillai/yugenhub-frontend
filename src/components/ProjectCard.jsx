import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Icons } from './Icons';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { toast } from 'sonner';

const ProjectCard = ({ project, onRefresh }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const [statusOpen, setStatusOpen] = useState(false);
    const statusRef = useRef(null);
    const [updating, setUpdating] = useState(false);

    // Close status dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusRef.current && !statusRef.current.contains(event.target)) {
                setStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Status Update
    const handleStatusUpdate = async (newStatusId) => {
        if (newStatusId === project.status) {
            setStatusOpen(false);
            return;
        }

        setUpdating(true);


        try {
            await api.patch(`/projects/${project._id}`, { status: newStatusId });
            const statusLabel = config?.statusOptions?.find(s => s.id === newStatusId)?.label || newStatusId;
            toast.success(`Status updated to ${statusLabel}`);
            setStatusOpen(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    // Look up status config dynamically
    const statusConfig = config?.statusOptions?.find(s => s.id === project.status);
    const statusLabel = statusConfig?.label || project.status;
    const statusColor = statusConfig?.color || '#71717a';

    // Determine next event for "Upcoming" badge
    const nextEvent = project.events?.find(e => new Date(e.start_date) > new Date()) || null;

    // Format Date Helper
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleString('default', { month: 'short' }).toUpperCase()
        };
    };

    // Helper to determine display title
    const getDisplayTitle = () => {
        const { vertical, metadata } = project;
        const meta = metadata || {};

        if (vertical === 'knots') {
            const groom = meta.groom_name ? meta.groom_name.split(' ')[0] : '';
            const bride = meta.bride_name ? meta.bride_name.split(' ')[0] : '';

            if (groom && bride) return `${groom} & ${bride}`;
            if (groom) return `${groom}'s Wedding`;
            if (bride) return `${bride}'s Wedding`;
        }

        if (vertical === 'pluto') {
            const child = meta.child_name ? meta.child_name.split(' ')[0] : '';
            const occasion = meta.occasion_type || 'Event';
            if (child) return `${child}'s ${occasion}`;
        }

        if (vertical === 'festia') {
            return meta.event_name || meta.company_name;
        }

        // Fallback to title (if exists) or client name
        return project.title || meta.client_name || 'Untitled Project';
    };

    const displayTitle = getDisplayTitle();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: expanded ? 0 : -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={clsx(
                "relative border rounded-2xl overflow-hidden transition-colors duration-300 flex flex-col",
                expanded ? `${theme.canvas.card} border-${theme.accent?.primary || 'zinc-500'} shadow-2xl z-10` : `${theme.canvas.card} ${theme.canvas.border} hover:border-${theme.accent?.primary || 'zinc-500'}`
            )}
        >
            {/* Decorative Gradient Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* --- CARD HEADER (Navigation Zone) --- */}
            <div
                className="p-4 pb-2 md:p-6 md:pb-2 cursor-pointer group/header"
                onClick={() => navigate(`/projects/${project._id}`)}
            >
                <div className="flex justify-between items-start mb-4">
                    <span className={`font-mono text-[10px] ${theme.text.secondary} tracking-widest uppercase ${theme.canvas.bg} px-2 py-1 rounded border ${theme.canvas.border}`}>
                        {project.code}
                    </span>
                    {/* Status Dropdown */}
                    <div className="relative" ref={statusRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setStatusOpen(!statusOpen)}
                            disabled={updating}
                            className={clsx(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all hover:brightness-110",
                                updating && "opacity-50 cursor-wait"
                            )}
                            style={{
                                borderColor: `${statusColor}33`,
                                color: statusColor,
                                backgroundColor: `${statusColor}15`,
                            }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                            {statusLabel}
                            <Icons.ChevronDown className="w-3 h-3 opacity-50 ml-1" />
                        </button>

                        {/* Dropdown Menu */}
                        {statusOpen && (
                            <div className={`absolute top-full right-0 mt-2 w-40 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl py-1 z-30 animate-in fade-in slide-in-from-top-1`}>
                                {(config?.statusOptions || []).map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleStatusUpdate(option.id)}
                                        className={`w-full text-left px-3 py-2 text-xs ${theme.canvas.hover} flex items-center gap-2 transition-colors ${theme.text.secondary} hover:${theme.text.primary}`}
                                    >
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
                                        {option.label}
                                        {option.id === project.status && <Icons.Check className="w-3 h-3 ml-auto text-emerald-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <h3 className={`text-xl font-bold ${theme.text.primary} mb-1 leading-tight group-hover:text-red-500 transition-colors`}>
                    {displayTitle}
                </h3>
                <p className={`text-sm ${theme.text.secondary} font-medium`}>
                    {project.metadata?.client_name}
                </p>

                {/* Progress Bar */}
                {project.stats && project.stats.total_tasks > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.text.secondary}`}>Progress</span>
                            <span className={`text-[10px] font-bold ${theme.text.secondary}`}>
                                {project.stats.completed_tasks}/{project.stats.total_tasks}
                            </span>
                        </div>
                        <div className={`h-1.5 w-full ${theme.canvas.bg} rounded-full overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${project.stats.percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className={clsx(
                                    "h-full rounded-full",
                                    project.stats.percentage === 100 ? "bg-emerald-500" : "bg-purple-500"
                                )}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* --- PREVIEW FOOTER (Expansion Zone) --- */}
            {!expanded && (
                <div
                    onClick={() => setExpanded(true)}
                    className={`px-4 py-3 md:px-6 md:py-4 mt-auto border-t ${theme.canvas.border} flex items-center justify-between text-xs ${theme.text.secondary} cursor-pointer group/footer hover:${theme.canvas.hover} transition-colors`}
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Vertical-specific badges */}
                        {project.vertical === 'knots' && project.metadata?.side && (
                            <span className={clsx(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                project.metadata.side === 'Groom' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                                project.metadata.side === 'Bride' && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                                project.metadata.side === 'Both' && "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            )}>
                                {project.metadata.side === 'Both' ? '👫 Both' : project.metadata.side === 'Groom' ? '👔 Groom' : '👗 Bride'}
                            </span>
                        )}
                        {project.vertical === 'knots' && project.metadata?.religion && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${theme.canvas.card} ${theme.text.secondary} border ${theme.canvas.border}`}>
                                {project.metadata.religion}
                            </span>
                        )}
                        {project.vertical === 'pluto' && project.metadata?.occasion_type && (
                            <span className={clsx(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                project.metadata.occasion_type === 'Birthday' && "bg-pink-500/20 text-pink-400 border border-pink-500/30",
                                project.metadata.occasion_type === 'Baptism' && "bg-sky-500/20 text-sky-400 border border-sky-500/30",
                                project.metadata.occasion_type === 'Newborn' && "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            )}>
                                {project.metadata.occasion_type === 'Birthday' ? '🎂 Birthday' :
                                    project.metadata.occasion_type === 'Baptism' ? '✝️ Baptism' :
                                        project.metadata.occasion_type === 'Newborn' ? '👶 Newborn' : project.metadata.occasion_type}
                            </span>
                        )}
                        {/* Next event info */}
                        {nextEvent ? (
                            <>
                                <span className="text-red-400 font-medium flex items-center gap-1">
                                    <Icons.Calendar className="w-3 h-3" />
                                    {new Date(nextEvent.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <span>•</span>
                                <span className={theme.text.secondary}>{nextEvent.type}</span>
                            </>
                        ) : (
                            <span>No upcoming events</span>
                        )}
                    </div>
                    <button className={`p-1.5 hover:${theme.canvas.hover} rounded-full ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}>
                        <Icons.ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}


            {/* --- EXPANDED TIMELINE --- */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={(e) => e.stopPropagation()} // Optional: keep card open if clicking inside detail area? Or let it close? User might expect clicking detailed BG to do nothing or close. 
                        // Actually better to let click-to-close work unless interaction needed. 
                        // But wait, if I click inside the content (e.g. to copy text), I don't want it to collapse.
                        // The current design has a explicit "Close" button.
                        // So clicking inside the Expanded Content (the timeline) should probably NOT collapse the card.
                        // So adding stopPropagation to the AnimatePresence div is smart.
                        className={`overflow-hidden ${theme.canvas.bg} cursor-default`} // Change cursor to default inside
                    >
                        <div className={`px-4 py-4 md:px-6 md:py-6 border-t ${theme.canvas.border} relative`}>
                            {/* Vertical Line */}
                            <div className={`absolute left-[2.25rem] md:left-[3.25rem] top-4 md:top-6 bottom-4 md:bottom-6 w-px ${theme.canvas.border}`} />

                            <div className="space-y-6">
                                {project.events?.length > 0 ? (
                                    project.events.map((evt, idx) => {
                                        const dateObj = formatDate(evt.start_date);
                                        const isPast = new Date(evt.start_date) < new Date();

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="relative flex items-center gap-4 group/evt"
                                            >
                                                {/* Date Box */}
                                                <div className="w-10 flex flex-col items-center text-center shrink-0">
                                                    <span className={`text-[10px] font-bold ${theme.text.secondary} uppercase leading-none`}>{dateObj.month}</span>
                                                    <span className={clsx("text-lg font-bold leading-none", isPast ? `${theme.text.secondary}` : theme.text.primary)}>
                                                        {dateObj.day}
                                                    </span>
                                                </div>

                                                {/* Timeline Dot */}
                                                <div className={clsx(
                                                    "w-3 h-3 rounded-full border-2 z-10 shrink-0 transition-colors duration-300",
                                                    isPast ? `${theme.canvas.bg} ${theme.canvas.border}` : `${theme.canvas.bg} border-red-500 group-hover/evt:bg-red-500`
                                                )} />

                                                {/* Event Details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={clsx("text-sm font-bold truncate", isPast ? `${theme.text.secondary}` : theme.text.primary)}>
                                                        {evt.type}
                                                    </p>
                                                    <p className={`text-xs ${theme.text.secondary} truncate`}>
                                                        {evt.venue_name || "TBD"}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <p className={`text-xs ${theme.text.secondary} text-center py-2`}>No timeline available.</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex border-t ${theme.canvas.border}`}>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }}
                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                View Details
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors border-l ${theme.canvas.border} cursor-pointer`}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default ProjectCard;
