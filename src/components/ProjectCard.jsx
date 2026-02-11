import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Icons } from './Icons';

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

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
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setExpanded(!expanded)}
            className={clsx(
                "relative border rounded-2xl overflow-hidden transition-colors duration-300 flex flex-col cursor-pointer",
                expanded ? "bg-zinc-900 border-zinc-700 shadow-2xl z-10" : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-600"
            )}
        >
            {/* Decorative Gradient Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* --- CARD HEADER (Always Visible) --- */}
            <div className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800/50">
                        {project.code}
                    </span>
                    {/* Status Dot */}
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide",
                        project.status === 'enquiry' && "border-zinc-700 text-zinc-400 bg-zinc-800/20",
                        project.status === 'booked' && "border-blue-900/50 text-blue-400 bg-blue-900/10",
                        project.status === 'booked' && "border-blue-900/50 text-blue-400 bg-blue-900/10",
                        project.status === 'ongoing' && "border-purple-900/50 text-purple-400 bg-purple-900/10",
                        project.status === 'completed' && "border-green-900/50 text-green-400 bg-green-900/10",
                        project.status === 'cancelled' && "border-red-900/50 text-red-400 bg-red-900/10",
                    )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full",
                            project.status === 'enquiry' ? "bg-zinc-400" :
                                project.status === 'booked' ? "bg-blue-400 animate-pulse" :
                                    project.status === 'ongoing' ? "bg-purple-400 animate-pulse" :
                                        project.status === 'completed' ? "bg-green-400" : "bg-red-400"
                        )} />
                        {project.status}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-red-500 transition-colors">
                    {displayTitle}
                </h3>
                <p className="text-sm text-zinc-400 font-medium">
                    {project.metadata?.client_name}
                </p>

                {/* Progress Bar */}
                {project.stats && project.stats.total_tasks > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Progress</span>
                            <span className="text-[10px] font-bold text-zinc-400">
                                {project.stats.completed_tasks}/{project.stats.total_tasks}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
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

            {/* --- PREVIEW FOOTER (Visible when Collapsed) --- */}
            {!expanded && (
                <div className="px-6 py-4 mt-auto border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
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
                                <span className="text-zinc-400">{nextEvent.type}</span>
                            </>
                        ) : (
                            <span>No upcoming events</span>
                        )}
                    </div>
                    <button className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-600 hover:text-white transition-colors">
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
                        className="overflow-hidden bg-zinc-950/30 cursor-default" // Change cursor to default inside
                    >
                        <div className="px-6 py-6 border-t border-zinc-800/50 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[3.25rem] top-6 bottom-6 w-px bg-zinc-800" />

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
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">{dateObj.month}</span>
                                                    <span className={clsx("text-lg font-bold leading-none", isPast ? "text-zinc-600" : "text-white")}>
                                                        {dateObj.day}
                                                    </span>
                                                </div>

                                                {/* Timeline Dot */}
                                                <div className={clsx(
                                                    "w-3 h-3 rounded-full border-2 z-10 shrink-0 transition-colors duration-300",
                                                    isPast ? "bg-zinc-900 border-zinc-700" : "bg-zinc-900 border-red-500 group-hover/evt:bg-red-500"
                                                )} />

                                                {/* Event Details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={clsx("text-sm font-bold truncate", isPast ? "text-zinc-500" : "text-white")}>
                                                        {evt.type}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {evt.venue_name || "TBD"}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-zinc-500 text-center py-2">No timeline available.</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-zinc-800/50">
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }}
                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                View Details
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                                className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white hover:bg-zinc-900/50 transition-colors border-l border-zinc-800/50 cursor-pointer"
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
