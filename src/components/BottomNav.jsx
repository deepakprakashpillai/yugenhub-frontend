import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Home, CheckSquare, Search, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav({ onMenuClick }) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Re-use accent colors logic
    const getAccent = (path) => {
        if (path === '/') return theme.accents?.default;
        if (path === '/tasks') return theme.accents?.tasks || theme.accents?.default;
        // Search and Menu use default accent
        return theme.accents?.default;
    };

    const handleSearchClick = () => {
        // Trigger Command Palette
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    };

    const navItems = [
        { id: 'dashboard', path: '/', icon: Home, label: 'Home' },
        { id: 'tasks', path: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'search', action: handleSearchClick, icon: Search, label: 'Search' },
        { id: 'menu', action: onMenuClick, icon: Menu, label: 'Menu' },
    ];

    return (
        <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${theme.canvas.border}`}
            style={{
                backgroundColor: theme.mode === 'light' ? 'rgba(253, 244, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
                WebkitBackdropFilter: 'blur(20px)',
                backdropFilter: 'blur(20px)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <nav className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = item.path === location.pathname;
                    const accent = getAccent(item.path);
                    const Icon = item.icon;

                    if (item.action) {
                        return (
                            <button
                                key={item.id}
                                onClick={item.action}
                                className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
                            >
                                <Icon size={24} className={theme.text.secondary} />
                                <span className={`text-[10px] font-medium ${theme.text.secondary}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
                        >
                            <Icon
                                size={24}
                                style={{ color: isActive ? accent?.primary : undefined }}
                                className={!isActive ? theme.text.secondary : ''}
                            />
                            <span
                                className={`text-[10px] font-medium ${!isActive ? theme.text.secondary : ''}`}
                                style={{ color: isActive ? accent?.primary : undefined }}
                            >
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-[1px] w-8 h-[2px] rounded-b-full"
                                    style={{
                                        backgroundColor: accent?.primary,
                                        boxShadow: `0 2px 8px ${accent?.glow}`
                                    }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
