import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';
import QueueTab from './communications/QueueTab';
import SettingsTab from './communications/SettingsTab';

const TABS = [
    { id: 'queue', label: 'Queue', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function CommunicationsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'queue';

    useEffect(() => {
        if (user && user.role !== ROLES.OWNER && user.role !== ROLES.ADMIN && !user.communications_access) {
            navigate('/');
        }
    }, [user, navigate]);

    if (!theme || !user) return null;
    if (user.role !== ROLES.OWNER && user.role !== ROLES.ADMIN && !user.communications_access) return null;

    const isOwnerOrAdmin = user.role === ROLES.OWNER || user.role === ROLES.ADMIN;

    const visibleTabs = TABS.filter(t => t.id !== 'settings' || isOwnerOrAdmin);

    const setTab = (id) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', id);
        setSearchParams(next);
    };

    return (
        <div className={`flex flex-col h-full min-h-0 ${theme.canvas.bg}`}>
            {/* Header */}
            <div className={`px-4 md:px-6 pt-4 md:pt-6 pb-0 border-b ${theme.canvas.border} shrink-0`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <MessageCircle size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className={`text-lg font-bold ${theme.text.primary}`}>Communications</h1>
                        <p className={`text-xs ${theme.text.secondary}`}>WhatsApp message queue</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0.5">
                    {visibleTabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${active
                                    ? 'border-violet-500 text-violet-400'
                                    : `border-transparent ${theme.text.secondary} hover:text-white`
                                    }`}
                            >
                                <Icon size={13} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
                {activeTab === 'queue' && <QueueTab theme={theme} />}
                {activeTab === 'settings' && isOwnerOrAdmin && <SettingsTab theme={theme} />}
            </div>
        </div>
    );
}
