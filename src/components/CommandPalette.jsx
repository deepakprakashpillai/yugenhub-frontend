import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Settings,
    LayoutDashboard,
    Search,
    Plus,
    Users,
    Minus,
    Briefcase,
    Zap
} from "lucide-react";
import { Icons } from "./Icons";
import { useAgencyConfig } from "../context/AgencyConfigContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { config } = useAgencyConfig();
    const { user } = useAuth();
    const { theme, themeMode } = useTheme(); // Get themeMode explicitly

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    if (!theme) return null;

    // Direct JS logic for theme styles to avoid reliance on 'dark:' selector in portals
    const isDark = themeMode === 'dark';

    // Helper for List Items
    const ListItem = ({ icon: Icon, label, shortcut, color, onClick, value }) => {
        return (
            <Command.Item
                value={value || label}
                onSelect={() => runCommand(onClick)}
                // Manually apply dark styles based on isDark check
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group
                    ${isDark ? 'text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white' : 'text-zinc-600 aria-selected:bg-zinc-100 aria-selected:text-zinc-900'}
                    aria-selected:translate-x-1
                `}
            >
                <div
                    className={`w-5 h-5 flex items-center justify-center transition-all duration-200 group-aria-selected:scale-110`}
                    style={{
                        color: (color) ? color : undefined
                    }}
                >
                    <Icon
                        size={16}
                        // Manually theme icon colors
                        className={`transition-colors duration-200 
                            ${color ? '' : (isDark ? 'text-zinc-500 group-aria-selected:text-white' : 'text-zinc-400 group-aria-selected:text-zinc-900')}
                        `}
                        style={{ color: color ? color : undefined }}
                    />
                </div>
                <span className={`flex-1 font-medium`}>{label}</span>
                {shortcut && (
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'} font-mono`}>
                        {shortcut}
                    </span>
                )}
            </Command.Item>
        );
    };

    const isGridMode = search === "";

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-5xl z-[9999] flex flex-col gap-4 p-4"
            contentClassName="bg-transparent shadow-none border-none p-0"
        >
            {/* 1. Detached Search Bar */}
            <div className={`
                flex items-center px-6 py-5 rounded-2xl shadow-xl border
                backdrop-blur-xl
                ${isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200/50'}
            `}>
                <Search className={`w-6 h-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mr-4`} />
                <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search for anything..."
                    className={`w-full bg-transparent border-none text-2xl font-light tracking-tight focus:outline-none 
                        ${isDark ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}
                    `}
                    autoFocus
                />
                <div className="hidden md:flex gap-2 items-center ml-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded border 
                        ${isDark ? 'text-zinc-500 bg-zinc-900 border-zinc-800' : 'text-zinc-400 bg-zinc-100 border-zinc-200'}
                    `}>ESC</span>
                </div>
            </div>

            {/* 2. Detached Results Grid */}
            <div className={`
                rounded-2xl shadow-2xl border overflow-hidden
                backdrop-blur-xl
                transition-all duration-300 ease-out origin-top
                ${isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-zinc-200/50'}
                ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'}
            `}>
                <Command.List className="p-8 scrollbar-hide overflow-y-auto max-h-[60vh]">
                    <Command.Empty className={`py-12 text-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        No results found.
                    </Command.Empty>

                    <div className={isGridMode ? 'grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12' : 'space-y-1'}>
                        {/* Essential Sections */}
                        <div className="flex flex-col">
                            {isGridMode && (
                                <div className={`mb-4 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                    <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>Essentials</span>
                                </div>
                            )}
                            <Command.Group heading={!isGridMode ? "Navigation" : undefined} className={isGridMode ? "space-y-1" : ""}>
                                <ListItem icon={LayoutDashboard} label="Dashboard" onClick={() => navigate("/")} value="app-dashboard" />
                                <ListItem icon={Settings} label="Settings" onClick={() => navigate("/settings")} value="app-settings" />
                                <ListItem icon={Users} label="Clients" onClick={() => navigate("/clients")} value="app-clients" />
                            </Command.Group>
                        </div>

                        {/* Tasks Section */}
                        <div className="flex flex-col">
                            {isGridMode && (
                                <div className={`mb-4 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                    <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>Tasks & Calendar</span>
                                </div>
                            )}
                            <Command.Group heading={!isGridMode ? "Tasks" : undefined} className={isGridMode ? "space-y-1" : ""}>
                                <ListItem icon={Plus} label="New Task" onClick={() => navigate("/tasks?action=new")} color="#3b82f6" value="tasks-new" />
                                <ListItem icon={LayoutDashboard} label="My Tasks" onClick={() => navigate("/tasks?view=mine")} value="tasks-mine" />
                                <ListItem icon={Calendar} label="Calendar View" onClick={() => navigate("/tasks?view=calendar")} value="tasks-calendar" />
                            </Command.Group>
                        </div>

                        {/* Finance Section */}
                        {(user?.role === 'admin' || user?.role === 'owner') && (
                            <div className="flex flex-col">
                                {isGridMode && (
                                    <div className={`mb-4 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                        <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>Finance</span>
                                    </div>
                                )}
                                <Command.Group heading={!isGridMode ? "Finance" : undefined} className={isGridMode ? "space-y-1" : ""}>
                                    <ListItem
                                        icon={Plus}
                                        label="Add Income"
                                        onClick={() => navigate("/finance?action=new_transaction&type=income")}
                                        color="#22c55e"
                                        value="finance-add-income"
                                    />
                                    <ListItem
                                        icon={Minus}
                                        label="Add Expense"
                                        onClick={() => navigate("/finance?action=new_transaction&type=expense")}
                                        color="#ef4444"
                                        value="finance-add-expense"
                                    />
                                    <ListItem icon={LayoutDashboard} label="Finance Overview" onClick={() => navigate("/finance")} value="finance-overview" />
                                </Command.Group>
                            </div>
                        )}

                        {/* Vertical Logic */}
                        {config?.verticals?.map(vertical => (
                            <div key={vertical.id} className="flex flex-col">
                                {isGridMode && (
                                    <div className={`mb-4 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center gap-2`}>
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vertical.color }} />
                                        <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}>{vertical.label}</span>
                                    </div>
                                )}
                                <Command.Group heading={!isGridMode ? vertical.label : undefined} className={isGridMode ? "space-y-1" : ""}>
                                    <ListItem
                                        icon={Icons.Plus}
                                        label={`New Project`}
                                        onClick={() => navigate(`/${vertical.id}?action=new`)}
                                        color={vertical.color}
                                        value={`${vertical.id}-new-project`}
                                    />
                                    <ListItem
                                        icon={LayoutDashboard}
                                        label="Dashboard"
                                        onClick={() => navigate(`/${vertical.id}`)}
                                        value={`${vertical.id}-dashboard`}
                                    />
                                    {(user?.role === 'admin' || user?.role === 'owner') && (
                                        <>
                                            <ListItem
                                                icon={Plus}
                                                label="Add Income"
                                                onClick={() => navigate(`/finance?action=new_transaction&type=income&vertical=${vertical.id}`)}
                                                color="#22c55e"
                                                value={`${vertical.id}-add-income`}
                                            />
                                            <ListItem
                                                icon={Minus}
                                                label="Add Expense"
                                                onClick={() => navigate(`/finance?action=new_transaction&type=expense&vertical=${vertical.id}`)}
                                                color="#ef4444"
                                                value={`${vertical.id}-add-expense`}
                                            />
                                        </>
                                    )}
                                </Command.Group>
                            </div>
                        ))}
                    </div>

                </Command.List>
            </div>
        </Command.Dialog>
    );
}
