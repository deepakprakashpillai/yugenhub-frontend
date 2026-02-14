import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Icons } from '../Icons';
import AttentionSection from './AttentionSection';
import WorkloadSection from './WorkloadSection';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState';

import { useTheme } from '../../context/ThemeContext';

const MemberDashboard = ({ user }) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [attention, setAttention] = useState([]);
    const [workload, setWorkload] = useState({});
    const [myTasks, setMyTasks] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/dashboard/attention?scope=me'),
                    api.get('/dashboard/workload?scope=me'),
                    api.get(`/tasks?assigned_to=${user.id}&completed=false&sort_by=due_date&order=asc&limit=5`)
                ]);

                if (results[0].status === 'fulfilled') setAttention(results[0].value.data);
                if (results[1].status === 'fulfilled') setWorkload(results[1].value.data);
                if (results[2].status === 'fulfilled') {
                    const tasksResponse = results[2].value.data;
                    // Handle paginated response structure
                    setMyTasks(Array.isArray(tasksResponse) ? tasksResponse : tasksResponse.data || []);
                }

            } catch (err) {
                console.error("Member Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id]);

    if (loading) return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Attention Section Skeleton */}
            <div className={`h-48 w-full ${theme.canvas.card} rounded-3xl border ${theme.canvas.border} p-6 space-y-4`}>
                <div className="flex gap-4">
                    <div className={`h-12 w-12 ${theme.canvas.bg} rounded-xl animate-pulse`} />
                    <div className="space-y-2">
                        <div className={`h-6 w-48 ${theme.canvas.bg} rounded animate-pulse`} />
                        <div className={`h-4 w-32 ${theme.canvas.bg} rounded animate-pulse`} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`md:col-span-2 h-64 ${theme.canvas.card} rounded-3xl border ${theme.canvas.border} animate-pulse`} />
                <div className={`h-64 ${theme.canvas.card} rounded-3xl border ${theme.canvas.border} animate-pulse`} />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. My Focus (Attention) */}
            <AttentionSection items={attention} scope="me" />

            {/* 2. My Workload Stats */}
            <WorkloadSection type="me" data={workload} />

            {/* 3. My Upcoming Tasks */}
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-3xl p-8`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${theme.text.primary} flex items-center gap-2`}>
                        <Icons.List className="w-5 h-5 text-blue-500" />
                        My Next Tasks
                    </h2>
                    <Link to="/tasks" className={`text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}>
                        View All
                    </Link>
                </div>

                <div className="space-y-3">
                    {myTasks.length === 0 ? (
                        <EmptyState
                            title="No upcoming tasks"
                            message="You're all caught up! Enjoy your day."
                            icon={Icons.CheckCircle}
                            action={{
                                label: "Find Work",
                                to: "/tasks"
                            }}
                        />
                    ) : (
                        myTasks.map((task) => (
                            <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl ${theme.canvas.bg} border ${theme.canvas.border} hover:${theme.canvas.hover} transition-all`}>
                                <div>
                                    <h3 className={`font-medium ${theme.text.primary} mb-1`}>{task.title}</h3>
                                    <div className={`flex items-center gap-3 text-xs ${theme.text.secondary}`}>
                                        <span className="flex items-center gap-1">
                                            <Icons.Calendar className="w-3 h-3" />
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}
                                        </span>
                                        {task.status === 'urgent' && (
                                            <span className="text-red-400 font-bold">URGENT</span>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`
                                    ${task.priority === 'urgent' ? 'border-red-500/30 text-red-500' :
                                        task.priority === 'high' ? 'border-orange-500/30 text-orange-500' :
                                            `${theme.canvas.border} ${theme.text.secondary}`}
                                `}>
                                    {task.priority || 'Normal'}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </div >
        </div >

    );
};

export default MemberDashboard;
