import React from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES, VERTICALS } from '../../constants';

const TransactionItem = ({ transaction, theme, associates, projects }) => {
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

    // 1. Resolve Project & Vertical
    if (project) {
        vertical = project.vertical; // 'knots', 'pluto', 'robos', etc.

        // Project Name Logic
        projectName = project.metadata?.project_type || 'Project';
        if (vertical === VERTICALS.KNOTS) {
            const groom = project.metadata?.groom_name || '';
            const bride = project.metadata?.bride_name || '';
            projectName = (groom || bride) ? `${groom} & ${bride}` : 'Wedding';
        } else if (vertical === VERTICALS.PLUTO && project.metadata?.child_name) {
            projectName = project.metadata.child_name;
        }
    }

    // 2. Resolve Associate Details (if Payout)
    if (isPayout && transaction.associate_id) {
        const associate = associates?.find(a => a.id === transaction.associate_id || a._id === transaction.associate_id);
        if (associate) {
            let role = '';
            if (project?.events) {
                for (const evt of project.events) {
                    if (evt.assignments) {
                        const assign = evt.assignments.find(a => a.associate_id === transaction.associate_id);
                        if (assign) {
                            role = assign.role;
                            break;
                        }
                    }
                }
            }
            associateName = `${associate.name} ${role ? `(${role})` : ''}`;
            displayTitle = associateName; // Override category title with Name
        }
    }

    // Helper for Vertical Badge
    // Helper for Vertical Badge
    const getVerticalBadge = (v) => {
        if (!v) return null;
        const styles = {
            [VERTICALS.KNOTS]: 'bg-rose-100 text-rose-700 border-rose-200',
            [VERTICALS.PLUTO]: 'bg-sky-100 text-sky-700 border-sky-200',
            [VERTICALS.ROBO]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            [VERTICALS.RAYDIUM]: 'bg-purple-100 text-purple-700 border-purple-200',
            // default
            [VERTICALS.GENERAL]: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        const style = styles[v] || styles[VERTICALS.GENERAL];
        return (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${style} ml-2`}>
                {v}
            </span>
        );
    };

    return (
        <div className={`p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} hover:shadow-md transition-shadow group`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    {/* Icon Box */}
                    <div className={`p-3 rounded-xl h-fit ${colorClass}`}>
                        <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div>
                        {/* Title Row */}
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-base ${theme.text.primary}`}>
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
                        <div className={`text-xs mt-1.5 flex items-center gap-2 ${theme.text.secondary}`}>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="capitalize">{transaction.source}</span>
                        </div>
                    </div>
                </div>

                {/* Amount Section */}
                <div className="text-right">
                    <p className={`text-lg font-bold ${amountColor}`}>
                        {isIncome ? '+' : '-'} ₹{transaction.amount.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TransactionItem;
