import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import { Bell, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { refreshNotifications } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);
                refreshNotifications(); // Also refresh the count on load
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [refreshNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            refreshNotifications(); // Sync sidebar
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            refreshNotifications(); // Sync sidebar
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }

        // 1. If metadata has project_id, go to Project Page for context
        if (notification.metadata?.project_id) {
            navigate(`/projects/${notification.metadata.project_id}`);
            return;
        }

        // 2. Fallback: Navigate to the resource if available
        if (notification.resource_type === 'task' && notification.resource_id) {
            // Navigate to tasks page with taskId query param to open modal
            navigate(`/tasks?taskId=${notification.resource_id}`);
        }
    };

    // Helper to render message with bold text (simple parser for **text**)
    const renderMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className={`${theme.text.primary} font-bold`}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-4 md:p-8 max-w-[800px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-lg ${theme.canvas.card} border ${theme.canvas.border} hover:${theme.canvas.hover} transition-colors hidden md:block`}
                    >
                        <ArrowLeft size={16} className={theme.text.secondary} />
                    </button>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black ${theme.text.primary} uppercase tracking-tighter flex items-center gap-3`}>
                            <Bell size={20} />
                            Notifications
                        </h1>
                        <p className={`${theme.text.secondary} text-sm mt-1`}>
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className={`px-4 py-2 rounded-lg ${theme.canvas.card} border ${theme.canvas.border} text-xs font-bold ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors flex items-center gap-2 self-start sm:self-auto`}
                    >
                        <CheckCircle size={14} />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className={`w-6 h-6 animate-spin ${theme.text.secondary}`} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                    <Bell size={48} className={`mx-auto ${theme.text.secondary} mb-4`} />
                    <p className={theme.text.secondary}>No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={clsx(
                                "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4",
                                notification.read
                                    ? `${theme.canvas.bg} border-transparent hover:${theme.canvas.hover} opacity-70`
                                    : `${theme.canvas.card} ${theme.canvas.border} hover:border-${theme.accent?.primary || 'purple-500'}`
                            )}
                        >
                            {/* Indicator */}
                            <div className={clsx(
                                "w-2 h-2 rounded-full mt-2 shrink-0",
                                notification.read ? theme.text.secondary : "bg-emerald-500"
                            )} style={{ backgroundColor: notification.read ? undefined : '#10b981' }} />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={clsx(
                                    "text-sm font-bold",
                                    notification.read ? theme.text.secondary : theme.text.primary
                                )}>
                                    {notification.title}
                                </p>
                                <p className={clsx(
                                    "text-xs mt-1",
                                    notification.read ? theme.text.secondary : theme.text.secondary
                                )}>
                                    {renderMessage(notification.message)}
                                </p>
                                <p className={`text-[10px] ${theme.text.secondary} mt-2`}>
                                    {new Date(notification.created_at).toLocaleString()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
