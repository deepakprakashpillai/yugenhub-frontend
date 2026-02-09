import { formatDistanceToNow } from 'date-fns';
import { Icons } from '../Icons';

const RecentActivity = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <div className="text-zinc-500 text-sm italic p-4 text-center">No recent activity.</div>;
    }

    return (
        <div className="space-y-0">
            {activities.map((activity) => (
                <div key={activity.id} className="group flex gap-4 text-sm border-b border-zinc-800/50 p-4 hover:bg-zinc-800/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-0 items-start">
                    <div className="mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-400 group-hover:border-zinc-700 group-hover:text-purple-400 transition-colors shrink-0 shadow-sm">
                        <Icons.Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                            <p className="text-zinc-200 font-bold truncate pr-2">
                                {activity.action}
                            </p>
                            <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                        </div>

                        <div className="text-xs text-zinc-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800/50 rounded-md text-zinc-400">
                                <Icons.User className="w-3 h-3" />
                                {activity.user_name}
                            </span>
                            <span className="text-zinc-700">•</span>
                            <span className="font-mono text-zinc-400 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800/50">
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
