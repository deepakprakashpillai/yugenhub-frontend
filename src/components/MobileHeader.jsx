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

    const pageTitle = PAGE_TITLES[location.pathname] || 'Yugen';


    const handleSearchClick = () => {
        // Trigger Command Palette via keyboard event
        // We dispatch on document because CommandPalette listens on document
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    };

    return (
        <header
            className={`md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b backdrop-blur-xl ${theme.canvas.sidebar} ${theme.canvas.border}`}
            style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
        >
            {/* Left: Hamburger */}
            <button
                onClick={onMenuToggle}
                className={`p-2 -ml-1 rounded-xl ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all`}
                aria-label="Open navigation menu"
            >
                <Icons.Menu className="w-5 h-5" />
            </button>

            {/* Center: Page title */}
            <span className={`text-sm font-bold uppercase tracking-widest ${theme.text.primary}`}>
                {pageTitle}
            </span>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {/* Search / Command Palette trigger */}
                <button
                    onClick={handleSearchClick}
                    className={`p-2 rounded-xl ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all`}
                    aria-label="Search"
                >
                    <Search className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <button
                    onClick={() => navigate('/notifications')}
                    className={`p-2 rounded-xl ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all relative`}
                    aria-label="Notifications"
                >
                    <Bell className="w-4 h-4" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;

