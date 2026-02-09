import { Icons } from '../Icons';

const MyWorkload = ({ stats }) => (
    <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">{stats?.due_today || 0}</span>
            <span className="text-xs text-zinc-500 font-medium">Due Today</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">{stats?.due_week || 0}</span>
            <span className="text-xs text-zinc-500 font-medium">This Week</span>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${stats?.overdue > 0 ? 'bg-red-900/10 border-red-900/30' : 'bg-zinc-900/40 border-zinc-800'
            }`}>
            <span className={`text-3xl font-bold mb-1 ${stats?.overdue > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                {stats?.overdue || 0}
            </span>
            <span className={`text-xs font-medium ${stats?.overdue > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                Overdue
            </span>
        </div>
    </div>
);

const TeamWorkload = ({ alerts }) => (
    <div className="space-y-3">
        {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-900/10 border border-green-900/20">
                <Icons.Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">Team load balanced.</span>
            </div>
        ) : (
            alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-900/10 border border-red-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                            {alert.user_name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{alert.user_name}</p>
                            <p className="text-xs text-red-400">{alert.overload_summary}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

const WorkloadSection = ({ type = 'me', data }) => {
    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {type === 'me' ? 'Task Pressure' : 'Team Load Alerts'}
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1">
                        {type === 'me' ? 'Your delivery velocity' : 'Members needing assistance'}
                    </p>
                </div>
                {type === 'me' ? <Icons.Zap className="w-5 h-5 text-amber-500" /> : <Icons.Users className="w-5 h-5 text-blue-500" />}
            </div>

            {type === 'me' ? <MyWorkload stats={data} /> : <TeamWorkload alerts={data} />}
        </div>
    );
};

export default WorkloadSection;
