import { useEffect, useState } from 'react';
import api from '../api/axios';
 
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ label, value, trend, delay }) => {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`${theme.canvas.card} backdrop-blur-md border ${theme.canvas.border} p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group ${theme.canvas.hover} transition-colors`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
                <div className="w-16 h-16 bg-gradient-to-br from-white to-transparent rounded-full blur-xl" />
            </div>
            <span className={`text-2xl md:text-4xl font-black ${theme.text.primary} mb-0.5 md:mb-1 tracking-tighter`}>{value}</span>
            <span className={`${theme.text.secondary} text-[10px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest`}>{label}</span>
            {trend && (
                <span className="text-emerald-500 text-[10px] md:text-xs mt-1 md:mt-2 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {trend}
                </span>
            )}
        </motion.div>
    );
};

const StatsHeader = ({ vertical, type = 'project', view = 'all' }) => {
    const [stats, setStats] = useState({
        total: 0, active: 0, ongoing: 0, this_month: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let url = '';
                let params = {};

                if (vertical) {
                    url = '/projects/stats/overview';
                    params = { vertical };
                } else if (type === 'clients') {
                    url = '/clients/stats';
                } else if (type === 'associates') {
                    url = '/associates/stats';
                }

                const res = await api.get(url, { params });
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [vertical, type]);

    if (loading) return null;

    // --- Vertical/Project Logic ---
    if (vertical || type === 'project') {
        // HIDE stats for Completed/Cancelled views
        if (view === 'completed' || view === 'cancelled') {
            return null;
        }

        return (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                <StatCard label="Active" value={stats.active} delay={0} />
                <StatCard label="Ongoing" value={stats.ongoing} delay={0.1} />
                <StatCard label="This Month" value={stats.this_month} delay={0.2} />
            </div>
        );
    }

    // --- Clients Logic ---
    if (type === 'clients') {
        return (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                <StatCard label="Total Clients" value={stats.total} delay={0} />
                <StatCard label="Active Clients" value={stats.active} delay={0.1} />
                <StatCard label="New This Month" value={stats.this_month} delay={0.2} />
            </div>
        );
    }

    // --- Associates Logic ---
    if (type === 'associates') {
        return (
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                <StatCard label="Total Team" value={stats.total} delay={0} />
                <StatCard label="Active Members" value={stats.active} delay={0.1} />
                <StatCard label="Joined This Month" value={stats.this_month} delay={0.2} />
            </div>
        );
    }

    return null;
};

export default StatsHeader;
