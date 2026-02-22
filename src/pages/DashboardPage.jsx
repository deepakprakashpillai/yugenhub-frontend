import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Icons } from '../components/Icons';
import { Link } from 'react-router-dom';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import MemberDashboard from '../components/dashboard/MemberDashboard';

const DashboardPage = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className={`relative min-h-screen ${theme.canvas.bg} ${theme.text.primary} selection:bg-purple-500/30 overflow-hidden`}>
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-purple-900/20 rounded-full blur-[128px] pointer-events-none -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
            <div className="fixed bottom-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-blue-900/10 rounded-full blur-[128px] pointer-events-none translate-x-1/2 translate-y-1/2 mix-blend-screen" />

            <div className="relative z-10 px-4 pt-4 md:p-8 pb-20 max-w-[1600px] mx-auto space-y-6 md:space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme.canvas.card} border ${theme.canvas.border} text-xs font-medium ${theme.text.secondary} mb-2 md:mb-4 backdrop-blur-md`}>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            System Operational
                        </div>
                        <h1 className={`text-3xl md:text-5xl font-black ${theme.text.primary} mb-2 tracking-tight`}>
                            {getGreeting()}, <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 animate-gradient-x bg-[length:200%_auto]">
                                {user?.name?.split(' ')[0]}
                            </span>
                        </h1>
                        <p className={`${theme.text.secondary} text-sm md:text-lg max-w-xl`}>
                            {user?.role === 'member'
                                ? "Your personal mission briefing."
                                : "Mission control ready."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* 'New Task' button removed as per request */}
                    </div>
                </div>

                {/* Dashboard Content Switched By Role */}
                {user?.role === 'member' ? (
                    <MemberDashboard user={user} />
                ) : (
                    <AdminDashboard />
                )}
            </div>
        </div>
    );
};



export default DashboardPage;
