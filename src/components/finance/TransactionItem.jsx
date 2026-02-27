import React from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES } from '../../constants';

const TransactionItem = ({ transaction, theme, associates, projects, config }) => {
    const isIncome = transaction.type === TRANSACTION_TYPES.INCOME;
    const isTransfer = transaction.type === TRANSACTION_TYPES.TRANSFER;

    let colorClass, Icon, amountColor;
    if (isIncome) {
        colorClass = 'text-green-600 bg-green-50';
        Icon = ArrowUpRight;
        amountColor = 'text-green-600';
    } else if (isTransfer) {
        colorClass = 'text-blue-600 bg-blue-50';
        Icon = RefreshCw;
        amountColor = 'text-blue-600';
    } else {
        colorClass = 'text-red-600 bg-red-50';
        Icon = ArrowDownRight;
        amountColor = 'text-red-600';
    }

    // Resolve Details
    const isPayout = transaction.category === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT;
    let displayTitle = transaction.category;
    let project = projects?.find(p => p.id === transaction.project_id || p._id === transaction.project_id);
    let projectName = null;
    let vertical = null;
    let associateName = null;

    // 1. Resolve Project & Vertical (config-driven)
    if (project) {
        vertical = project.vertical;
        const verticalConfig = config?.verticals?.find(v => v.id === vertical);
        const template = verticalConfig?.title_template;
        const meta = project.metadata || {};

        projectName = meta.project_type || 'Project';
        if (template) {
            let resolved = template.replace(/\{(\w+)\}/g, (_, fn) => {
                const val = meta[fn];
                return val && typeof val === 'string' ? val.split(' ')[0] : (val ? String(val) : '');
            }).trim().replace(/^[&\s]+|[&\s]+$/g, '');
            if (resolved && resolved !== '&') projectName = resolved;
        }
    }

    // 2. Resolve Associate Details (if Payout)
    if (isPayout && transaction.associate_id) {
        const associate = associates?.find(a => a.id === transaction.associate_id || a._id === transaction.associate_id);
        if (associate) {
            let role = '';
            // Check event assignments
            if (project?.events) {
                for (const evt of project.events) {
                    if (evt.assignments) {
                        const assign = evt.assignments.find(a => a.associate_id === transaction.associate_id);
                        if (assign) { role = assign.role; break; }
                    }
                }
            }
            // Also check project-level assignments
            if (!role && project?.assignments) {
                const assign = project.assignments.find(a => a.associate_id === transaction.associate_id);
                if (assign) role = assign.role;
            }
            associateName = `${associate.name} ${role ? `(${role})` : ''}`;
            displayTitle = associateName;
        }
    }

    // Helper for Vertical Badge (config-driven colors)
    const getVerticalBadge = (v) => {
        if (!v) return null;
        const verticalConfig = config?.verticals?.find(vc => vc.id === v);
        const label = verticalConfig?.label || v;
        // Generate a consistent color from vertical index
        const colorPalette = [
            'bg-rose-100 text-rose-700 border-rose-200',
            'bg-sky-100 text-sky-700 border-sky-200',
            'bg-indigo-100 text-indigo-700 border-indigo-200',
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-amber-100 text-amber-700 border-amber-200',
            'bg-emerald-100 text-emerald-700 border-emerald-200',
            'bg-cyan-100 text-cyan-700 border-cyan-200',
        ];
        const idx = config?.verticals?.findIndex(vc => vc.id === v) ?? 0;
        const style = colorPalette[idx % colorPalette.length] || 'bg-gray-100 text-gray-700 border-gray-200';
        return (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${style} ml-2`}>
                {label}
            </span>
        );
    };

    return (
        <div className={`p-3 sm:p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} hover:shadow-md transition-shadow group`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-3 sm:gap-4">
                    {/* Icon Box */}
                    <div className={`p-2 sm:p-3 rounded-xl h-fit ${colorClass}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    {/* Content */}
                    <div>
                        {/* Title Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold text-sm sm:text-base ${theme.text.primary}`}>
                                {displayTitle}
                            </h4>
                            {vertical && getVerticalBadge(vertical)}
                            {transaction.subcategory && !isPayout && (
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 ${theme.text.secondary}`}>
                                    {transaction.subcategory}
                                </span>
                            )}
                        </div>

                        {/* Subtitle / Project */}
                        {projectName && (
                            <div className="flex items-center gap-1 mt-0.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                <span>{projectName}</span>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className={`text-[10px] sm:text-xs mt-1 sm:mt-1.5 flex flex-wrap items-center gap-1 sm:gap-2 ${theme.text.secondary}`}>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="capitalize">{transaction.source}</span>
                        </div>
                    </div>
                </div>

                {/* Amount Section */}
                <div className="text-right">
                    <p className={`text-sm sm:text-lg font-bold ${amountColor}`}>
                        {isIncome ? '+' : '-'} ₹{transaction.amount.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TransactionItem;

