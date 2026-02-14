import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Icons } from '../Icons';
import AttentionSection from './AttentionSection';
import WorkloadSection from './WorkloadSection';
import VerticalList from './VerticalList';
import EventTimeline from './EventTimeline';
import RecentActivity from './RecentActivity';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [attention, setAttention] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/dashboard/attention?scope=global'),
                    api.get('/dashboard/workload?scope=global'),
                    api.get('/dashboard/pipeline'),
                    api.get('/dashboard/schedule'),
                    api.get('/dashboard/activity')
                ]);

                if (results[0].status === 'fulfilled') setAttention(results[0].value.data);
                if (results[1].status === 'fulfilled') setWorkload(results[1].value.data);
                if (results[2].status === 'fulfilled') setPipeline(results[2].value.data);
                if (results[3].status === 'fulfilled') setSchedule(results[3].value.data);
                if (results[4].status === 'fulfilled') setActivity(results[4].value.data);

            } catch (err) {
                console.error("Admin Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Attention Section Skeleton */}
            <div className="h-48 w-full bg-zinc-900/40 rounded-3xl border border-zinc-800/50 p-6 space-y-4">
                <div className="flex gap-4">
                    <div className="h-12 w-12 bg-zinc-800 rounded-xl animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 h-64 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 animate-pulse" />
                <div className="h-64 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 animate-pulse" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Attention Required (Full Width) */}
            <AttentionSection items={attention} scope="global" />

            {/* 2. Middle Section: Workload & Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <WorkloadSection type="team" data={workload} />
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Icons.BarChart className="w-5 h-5 text-purple-500" />
                        Active Projects
                    </h2>
                    <VerticalList data={pipeline} />
                </div>
            </div>

            {/* 3. Bottom Section: Schedule & Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 hover:border-zinc-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Upcoming Schedule
                            </h2>
                            <p className="text-zinc-500 text-sm mt-1">Next 14 days of events and shoots</p>
                        </div>
                    </div>
                    <EventTimeline events={schedule} />
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 h-fit sticky top-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Recent Activity
                        </h2>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <RecentActivity activities={activity} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
