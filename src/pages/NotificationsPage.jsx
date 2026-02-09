import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import { Bell, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
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
    }, []);

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
        // Navigate to the resource if available
        if (notification.resource_type === 'task' && notification.resource_id) {
            // Navigate to tasks page with taskId query param to open modal
            navigate(`/tasks?taskId=${notification.resource_id}`);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-8 max-w-[800px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={16} className="text-zinc-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Bell size={24} />
                            Notifications
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <CheckCircle size={14} />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                    <Bell size={48} className="mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-500">No notifications yet.</p>
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
                                    ? "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900"
                                    : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                            )}
                        >
                            {/* Indicator */}
                            <div className={clsx(
                                "w-2 h-2 rounded-full mt-2 shrink-0",
                                notification.read ? "bg-zinc-700" : "bg-emerald-500"
                            )} />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={clsx(
                                    "text-sm font-bold",
                                    notification.read ? "text-zinc-500" : "text-white"
                                )}>
                                    {notification.title}
                                </p>
                                <p className={clsx(
                                    "text-xs mt-1",
                                    notification.read ? "text-zinc-600" : "text-zinc-400"
                                )}>
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-zinc-600 mt-2">
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
