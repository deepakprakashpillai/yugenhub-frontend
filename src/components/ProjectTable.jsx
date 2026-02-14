import { useState, Fragment } from 'react';
import clsx from 'clsx';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import api from '../api/axios';
import { toast } from 'sonner';

const ProjectTable = ({ projects, onRefresh }) => {
    const [expandedId, setExpandedId] = useState(null);
    const { config } = useAgencyConfig();

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!projects.length) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/50 text-xs uppercase font-medium text-zinc-500 border-b border-zinc-800">
                    <tr>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Title / Client</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Next Event</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {projects.map((project) => {
                        const nextEvent = project.events?.find(e => new Date(e.start_date) > new Date()) || null;
                        const isExpanded = expandedId === project._id;

                        return (
                            <Fragment key={project._id}>
                                <tr
                                    onClick={() => toggleExpand(project._id)}
                                    className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-mono text-zinc-300">
                                        {project.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{project.title}</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            <span>{project.metadata?.client_name}</span>
                                            {project.vertical === 'knots' && project.metadata?.religion && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 border border-zinc-700/50">
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
                                                            <option key={opt.id} value={opt.id} className="bg-zinc-900 text-zinc-300">
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
                                            <div className="flex items-center gap-2 text-zinc-300">
                                                <Icons.Calendar className="w-3 h-3 text-red-500" />
                                                <span>{new Date(nextEvent.start_date).toLocaleDateString()}</span>
                                                <span className="text-xs opacity-50">({nextEvent.type})</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            className={clsx(
                                                "p-2 hover:bg-zinc-800 rounded-full transition-all duration-300",
                                                isExpanded ? "rotate-90 text-white" : "text-zinc-500 hover:text-white"
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
                                            <td colSpan="5" className="p-0 border-b border-zinc-800/30 bg-zinc-900/20 shadow-inner">
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                                                        {/* SECTION 1: Events */}
                                                        <div className="col-span-2 space-y-3">
                                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Event Schedule</h4>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {project.events?.map((evt, idx) => (
                                                                    <div key={idx} className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-lg flex items-start gap-3">
                                                                        <div className="bg-zinc-800 p-2 rounded-md">
                                                                            <Icons.Calendar className="w-4 h-4 text-zinc-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-white">{evt.type}</p>
                                                                            <p className="text-xs text-zinc-500">{new Date(evt.start_date).toLocaleDateString()} • {evt.venue_name || 'TBD'}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!project.events || project.events.length === 0) && (
                                                                    <p className="text-sm text-zinc-600 italic">No events found.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* SECTION 2: Quick Actions or Info */}
                                                        <div className="border-l border-zinc-800 pl-6 space-y-4">
                                                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Client Details</h4>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-white font-medium">{project.metadata?.client_name || "Unknown"}</p>
                                                                <p className="text-xs text-zinc-500">Source: {project.lead_source}</p>
                                                                <p className="text-xs text-zinc-500">ID: {project._id}</p>
                                                            </div>

                                                            <button className="w-full mt-4 bg-white text-black py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
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
