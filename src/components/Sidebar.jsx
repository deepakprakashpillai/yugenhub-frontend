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
  Settings
} from 'lucide-react';
import { AGENCY_CONFIG } from '../config';
import { THEME_CONFIG } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import api from '../api/axios';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, notificationCount } = useAuth();
  const { config: agencyConfig } = useAgencyConfig();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!THEME_CONFIG) return null;

  // Use dynamic config from context, fall back to static AGENCY_CONFIG
  const currentConfig = agencyConfig || AGENCY_CONFIG;

  const opsItems = [
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
  ];

  const managementItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'associates', label: 'Associates', icon: Briefcase },
  ];

  const renderNavGroup = (title, items, isVertical = false) => (
    <div className="mb-6">
      <p className={(THEME_CONFIG.text?.label || "") + " px-4 mb-3"}>{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const accent = THEME_CONFIG.accents?.[item.id] || THEME_CONFIG.accents?.default;
          const Icon = item.icon;
          const isActivePath = currentPath === `/${item.id}`;

          return (
            <NavLink
              key={item.id}
              to={`/${item.id}`}
              style={{
                boxShadow: isActivePath ? `0 0 20px ${accent.glow}` : 'none',
                border: isActivePath ? `1px solid ${accent.primary}44` : '1px solid transparent'
              }}
              className={`
                ${THEME_CONFIG.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
                ${isActivePath
                  ? 'bg-white text-black font-black'
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white group'}
              `}
            >
              {isVertical ? (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accent.primary }}
                />
              ) : (
                <Icon size={14} className={isActivePath ? 'text-black' : 'text-zinc-700 group-hover:text-zinc-400'} />
              )}
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className={`w-64 border-r ${THEME_CONFIG.canvas?.border || "border-zinc-800"} flex flex-col h-screen sticky top-0 ${THEME_CONFIG.canvas?.sidebar || "bg-black"}`}>

      <div className="p-6 pb-4">
        <h1 className={(THEME_CONFIG.text?.heading || "") + " text-white"}>
          {currentConfig.brand?.name || AGENCY_CONFIG?.brand?.name}
          <span style={{ color: THEME_CONFIG.accents?.default?.primary }}>
            {currentConfig.brand?.suffix || AGENCY_CONFIG?.brand?.suffix}
          </span>
        </h1>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto scrollbar-hide">
        {/* DASHBOARD LINK */}
        <div className="mb-6">
          <NavLink
            to="/"
            className={`
              ${THEME_CONFIG.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
              ${currentPath === '/'
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white group'}
            `}
          >
            <LayoutDashboard size={14} className={currentPath === '/' ? 'text-black' : 'text-zinc-700 group-hover:text-zinc-400'} />
            DASHBOARD
          </NavLink>
        </div>

        {renderNavGroup("Verticals", currentConfig.verticals || AGENCY_CONFIG?.verticals || [], true)}
        {renderNavGroup("Operations", opsItems)}
        {renderNavGroup("Directory", managementItems)}
      </nav>

      {/* NOTIFICATIONS & SETTINGS - Fixed at bottom of nav area */}
      <div className="px-4 mb-2 pt-2 border-t border-zinc-900 space-y-1">
        <button
          onClick={() => navigate('/notifications')}
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-900/50 hover:text-white group transition-all"
        >
          <Bell size={14} className="text-zinc-700 group-hover:text-zinc-400" />
          <span className={THEME_CONFIG.text?.nav || ""}>{"NOTIFICATIONS"}</span>
          {notificationCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {notificationCount}
            </span>
          )}
        </button>
        <NavLink
          to="/settings"
          className={`
            ${THEME_CONFIG.text?.nav || ""} flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all
            ${currentPath === '/settings'
              ? 'bg-white text-black font-black'
              : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white group'}
          `}
        >
          <Settings size={14} className={currentPath === '/settings' ? 'text-black' : 'text-zinc-700 group-hover:text-zinc-400'} />
          SETTINGS
        </NavLink>
      </div>

      {/* USER FOOTER */}
      <div className="p-4 bg-zinc-950/50 border-t border-zinc-900 mt-auto relative" ref={userMenuRef}>

        {/* User Menu Popup */}
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
            <button
              onClick={() => navigate('/dev-login')}
              className="w-full px-4 py-3 text-left text-xs font-bold text-amber-500 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
            >
              <Code size={14} />
              DEV LOGIN
            </button>
            <div className="h-px bg-zinc-800" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-zinc-900 transition-colors text-left relative cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-white shrink-0">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[9px] text-zinc-600 italic truncate">{user?.email || 'No Email'}</p>
          </div>
          <MoreVertical size={14} className="text-zinc-600 shrink-0" />
        </button>
      </div>
    </aside>
  );
}