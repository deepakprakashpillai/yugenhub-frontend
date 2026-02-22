import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  LayoutDashboard,
  ClipboardList,
  IndianRupee,
  LogOut,
  MoreVertical,
  Code,
  Bell,
  Calendar,
  Settings,
  X
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { AGENCY_CONFIG } from '../config';
import { useAuth } from '../context/AuthContext';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../constants';

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, notificationCount } = useAuth();
  const { config: agencyConfig } = useAgencyConfig();
  const { theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const currentPath = location.pathname;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && onClose) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!theme) return null;

  // Use dynamic config from context, fall back to static AGENCY_CONFIG
  const currentConfig = agencyConfig || AGENCY_CONFIG;

  const opsItems = [
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  if (user?.role === ROLES.ADMIN || user?.role === ROLES.OWNER) {
    opsItems.push({ id: 'finance', label: 'Finance', icon: IndianRupee });
  }

  const managementItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'associates', label: 'Associates', icon: Briefcase },
  ];

  const renderNavGroup = (title, items, isVertical = false) => (
    <div className="mb-6">
      <p className={(theme.text?.label || "") + " px-4 mb-1.5 md:mb-3 text-[10px] md:text-xs"}>{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const accent = theme.accents?.[item.id] || theme.accents?.default;
          const Icon = item.icon;
          const isActivePath = currentPath === `/${item.id}`;

          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              style={{
                backgroundColor: isActivePath ? `${accent.primary}1A` : undefined,
                color: isActivePath ? accent.primary : undefined,
                boxShadow: isActivePath ? `0 0 20px ${accent.glow}` : 'none',
                border: isActivePath ? `1px solid ${accent.primary}44` : '1px solid transparent'
              }}
              className={`
                ${theme.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
                ${isActivePath
                  ? `font-black`
                  : `${theme.canvas.inactive} ${theme.canvas.hover} group`}
              `}
            >
              {isVertical ? (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accent.primary }}
                />
              ) : (
                <Icon size={isMobile ? 14 : 16} className={isActivePath ? 'text-inherit' : `${theme.text.secondary} group-hover:${theme.text.primary}`} />
              )}
              <span className="text-xs md:text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <aside className={`${isMobile ? 'w-[80vw] max-w-[320px]' : 'w-64'} border-r ${theme.canvas?.border || "border-zinc-800"} flex flex-col h-screen ${isMobile ? '' : 'sticky top-0'} ${theme.canvas?.sidebar || "bg-black"}`}>

      <div className="p-6 pb-4 flex items-center justify-between">
        <h1 className={(theme.text?.heading || "") + ` ${theme.text.primary}`}>
          {currentConfig.brand?.name || AGENCY_CONFIG?.brand?.name}
          <span style={{ color: theme.accents?.default?.primary }}>
            {currentConfig.brand?.suffix || AGENCY_CONFIG?.brand?.suffix}
          </span>
        </h1>
        {isMobile && (
          <button
            onClick={onClose}
            className={`p-3 rounded-xl ${theme.text.secondary} hover:${theme.text.primary} active:scale-95 transition-all outline-none md:min-h-[48px] min-h-[48px] flex items-center justify-center`}
            aria-label="Close navigation menu"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide pt-2">
        {/* DASHBOARD LINK */}
        <div className="mb-6">
          <NavLink
            to="/"
            style={{
              backgroundColor: currentPath === '/' ? `${theme.accents?.default?.primary}1A` : undefined, // ~10% opacity
              color: currentPath === '/' ? theme.accents?.default?.primary : undefined,
              boxShadow: currentPath === '/' ? `0 0 20px ${theme.accents?.default?.glow}` : 'none',
              border: currentPath === '/' ? `1px solid ${theme.accents?.default?.primary}44` : '1px solid transparent'
            }}
            className={`
              ${theme.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
              ${currentPath === '/'
                ? `font-black`
                : `${theme.canvas.inactive} ${theme.canvas.hover} group`}
            `}
          >
            <LayoutDashboard size={isMobile ? 14 : 16} className={currentPath === '/' ? 'text-inherit' : `${theme.text.secondary} group-hover:${theme.text.primary}`} />
            <span className="text-xs md:text-sm">DASHBOARD</span>
          </NavLink>
        </div>

        {renderNavGroup("Verticals", currentConfig.verticals || AGENCY_CONFIG?.verticals || [], true)}
        {renderNavGroup("Operations", opsItems)}
        {renderNavGroup("Directory", managementItems)}
      </nav>

      {/* NOTIFICATIONS & SETTINGS - Fixed at bottom of nav area */}
      <div className={`px-4 mb-4 md:mb-2 pt-2 border-t ${theme.canvas.border} space-y-2 md:space-y-1`}>
        <button
          onClick={() => {
            navigate('/notifications');
            if (isMobile) onClose();
          }}
          className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl ${theme.canvas.inactive} ${theme.canvas.hover} group transition-all`}
        >
          <Bell size={isMobile ? 14 : 16} className={`${theme.text.secondary} group-hover:${theme.text.primary}`} />
          <span className={`${theme.text?.nav || ""} text-xs md:text-sm`}>{"NOTIFICATIONS"}</span>
          {notificationCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {notificationCount}
            </span>
          )}
        </button>
        <NavLink
          to="/settings"
          style={{
            backgroundColor: currentPath === '/settings' ? `${theme.accents?.default?.primary}1A` : undefined,
            color: currentPath === '/settings' ? theme.accents?.default?.primary : undefined,
            boxShadow: currentPath === '/settings' ? `0 0 20px ${theme.accents?.default?.glow}` : 'none',
            border: currentPath === '/settings' ? `1px solid ${theme.accents?.default?.primary}44` : '1px solid transparent'
          }}
          className={`
            ${theme.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
            ${currentPath === '/settings'
              ? `font-black`
              : `${theme.canvas.inactive} ${theme.canvas.hover} group`}
          `}
        >
          <Settings size={isMobile ? 14 : 16} className={currentPath === '/settings' ? 'text-inherit' : `${theme.text.secondary} group-hover:${theme.text.primary}`} />
          <span className="text-xs md:text-sm">SETTINGS</span>
        </NavLink>
      </div>

      {/* USER FOOTER */}
      <div className={`p-4 ${theme.canvas.card} border-t ${theme.canvas.border} mt-auto relative`} ref={userMenuRef}>

        {/* User Menu Popup */}
        {showUserMenu && (
          <div className={`absolute bottom-full left-4 right-4 mb-2 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50`}>
            <button
              onClick={() => navigate('/dev-login')}
              className={`w-full px-4 py-3 text-left text-xs font-bold text-amber-500 ${theme.canvas.hover} flex items-center gap-2 transition-colors`}
            >
              <Code size={14} />
              DEV LOGIN
            </button>
            <div className={`h-px ${theme.canvas.border}`} />
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-3 text-left text-xs font-bold text-red-400 ${theme.canvas.hover} flex items-center gap-2 transition-colors`}
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center gap-3 w-full p-2 rounded-xl ${theme.canvas.hover} transition-colors text-left relative cursor-pointer`}
        >
          <div className={`w-9 h-9 rounded-full ${theme.canvas.card} border ${theme.canvas.border} flex items-center justify-center text-[10px] font-black ${theme.text.primary} shrink-0`}>
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className={`text-[10px] font-black uppercase ${theme.text.primary} truncate`}>{user?.name || 'User'}</p>
            <p className={`text-[9px] ${theme.text.secondary} italic truncate`}>{user?.email || 'No Email'}</p>
          </div>
          <MoreVertical size={14} className={`${theme.text.secondary} shrink-0`} />
        </button>
      </div>
    </aside>
  );

  // Desktop: render sidebar inline
  if (!isMobile) {
    return sidebarContent;
  }

  // Mobile: render as overlay drawer
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full z-[100]"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}