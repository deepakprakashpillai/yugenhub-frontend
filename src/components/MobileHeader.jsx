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

const MobileHeader = ({ onMenuToggle }) => {
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

    const handleSearchClick = () => {
        // Trigger Command Palette via keyboard event
        // We dispatch on document because CommandPalette listens on document
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    };

    return (
        <header
            className={`md:hidden sticky top-0 z-50 flex items-center justify-between h-[72px] px-4 border-b backdrop-blur-xl ${theme.canvas.sidebar} ${theme.canvas.border} transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
            style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
        >
            {/* Left: Hamburger */}
            <button
                type="button"
                onClick={onMenuToggle}
                className={`relative z-50 p-3 -ml-2 rounded-xl cursor-pointer pointer-events-auto ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all`}
                aria-label="Open navigation menu"
            >
                <Icons.Menu className="w-7 h-7 pointer-events-none" />
            </button>

            {/* Center: Page title */}
            <span className={`text-sm font-bold uppercase tracking-widest ${theme.text.primary}`}>
                {pageTitle}
            </span>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {/* Search / Command Palette trigger */}
                <button
                    type="button"
                    onClick={handleSearchClick}
                    className={`relative z-50 p-3 rounded-xl cursor-pointer pointer-events-auto ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all`}
                    aria-label="Search"
                >
                    <Search className="w-5 h-5 pointer-events-none" />
                </button>

                {/* Notifications */}
                <button
                    type="button"
                    onClick={() => navigate('/notifications')}
                    className={`relative z-50 p-3 rounded-xl cursor-pointer pointer-events-auto ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all`}
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5 pointer-events-none" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;

