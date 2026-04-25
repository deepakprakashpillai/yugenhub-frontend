import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../Icons';
import { format, isToday, isTomorrow } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    urgent: { label: 'Urgent', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    high:   { label: 'High',   cls: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
    medium: { label: 'Medium', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
    low:    { label: 'Low',    cls: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' },
};

const STATUS_CONFIG = {
    todo:        { label: 'To Do',       cls: 'text-zinc-400' },
    in_progress: { label: 'In Progress', cls: 'text-blue-400' },
    review:      { label: 'Review',      cls: 'text-purple-400' },
    blocked:     { label: 'Blocked',     cls: 'text-red-400' },
};

function formatDue(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
}

function avatarColor(name) {
    const colors = [
        'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
        'bg-amber-500', 'bg-pink-500', 'bg-cyan-500',
    ];
    let hash = 0;
    for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
}

// ─── My Workload (unchanged, for "me" scope) ─────────────────────────────────

const MyWorkload = ({ stats }) => {
    const { theme } = useTheme();
    return (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className={`p-2 md:p-4 rounded-xl ${theme.canvas.card} border ${theme.canvas.border} flex flex-col items-center justify-center text-center`}>
                <span className={`text-2xl md:text-3xl font-bold ${theme.text.primary} mb-0.5 md:mb-1`}>{stats?.due_today || 0}</span>
                <span className={`text-[10px] md:text-xs ${theme.text.secondary} font-medium`}>Due Today</span>
            </div>
            <div className={`p-2 md:p-4 rounded-xl ${theme.canvas.card} border ${theme.canvas.border} flex flex-col items-center justify-center text-center`}>
                <span className={`text-2xl md:text-3xl font-bold ${theme.text.primary} mb-0.5 md:mb-1`}>{stats?.due_week || 0}</span>
                <span className={`text-[10px] md:text-xs ${theme.text.secondary} font-medium`}>This Week</span>
            </div>
            <div className={`p-2 md:p-4 rounded-xl border flex flex-col items-center justify-center text-center ${stats?.overdue > 0 ? 'bg-red-500/10 border-red-500/30' : `${theme.canvas.card} ${theme.canvas.border}`}`}>
                <span className={`text-2xl md:text-3xl font-bold mb-0.5 md:mb-1 ${stats?.overdue > 0 ? 'text-red-500' : theme.text.secondary}`}>
                    {stats?.overdue || 0}
                </span>
                <span className={`text-[10px] md:text-xs font-medium ${stats?.overdue > 0 ? 'text-red-400' : theme.text.secondary}`}>
                    Overdue
                </span>
            </div>
        </div>
    );
};

// ─── Task Detail Modal ────────────────────────────────────────────────────────

const TeamMemberModal = ({ member, onClose }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    if (!member) return null;

    const handleTaskClick = (task) => {
        if (task.project_id) {
            navigate(`/projects/${task.project_id}`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${theme.canvas.border}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColor(member.user_name)} flex items-center justify-center text-sm font-bold text-white`}>
                            {member.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className={`font-semibold ${theme.text.primary}`}>{member.user_name}</p>
                            <p className={`text-xs capitalize ${theme.text.secondary}`}>{member.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs">
                            {member.stats.overdue > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
                                    {member.stats.overdue} Overdue
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full ${theme.canvas.bg} border ${theme.canvas.border} ${theme.text.secondary}`}>
                                {member.stats.total} Tasks
                            </span>
                        </div>
                        <button onClick={onClose} className={`p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary} transition-colors`}>
                            <Icons.X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Task list */}
                <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
                    {member.tasks.length === 0 ? (
                        <p className={`text-center py-8 text-sm ${theme.text.secondary}`}>No active tasks</p>
                    ) : (
                        member.tasks.map(task => {
                            const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                            const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                            const dueLabel = formatDue(task.due_date);
                            const clickable = !!task.project_id;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleTaskClick(task)}
                                    className={`p-3 rounded-xl border transition-colors ${
                                        task.is_overdue
                                            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                            : `${theme.canvas.bg} ${theme.canvas.border} hover:${theme.canvas.hover}`
                                    } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${task.is_overdue ? 'text-red-400' : theme.text.primary}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                {task.project_code && (
                                                    <span className={`text-xs ${theme.text.secondary} flex items-center gap-1`}>
                                                        <Icons.Briefcase className="w-3 h-3" />
                                                        {task.project_code}
                                                        {task.project_name && task.project_name !== task.project_code && (
                                                            <span className="hidden sm:inline">· {task.project_name}</span>
                                                        )}
                                                    </span>
                                                )}
                                                <span className={`text-xs ${status.cls}`}>{status.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priority.cls}`}>
                                                {priority.label}
                                            </span>
                                            {dueLabel && (
                                                <span className={`text-[10px] ${task.is_overdue ? 'text-red-400' : theme.text.secondary}`}>
                                                    {dueLabel}
                                                </span>
                                            )}
                                            {clickable && <Icons.ArrowRight className="w-3.5 h-3.5 text-zinc-500" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Team Workload Grid ───────────────────────────────────────────────────────

const TeamWorkload = ({ members }) => {
    const { theme } = useTheme();
    const [selected, setSelected] = useState(null);

    if (!members || members.length === 0) {
        return (
            <div className={`flex items-center gap-3 p-3 rounded-lg bg-green-900/10 border border-green-900/20`}>
                <Icons.Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">Team load balanced — no active tasks.</span>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map(member => {
                    const hasOverdue = member.stats.overdue > 0;
                    const isHeavy = member.stats.total >= 8 || hasOverdue;
                    const color = avatarColor(member.user_name);

                    return (
                        <button
                            key={member.user_id}
                            onClick={() => setSelected(member)}
                            className={`text-left p-3.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.99] ${
                                hasOverdue
                                    ? 'bg-red-500/5 border-red-500/25 hover:bg-red-500/10'
                                    : `${theme.canvas.bg} ${theme.canvas.border} hover:${theme.canvas.hover}`
                            }`}
                        >
                            {/* Avatar + name row */}
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                                    {member.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${theme.text.primary}`}>{member.user_name}</p>
                                    <p className={`text-[10px] capitalize ${theme.text.secondary}`}>{member.role}</p>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    hasOverdue
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : `${theme.canvas.card} ${theme.canvas.border} ${theme.text.secondary}`
                                }`}>
                                    {member.stats.overdue > 0 ? `${member.stats.overdue} Overdue` : 'No overdue'}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary}`}>
                                    {member.stats.total} tasks
                                </span>
                                {member.stats.urgent > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                                        {member.stats.urgent} urgent
                                    </span>
                                )}
                            </div>

                            {/* Mini progress bar */}
                            <div className={`mt-2.5 h-1 rounded-full ${theme.canvas.card} overflow-hidden`}>
                                <div
                                    className={`h-full rounded-full transition-all ${hasOverdue ? 'bg-red-500' : isHeavy ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, (member.stats.in_progress / Math.max(member.stats.total, 1)) * 100)}%` }}
                                />
                            </div>
                            <p className={`text-[10px] mt-1 ${theme.text.secondary}`}>
                                {member.stats.in_progress} in progress
                            </p>
                        </button>
                    );
                })}
            </div>

            {selected && (
                <TeamMemberModal member={selected} onClose={() => setSelected(null)} />
            )}
        </>
    );
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────

const WorkloadSection = ({ type = 'me', data }) => {
    const { theme } = useTheme();

    return (
        <div className={`${theme.canvas.card} backdrop-blur-xl border ${theme.canvas.border} rounded-3xl p-6 h-full`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={`text-lg font-bold ${theme.text.primary} flex items-center gap-2`}>
                        {type === 'me' ? 'Task Pressure' : 'Team Load'}
                    </h2>
                    <p className={`${theme.text.secondary} text-xs mt-1`}>
                        {type === 'me' ? 'Your delivery velocity' : 'Top 6 members by workload · click to view tasks'}
                    </p>
                </div>
                {type === 'me' ? <Icons.Zap className="w-5 h-5 text-amber-500" /> : <Icons.Users className="w-5 h-5 text-blue-500" />}
            </div>

            {type === 'me' ? <MyWorkload stats={data} /> : <TeamWorkload members={data} />}
        </div>
    );
};

export default WorkloadSection;
