import { useTheme } from '../context/ThemeContext';
import { Icons } from './Icons';
import clsx from 'clsx';

const stats = [
    { key: 'overdue', label: 'Overdue', icon: Icons.AlertTriangle, isCritical: true },
    { key: 'blocked', label: 'Blocked', icon: Icons.Ban },
    { key: 'in_progress', label: 'In Progress', icon: Icons.Timer },
    { key: 'review', label: 'In Review', icon: Icons.Eye },
    { key: 'todo', label: 'To Do', icon: Icons.Circle },
    { key: 'done', label: 'Done', icon: Icons.CheckCircle },
    { key: 'unassigned', label: 'Unassigned', icon: Icons.UserCircle },
];

const TaskSummaryBar = ({ summary = {}, groups = {} }) => {
    const { theme } = useTheme();

    const getValue = (key) => {
        if (key === 'overdue' || key === 'unassigned') return summary[key] || 0;
        return groups[key]?.count || 0;
    };

    return (
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-2 sm:pb-4 mb-2 scrollbar-hide px-1">
            {/* eslint-disable-next-line */}
            {stats.map(({ key, label, icon: Icon, isCritical }) => {
                const val = getValue(key);
                if (val === 0 && !isCritical) return null; // Optional: Hide zero counts to reduce clutter? Or keep for consistency. 
                // Let's keep them but dim if 0

                return (
                    <div
                        key={key}
                        className={clsx(
                            "flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all",
                            isCritical && val > 0 ? "text-red-500" : (val === 0 ? "opacity-40" : theme.text.secondary)
                        )}
                    >
                        <Icon className={clsx("w-3 h-3 sm:w-3.5 sm:h-3.5", isCritical && val > 0 ? "text-red-500" : theme.text.secondary)} />
                        <span className={clsx("font-bold tabular-nums text-xs sm:text-sm", isCritical && val > 0 ? "text-red-500" : theme.text.primary)}>{val}</span>
                        <span className="hidden sm:inline opacity-70">{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default TaskSummaryBar;
