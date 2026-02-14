import { useState, Fragment } from 'react';
import clsx from 'clsx';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const ProjectTable = ({ projects, onRefresh }) => {
    const [expandedId, setExpandedId] = useState(null);
    const { config } = useAgencyConfig();
    const { theme } = useTheme();

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!projects.length) return null;

    return (
        <div className={`overflow-hidden rounded-xl border ${theme.canvas.border} ${theme.canvas.bg} backdrop-blur-sm bg-opacity-30`}>
            <table className={`w-full text-left text-sm ${theme.text.secondary}`}>
                <thead className={`${theme.canvas.card} text-xs uppercase font-medium ${theme.text.secondary} border-b ${theme.canvas.border}`}>
                    <tr>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Title / Client</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Next Event</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${theme.canvas.border}`}>
                    {projects.map((project) => {
                        const nextEvent = project.events?.find(e => new Date(e.start_date) > new Date()) || null;
                        const isExpanded = expandedId === project._id;

                        return (
                            <Fragment key={project._id}>
                                <tr
                                    onClick={() => toggleExpand(project._id)}
                                    className={`hover:${theme.canvas.hover} transition-colors group cursor-pointer`}
                                >
                                    <td className={`px-6 py-4 font-mono ${theme.text.primary}`}>
                                        {project.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-medium ${theme.text.primary}`}>{project.title}</div>
                                        <div className={`text-xs ${theme.text.secondary} flex items-center gap-2`}>
                                            <span>{project.metadata?.client_name}</span>
                                            {project.vertical === 'knots' && project.metadata?.religion && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${theme.canvas.card} ${theme.text.secondary} border ${theme.canvas.border}`}>
                                                    {project.metadata.religion}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const sc = config?.statusOptions?.find(s => s.id === project.status);
                                            const color = sc?.color || '#71717a';
                                            // const label = sc?.label || project.status; // Label shown in select

                                            const handleStatusChange = async (e) => {
                                                const newStatus = e.target.value;
                                                e.stopPropagation(); // Prevent row expand
                                                if (newStatus === project.status) return;

                                                try {
                                                    await api.patch(`/projects/${project._id}`, { status: newStatus });
                                                    const statusLabel = config?.statusOptions?.find(s => s.id === newStatus)?.label || newStatus;
                                                    toast.success(`Status updated to ${statusLabel}`);
                                                    if (onRefresh) onRefresh();
                                                } catch (err) {
                                                    console.error("Failed to update status", err);
                                                    toast.error("Failed to update status");
                                                }
                                            };

                                            return (
                                                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={project.status}
                                                        onChange={handleStatusChange}
                                                        className="appearance-none text-xs px-2 py-1 pr-6 rounded-full font-medium capitalize border cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
                                                        style={{
                                                            borderColor: `${color}55`,
                                                            color: color,
                                                            backgroundColor: `${color}20`,
                                                        }}
                                                    >
                                                        {(config?.statusOptions || []).map(opt => (
                                                            <option key={opt.id} value={opt.id} className={`${theme.canvas.card} ${theme.text.primary}`}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {/* Custom Chevron for Select */}
                                                    <Icons.ChevronDown
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50"
                                                        style={{ color: color }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {nextEvent ? (
                                            <div className={`flex items-center gap-2 ${theme.text.primary}`}>
                                                <Icons.Calendar className="w-3 h-3 text-red-500" />
                                                <span>{new Date(nextEvent.start_date).toLocaleDateString()}</span>
                                                <span className="text-xs opacity-50">({nextEvent.type})</span>
                                            </div>
                                        ) : (
                                            <span className={`${theme.text.secondary}`}>-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            className={clsx(
                                                `p-2 hover:${theme.canvas.hover} rounded-full transition-all duration-300`,
                                                isExpanded ? `rotate-90 ${theme.text.primary}` : `${theme.text.secondary} hover:${theme.text.primary}`
                                            )}
                                        >
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>

                                {/* EXPANDED ROW */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan="5" className={`p-0 border-b ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-20 shadow-inner`}>
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                                                        {/* SECTION 1: Events */}
                                                        <div className="col-span-2 space-y-3">
                                                            <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Event Schedule</h4>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {project.events?.map((evt, idx) => (
                                                                    <div key={idx} className={`${theme.canvas.card} border ${theme.canvas.border} p-3 rounded-lg flex items-start gap-3`}>
                                                                        <div className={`${theme.canvas.bg} p-2 rounded-md`}>
                                                                            <Icons.Calendar className={`w-4 h-4 ${theme.text.secondary}`} />
                                                                        </div>
                                                                        <div>
                                                                            <p className={`text-sm font-medium ${theme.text.primary}`}>{evt.type}</p>
                                                                            <p className={`text-xs ${theme.text.secondary}`}>{new Date(evt.start_date).toLocaleDateString()} • {evt.venue_name || 'TBD'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!project.events || project.events.length === 0) && (
                                                                    <p className={`text-sm ${theme.text.secondary} italic`}>No events found.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* SECTION 2: Quick Actions or Info */}
                                                        <div className={`border-l ${theme.canvas.border} pl-6 space-y-4`}>
                                                            <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Client Details</h4>
                                                            <div className="space-y-1">
                                                                <p className={`text-sm ${theme.text.primary} font-medium`}>{project.metadata?.client_name || "Unknown"}</p>
                                                                <p className={`text-xs ${theme.text.secondary}`}>Source: {project.lead_source}</p>
                                                                <p className={`text-xs ${theme.text.secondary}`}>ID: {project._id}</p>
                                                            </div>

                                                            <button className={`w-full mt-4 ${theme.canvas.fg || 'bg-white'} ${theme.text.inverse || 'text-black'} py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity`}>
                                                                Manage Project
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>

                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ProjectTable;
