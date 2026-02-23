import { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const PAGE_TITLES = {
    '/': 'Dashboard',
    '/tasks': 'Tasks',
    '/calendar': 'Calendar',
    '/notifications': 'Notifications',
    '/finance': 'Finance',
    '/clients': 'Clients',
    '/associates': 'Associates',
    '/settings': 'Settings',
};

const MobileHeader = () => {
    const { theme } = useTheme();
    const { notificationCount } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const container = document.getElementById('main-scroll-container');
        if (!container) return;

        const handleScroll = () => {
            const currentScrollY = container.scrollTop;

            // If we are at the top, always show
            if (currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Scrolling down -> hide
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up -> show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const pageTitle = PAGE_TITLES[location.pathname] || 'Yugen';

    return (
        <header
            className={`md:hidden sticky top-0 z-40 flex items-center justify-between h-[64px] px-4 border-b backdrop-blur-xl ${theme.canvas.sidebar} ${theme.canvas.border} transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
            style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
        >
            {/* Left Box (Invisible, just for flex balance) */}
            <div className="w-10"></div>

            {/* Center: Page title */}
            <span className={`text-sm font-bold uppercase tracking-widest ${theme.text.primary}`}>
                {pageTitle}
            </span>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 w-10 justify-end">
                {/* Notifications */}
                <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className={`relative z-50 p-3 rounded-xl cursor-pointer pointer-events-auto ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all w-[48px] h-[48px] flex items-center justify-center`}
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5 pointer-events-none" />
                    {notificationCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;

