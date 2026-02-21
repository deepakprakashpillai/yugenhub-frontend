import React, { useState, useEffect, useMemo } from 'react';
import { getInvoices } from '../../api/finance';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { FileText, Plus, Trash, Eye, Edit2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { toast } from 'sonner';

const InvoiceItem = ({ invoice, theme, onEditInvoice, projectCode, isHistory = false }) => {
    const isQuote = invoice.invoice_no?.startsWith('QT');

    return (
        <div className={`p-4 rounded-lg border ${theme.canvas.card} ${theme.canvas.border} flex justify-between items-center ${isHistory ? 'bg-gray-50/50 dark:bg-zinc-800/30 ml-8 border-l-4 border-l-gray-300 dark:border-l-zinc-600' : 'bg-white dark:bg-zinc-800'}`}>
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${isQuote ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FileText size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className={`font-medium ${theme.text.primary}`}>{invoice.invoice_no}</p>
                        {isQuote && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">QUOTE</span>
                        )}
                        {isHistory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-500">HISTORY</span>}
                    </div>
                    <p className={`text-xs ${theme.text.secondary}`}>
                        {new Date(invoice.created_at).toLocaleDateString()} • {projectCode && <span className="font-medium text-indigo-500 mr-1">{projectCode} •</span>} {invoice.line_items?.length || 0} items
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-right mr-4">
                    <p className={`font-bold ${theme.text.primary}`}>₹ {invoice.total_amount.toLocaleString('en-IN')}</p>
                </div>

                {/* Actions: Only Edit */}
                <button
                    onClick={() => onEditInvoice(invoice)}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg tooltip"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
            </div>
        </div>
    );
};

const FinanceInvoices = ({ refreshTrigger, onNewInvoice, onEditInvoice }) => {
    const { theme } = useTheme();
    const [invoices, setInvoices] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState(new Set());

    const loadData = async () => {
        try {
            setLoading(true);
            const [invRes, projRes] = await Promise.all([
                getInvoices(),
                getProjects({ limit: 100 }, true)
            ]);
            setInvoices(invRes);
            setProjects(Array.isArray(projRes) ? projRes : (projRes.data || []));
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const toggleHistory = (projectId) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    // Grouping Logic
    const groupedInvoices = useMemo(() => {
        const groups = {};
        const unassigned = [];

        // 1. Sort all by date desc first
        const sortedInvoices = [...invoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // 2. Group
        sortedInvoices.forEach(inv => {
            if (inv.project_id) {
                if (!groups[inv.project_id]) groups[inv.project_id] = [];
                groups[inv.project_id].push(inv);
            } else {
                unassigned.push(inv);
            }
        });

        // 3. Convert to array for rendering
        const projectGroups = Object.keys(groups).map(pid => {
            const project = projects.find(p => p.id === pid || p._id === pid);
            return {
                projectId: pid,
                project: project,
                latest: groups[pid][0],
                history: groups[pid].slice(1) // All except first
            };
        });

        // Sort groups by latest invoice date
        projectGroups.sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at));

        return { projectGroups, unassigned };
    }, [invoices, projects]);


    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Quotes & Invoices</h2>
                </div>
                <button
                    onClick={onNewInvoice}
                    className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors`}
                >
                    <Plus className="w-4 h-4" /> New Quote / Invoice
                </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">

                {/* Project Groups */}
                {groupedInvoices.projectGroups.map(group => {
                    const isExpanded = expandedProjects.has(group.projectId);
                    return (
                        <div key={group.projectId} className="space-y-2">
                            {/* Latest Item */}
                            <div className="relative">
                                <InvoiceItem
                                    invoice={group.latest}
                                    theme={theme}
                                    onEditInvoice={onEditInvoice}
                                    projectCode={group.project?.code}
                                />
                                {group.history.length > 0 && (
                                    <button
                                        onClick={() => toggleHistory(group.projectId)}
                                        className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border shadow-sm transition-all z-10 ${theme.canvas.card} ${theme.canvas.border} ${theme.text.secondary} hover:text-indigo-600`}
                                    >
                                        <History size={12} />
                                        {isExpanded ? 'Hide History' : `View History (${group.history.length})`}
                                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                )}
                            </div>

                            {/* History Items */}
                            {isExpanded && (
                                <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                                    {group.history.map(hist => (
                                        <InvoiceItem
                                            key={hist.id}
                                            invoice={hist}
                                            theme={theme}
                                            onEditInvoice={onEditInvoice}
                                            projectCode={group.project?.code}
                                            isHistory={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Unassigned Invoices */}
                {groupedInvoices.unassigned.length > 0 && (
                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-zinc-700 mt-6">
                        <h4 className={`text-sm font-medium ${theme.text.secondary} mb-3`}>Unassigned / General</h4>
                        <div className="space-y-2">
                            {groupedInvoices.unassigned.map(inv => (
                                <InvoiceItem
                                    key={inv.id}
                                    invoice={inv}
                                    theme={theme}
                                    onEditInvoice={onEditInvoice}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {invoices.length === 0 && !loading && (
                    <p className={`text-center py-10 ${theme.text.secondary}`}>No invoices found</p>
                )}
            </div>
        </div>
    );
};

export default FinanceInvoices;
