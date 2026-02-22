import { useTheme } from '../../context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '../Icons';

const RecentActivity = ({ activities }) => {
    const { theme } = useTheme();

    if (!activities || activities.length === 0) {
        return <div className={`${theme.text.secondary} text-sm italic p-4 text-center`}>No recent activity.</div>;
    }

    return (
        <div className="space-y-0">
            {activities.map((activity) => (
                <div key={activity.id} className={`group flex gap-3 md:gap-4 text-sm border-b ${theme.canvas.border} p-3 md:p-4 hover:${theme.canvas.hover} transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-0 items-start`}>
                    <div className={`mt-1 p-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-full ${theme.text.secondary} group-hover:border-zinc-500 group-hover:text-purple-500 transition-colors shrink-0 shadow-sm`}>
                        <Icons.Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                            <p className={`${theme.text.primary} font-bold truncate pr-2`}>
                                {activity.action}
                            </p>
                            <span className={`text-[10px] ${theme.text.secondary} font-medium whitespace-nowrap`}>
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                        </div>

                        <div className={`text-xs ${theme.text.secondary} mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1`}>
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 ${theme.canvas.bg} rounded-md ${theme.text.secondary}`}>
                                <Icons.User className="w-3 h-3" />
                                {activity.user_name}
                            </span>
                            <span className={theme.text.secondary}>•</span>
                            <span className={`font-mono ${theme.text.secondary} ${theme.canvas.bg} px-1.5 py-0.5 rounded border ${theme.canvas.border}`}>
                                {activity.task_title || "Unknown Task"}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
export default RecentActivity;
