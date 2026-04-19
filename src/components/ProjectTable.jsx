import { useState, Fragment, useMemo } from 'react';
import clsx from 'clsx';
import { Icons } from './Icons';
import { FieldDisplayCompact } from '../config/fieldTypes';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import Table from './ui/Table';

const ProjectTable = ({ projects, onRefresh }) => {
    const [expandedId, setExpandedId] = useState(null);
    const { config } = useAgencyConfig();
    const { theme } = useTheme();

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Determine vertical config for dynamic columns
    // Use the first project's vertical to determine columns (all projects on a page share the same vertical)
    const verticalConfig = useMemo(() => {
        if (!projects.length) return null;
        const vId = projects[0]?.vertical;
        return config?.verticals?.find(v => v.id === vId) || null;
    }, [projects, config]);

    const tableFields = verticalConfig?.table_fields || [];
    const allFields = verticalConfig?.fields || [];
    const hasEvents = verticalConfig?.has_events !== false;

    // Resolve title from template
    const resolveTitle = (project) => {
        const meta = project.metadata || {};
        const template = verticalConfig?.title_template;

        if (template) {
            let resolved = template;
            resolved = resolved.replace(/\{(\w+)\}/g, (match, fieldName) => {
                const val = meta[fieldName];
                if (val && typeof val === 'string') return val.split(' ').slice(0, 2).join(' ');
                if (val) return String(val);
                return '';
            });
            resolved = resolved.trim().replace(/^[&\s]+|[&\s]+$/g, '').replace(/\s*&\s*&\s*/g, ' & ');
            if (resolved && resolved !== '&' && resolved.trim()) return resolved;
        }

        return project.title || meta.client_name || 'Untitled Project';
    };

    // Get dynamic column definitions
    const dynamicCols = tableFields
        .map(fieldName => allFields.find(f => f.name === fieldName))
        .filter(Boolean);

    // Total columns for colSpan
    const totalCols = 3 + dynamicCols.length + (hasEvents ? 1 : 0) + 1; // Code + Title + Status + dynamic + event? + Actions

    if (!projects.length) return null;

    return (
        <Table>
            <Table.Head>
                <tr>
                    <Table.HeadCell>Code</Table.HeadCell>
                    <Table.HeadCell>Title / Client</Table.HeadCell>
                    <Table.HeadCell>Status</Table.HeadCell>
                    {dynamicCols.map(col => (
                        <Table.HeadCell key={col.name}>{col.label}</Table.HeadCell>
                    ))}
                    {hasEvents && <Table.HeadCell>Next Event</Table.HeadCell>}
                    <Table.HeadCell className="text-right">Actions</Table.HeadCell>
                </tr>
            </Table.Head>
            <Table.Body>
                    {projects.map((project) => {
                        const nextEvent = project.events?.find(e => new Date(e.start_date) > new Date()) || null;
                        const isExpanded = expandedId === project._id;
                        const meta = project.metadata || {};

                        return (
                            <Fragment key={project._id}>
                                <Table.Row
                                    onClick={() => toggleExpand(project._id)}
                                    className="group cursor-pointer"
                                >
                                    <Table.Cell className={`font-mono ${theme.text.primary}`}>
                                        {project.code}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className={`font-medium ${theme.text.primary}`}>{resolveTitle(project)}</div>
                                        <div className={`text-xs ${theme.text.secondary}`}>
                                            {meta.client_name}
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {(() => {
                                            const sc = config?.statusOptions?.find(s => s.id === project.status);
                                            const color = sc?.color || '#71717a';

                                            const handleStatusChange = async (e) => {
                                                const newStatus = e.target.value;
                                                e.stopPropagation();
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
                                                    <Icons.ChevronDown
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50"
                                                        style={{ color: color }}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </Table.Cell>

                                    {dynamicCols.map(col => (
                                        <Table.Cell key={col.name} className={theme.text.primary}>
                                            {meta[col.name]
                                                ? (FieldDisplayCompact({ field: col, value: meta[col.name] }) || <span className={theme.text.secondary}>-</span>)
                                                : <span className={theme.text.secondary}>-</span>
                                            }
                                        </Table.Cell>
                                    ))}

                                    {hasEvents && (
                                        <Table.Cell>
                                            {nextEvent ? (
                                                <div className={`flex items-center gap-2 ${theme.text.primary}`}>
                                                    <Icons.Calendar className="w-3 h-3 text-red-500" />
                                                    <span>{new Date(nextEvent.start_date).toLocaleDateString()}</span>
                                                    <span className="text-xs opacity-50">({nextEvent.type})</span>
                                                </div>
                                            ) : (
                                                <span className={`${theme.text.secondary}`}>-</span>
                                            )}
                                        </Table.Cell>
                                    )}

                                    <Table.Cell className="text-right">
                                        <button
                                            className={clsx(
                                                `p-2 hover:${theme.canvas.hover} rounded-full transition-all duration-300`,
                                                isExpanded ? `rotate-90 ${theme.text.primary}` : `${theme.text.secondary} hover:${theme.text.primary}`
                                            )}
                                        >
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Table.Cell>
                                </Table.Row>

                                {/* EXPANDED ROW */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={totalCols} className={`p-0 border-b ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-20 shadow-inner`}>
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                                                        {/* SECTION 1: Events (if event-based) or Metadata */}
                                                        <div className="col-span-2 space-y-3">
                                                            {hasEvents ? (
                                                                <>
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
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Project Details</h4>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        {(verticalConfig?.fields || []).map(f => {
                                                                            const val = meta[f.name];
                                                                            if (!val) return null;
                                                                            return (
                                                                                <div key={f.name}>
                                                                                    <p className={`text-[10px] uppercase tracking-wider ${theme.text.secondary} font-medium`}>{f.label}</p>
                                                                                    <p className={`text-sm ${theme.text.primary}`}>{f.type === 'date' ? new Date(val).toLocaleDateString() : val}</p>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* SECTION 2: Quick Actions or Info */}
                                                        <div className={`border-l ${theme.canvas.border} pl-6 space-y-4`}>
                                                            <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Client Details</h4>
                                                            <div className="space-y-1">
                                                                <p className={`text-sm ${theme.text.primary} font-medium`}>{meta.client_name || "Unknown"}</p>
                                                                <p className={`text-xs ${theme.text.secondary}`}>Source: {project.lead_source}</p>
                                                                <p className={`text-xs ${theme.text.secondary}`}>ID: {project._id}</p>
                                                            </div>

                                                            <button className={`w-full mt-4 ${theme.canvas.active} py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity`}>
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
            </Table.Body>
        </Table>
    );
};

export default ProjectTable;
