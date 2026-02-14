
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Workflow, Layers, Bell, Download, AlertTriangle,
    GripVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import extracted sections
import OrgSection from '../components/settings/OrgSection';
import TeamSection from '../components/settings/TeamSection';
import WorkflowSection from '../components/settings/WorkflowSection';
import VerticalsSection from '../components/settings/VerticalsSection';
import NotificationsSection from '../components/settings/NotificationsSection';
import ExportSection from '../components/settings/ExportSection';

const SECTIONS = [
    { id: 'org', label: 'Organisation', icon: Building2, roles: ['owner', 'admin', 'member'] },
    { id: 'team', label: 'Team', icon: Users, roles: ['owner', 'admin', 'member'] },
    { id: 'workflow', label: 'Workflow', icon: Workflow, roles: ['owner', 'admin', 'member'] },
    { id: 'verticals', label: 'Verticals', icon: Layers, roles: ['owner', 'admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['owner', 'admin', 'member'] },
    { id: 'export', label: 'Data Export', icon: Download, roles: ['owner', 'admin'] },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, roles: ['owner'] },
];

function SettingsPage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('org');
    const role = user?.role || 'member';

    // Simple danger zone component since it's small
    const DangerZone = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
                <p className="text-sm text-zinc-500 mt-1">Irreversible actions for your agency</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-white">Delete Agency</p>
                        <p className="text-xs text-zinc-500 mt-1">Permanently delete your agency and all data</p>
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
            case 'workflow': return <WorkflowSection role={role} />;
            case 'verticals': return <VerticalsSection role={role} />;
            case 'notifications': return <NotificationsSection />;
            case 'export': return <ExportSection />;
            case 'danger': return <DangerZone />;
            default: return <OrgSection role={role} />;
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-400 p-8 pl-12">
            <div className="max-w-6xl mx-auto flex gap-12">
                {/* Sidebar Navigation */}
                <div className="w-64 shrink-0 space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
                        <p className="text-zinc-500 text-sm mt-2">Manage your agency configuration</p>
                    </div>

                    <nav className="space-y-1">
                        {SECTIONS.filter(s => s.roles.includes(role)).map(section => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-white text-black font-bold' : 'hover:bg-zinc-900 hover:text-white'}`}
                                >
                                    <Icon size={16} className={isActive ? 'text-black' : 'text-zinc-600 group-hover:text-zinc-400'} />
                                    {section.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

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
