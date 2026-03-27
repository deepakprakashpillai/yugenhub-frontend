import { useState, useRef, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Workflow, Layers, Bell, Download, AlertTriangle,
    GripVertical, IndianRupee, UserCircle
} from 'lucide-react';
import { Icons } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import api from '../api/axios';
import { toast } from 'sonner';
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
import AccountSection from '../components/settings/AccountSection';
import AutomationsSection from '../components/settings/AutomationsSection';

const SECTIONS = [
    { id: 'account', label: 'My Account', icon: UserCircle, roles: ['owner', 'admin', 'member'] },
    { id: 'org', label: 'Organisation', icon: Building2, roles: ['owner', 'admin', 'member'] },
    { id: 'team', label: 'Team', icon: Users, roles: ['owner', 'admin', 'member'] },
    { id: 'appearance', label: 'Appearance', icon: Palette, roles: ['owner', 'admin', 'member'] },
    { id: 'workflow', label: 'Workflow', icon: Workflow, roles: ['owner', 'admin', 'member'] },
    { id: 'verticals', label: 'Verticals', icon: Layers, roles: ['owner', 'admin'] },
    { id: 'templates', label: 'Templates', icon: Icons.LayoutTemplate, roles: ['owner', 'admin'] },
    { id: 'finance', label: 'Finance', icon: IndianRupee, roles: ['owner', 'admin'] },
    { id: 'automations', label: 'Automations', icon: Workflow, roles: ['owner', 'admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['owner', 'admin', 'member'] },
    { id: 'export', label: 'Data Export', icon: Download, roles: ['owner', 'admin'] },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, roles: ['owner'] },
];

function SettingsPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { refreshConfig } = useAgencyConfig();
    const isMobile = useIsMobile();
    const [activeSection, setActiveSection] = useState('account');
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
    const DangerZone = () => {
        const [syncing, setSyncing] = useState(false);
        const [syncResult, setSyncResult] = useState(null);
        const [seeding, setSeeding] = useState(false);
        const [seedResult, setSeedResult] = useState(null);

        const handleRevalidateAll = async () => {
            setSyncing(true);
            setSyncResult(null);
            try {
                const res = await api.post('/projects/admin/revalidate-all');
                setSyncResult(res.data);
                const fixed = res.data.event_dates_fixed + res.data.tasks_created + res.data.portal_deliverables_created + res.data.portal_deliverables_removed;
                toast.success(fixed > 0 ? `Revalidation complete — ${fixed} issues fixed` : 'Revalidation complete — everything looks good');
            } catch (err) {
                console.error(err);
                toast.error('Revalidation failed');
            } finally {
                setSyncing(false);
            }
        };

        const handleSeedDefaults = async () => {
            setSeeding(true);
            setSeedResult(null);
            try {
                const res = await api.post('/settings/seed-defaults');
                setSeedResult(res.data);
                const count = res.data.seeded?.length || 0;
                if (count > 0) {
                    await refreshConfig();
                    toast.success(`Seeded defaults for ${count} config section${count !== 1 ? 's' : ''}`);
                } else {
                    toast.info('All config sections already have data — nothing to seed');
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to seed defaults');
            } finally {
                setSeeding(false);
            }
        };

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>Irreversible actions for your agency</p>
                </div>

                {/* Maintenance */}
                <div className={`border ${theme.canvas.border} rounded-2xl p-6 space-y-6`}>
                    <h3 className={`text-sm font-semibold ${theme.text.primary}`}>Maintenance</h3>

                    {/* Seed Defaults */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className={`text-sm font-bold ${theme.text.primary}`}>Seed Config Defaults</p>
                            <p className={`text-xs ${theme.text.secondary} mt-1`}>
                                Fills in default values for any config sections that are currently empty — finance categories, lead sources, deliverable types, associate roles, and project statuses. Skips anything that already has data.
                            </p>
                            {seedResult && (
                                <div className="mt-3 space-y-1">
                                    {seedResult.seeded?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {seedResult.seeded.map(s => (
                                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">✓ {s}</span>
                                            ))}
                                        </div>
                                    )}
                                    {seedResult.skipped?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {seedResult.skipped.map(s => (
                                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 font-medium">
                                                    — {s} {seedResult.skipped_counts?.[s] ? `(${seedResult.skipped_counts[s]})` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSeedDefaults}
                            disabled={seeding}
                            className="shrink-0 px-4 py-2 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                        >
                            {seeding ? 'Seeding…' : 'Seed Defaults'}
                        </button>
                    </div>

                    <div className={`border-t ${theme.canvas.border}`} />

                    {/* Revalidate Projects */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className={`text-sm font-bold ${theme.text.primary}`}>Revalidate All Projects</p>
                            <p className={`text-xs ${theme.text.secondary} mt-1`}>
                                Scans every project and fixes common data issues: corrupted event dates, missing deliverable tasks, and out-of-sync portal deliverables. Safe to run multiple times.
                            </p>
                            {syncResult && (
                                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1">
                                    <p className="text-xs text-zinc-400">{syncResult.projects_scanned} projects scanned</p>
                                    <p className={`text-xs ${syncResult.event_dates_fixed > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                        {syncResult.event_dates_fixed} date fields fixed
                                    </p>
                                    <p className={`text-xs ${syncResult.tasks_created > 0 ? 'text-blue-400' : 'text-zinc-500'}`}>
                                        {syncResult.tasks_created} missing tasks created
                                    </p>
                                    <p className={`text-xs ${syncResult.portal_deliverables_created > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                        {syncResult.portal_deliverables_created} portal deliverables created
                                    </p>
                                    <p className={`text-xs ${syncResult.portal_deliverables_removed > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                        {syncResult.portal_deliverables_removed} excess portal deliverables removed
                                    </p>
                                    {syncResult.errors > 0 && (
                                        <p className="text-xs text-red-400">{syncResult.errors} projects had errors</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleRevalidateAll}
                            disabled={syncing}
                            className="shrink-0 px-4 py-2 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                        >
                            {syncing ? 'Running…' : 'Run Revalidation'}
                        </button>
                    </div>
                </div>

                {/* Danger */}
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
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'account': return <AccountSection />;
            case 'org': return <OrgSection role={role} />;
            case 'team': return <TeamSection role={role} />;
            case 'appearance': return <AppearanceSection role={role} />;
            case 'workflow': return <WorkflowSection role={role} />;
            case 'verticals': return <VerticalsSection role={role} />;
            case 'templates': return <TemplatesSection />;
            case 'finance': return <FinanceSection role={role} />;
            case 'automations': return <AutomationsSection role={role} />;
            case 'notifications': return <NotificationsSection />;
            case 'export': return <ExportSection />;
            case 'danger': return <DangerZone />;
            default: return <OrgSection role={role} />;
        }
    };

    return (
        <div className={`min-h-screen ${theme.canvas.bg} ${theme.text.secondary} p-3 pb-24 md:p-8 md:pl-12`}>
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
                                        className={`snap-center shrink-0 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${isActive
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
