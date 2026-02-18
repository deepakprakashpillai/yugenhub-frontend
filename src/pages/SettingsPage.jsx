import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Workflow, Layers, Bell, Download, AlertTriangle,
    GripVertical, IndianRupee
} from 'lucide-react';
import { Icons } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Palette } from 'lucide-react';

// Import extracted sections
import OrgSection from '../components/settings/OrgSection';
import TeamSection from '../components/settings/TeamSection';
import WorkflowSection from '../components/settings/WorkflowSection';
import VerticalsSection from '../components/settings/VerticalsSection';

import NotificationsSection from '../components/settings/NotificationsSection';
import ExportSection from '../components/settings/ExportSection';
import TemplatesSection from '../components/settings/TemplatesSection';
import AppearanceSection from '../components/settings/AppearanceSection';
import FinanceSection from '../components/settings/FinanceSection';

const SECTIONS = [
    { id: 'org', label: 'Organisation', icon: Building2, roles: ['owner', 'admin', 'member'] },
    { id: 'team', label: 'Team', icon: Users, roles: ['owner', 'admin', 'member'] },
    { id: 'appearance', label: 'Appearance', icon: Palette, roles: ['owner', 'admin', 'member'] },
    { id: 'workflow', label: 'Workflow', icon: Workflow, roles: ['owner', 'admin', 'member'] },
    { id: 'verticals', label: 'Verticals', icon: Layers, roles: ['owner', 'admin'] },
    { id: 'templates', label: 'Templates', icon: Icons.LayoutTemplate, roles: ['owner', 'admin'] },
    { id: 'finance', label: 'Finance', icon: IndianRupee, roles: ['owner', 'admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['owner', 'admin', 'member'] },
    { id: 'export', label: 'Data Export', icon: Download, roles: ['owner', 'admin'] },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, roles: ['owner'] },
];

function SettingsPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isMobile = useIsMobile();
    const [activeSection, setActiveSection] = useState('org');
    const role = user?.role || 'member';
    const scrollRef = useRef(null);

    const visibleSections = SECTIONS.filter(s => s.roles.includes(role));
    const activeIndex = visibleSections.findIndex(s => s.id === activeSection);

    // Scroll active tab into center on change (mobile carousel)
    useEffect(() => {
        if (isMobile && scrollRef.current) {
            const container = scrollRef.current;
            const activeEl = container.children[activeIndex];
            if (activeEl) {
                const containerWidth = container.offsetWidth;
                const elLeft = activeEl.offsetLeft;
                const elWidth = activeEl.offsetWidth;
                const scrollTo = elLeft - (containerWidth / 2) + (elWidth / 2);
                container.scrollTo({ left: scrollTo, behavior: 'smooth' });
            }
        }
    }, [activeSection, isMobile, activeIndex]);

    // Simple danger zone component since it's small
    const DangerZone = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>Irreversible actions for your agency</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-bold ${theme.text.primary}`}>Delete Agency</p>
                        <p className={`text-xs ${theme.text.secondary} mt-1`}>Permanently delete your agency and all data</p>
                    </div>
                    <button className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSection = () => {
        switch (activeSection) {
            case 'org': return <OrgSection role={role} />;
            case 'team': return <TeamSection role={role} />;
            case 'appearance': return <AppearanceSection role={role} />;
            case 'workflow': return <WorkflowSection role={role} />;
            case 'verticals': return <VerticalsSection role={role} />;
            case 'templates': return <TemplatesSection />;
            case 'finance': return <FinanceSection role={role} />;
            case 'notifications': return <NotificationsSection />;
            case 'export': return <ExportSection />;
            case 'danger': return <DangerZone />;
            default: return <OrgSection role={role} />;
        }
    };

    return (
        <div className={`min-h-screen ${theme.canvas.bg} ${theme.text.secondary} p-4 md:p-8 md:pl-12`}>
            <div className={`max-w-6xl mx-auto ${isMobile ? '' : 'flex gap-12'}`}>
                {/* --- MOBILE: Carousel-style horizontal scroller --- */}
                {isMobile ? (
                    <div className="mb-6">
                        <h1 className={`text-2xl font-black ${theme.text.primary} tracking-tight mb-1`}>Settings</h1>
                        <p className={`${theme.text.secondary} text-sm mb-4`}>Manage your agency configuration</p>

                        <div
                            ref={scrollRef}
                            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-1 -mx-4 px-4"
                            style={{
                                maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                            }}
                        >
                            {visibleSections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                const accentData = theme.accents?.default || { primary: '#ffffff', glow: '#ffffff' };

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`snap-center shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${isActive
                                                ? `${theme.text.primary}`
                                                : `${theme.text.secondary} opacity-50`
                                            }`}
                                        style={isActive ? {
                                            backgroundColor: `${accentData.primary}1A`,
                                            color: accentData.primary,
                                            border: `1px solid ${accentData.primary}44`,
                                        } : { border: `1px solid transparent` }}
                                    >
                                        <Icon size={14} />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* --- DESKTOP: Sidebar Navigation --- */
                    <div className="w-64 shrink-0 space-y-8">
                        <div>
                            <h1 className={`text-3xl font-black ${theme.text.primary} tracking-tight`}>Settings</h1>
                            <p className={`${theme.text.secondary} text-sm mt-2`}>Manage your agency configuration</p>
                        </div>

                        <nav className="space-y-1">
                            {visibleSections.map(section => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                const accentData = theme.accents?.default || { primary: '#ffffff', glow: '#ffffff' };

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        style={{
                                            backgroundColor: isActive ? `${accentData.primary}1A` : undefined,
                                            color: isActive ? accentData.primary : undefined,
                                            boxShadow: isActive ? `0 0 20px ${accentData.glow}` : 'none',
                                            border: isActive ? `1px solid ${accentData.primary}44` : '1px solid transparent'
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group 
                                            ${isActive
                                                ? `font-bold`
                                                : `${theme.canvas.hover} ${theme.text.secondary}`
                                            }
                                        `}
                                    >
                                        <Icon size={16} className={isActive ? 'text-inherit' : `${theme.text.secondary} group-hover:${theme.text.primary}`} />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderSection()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
