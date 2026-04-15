import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import * as mediaApi from '../../api/media';

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(iso) {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const BARS = [
    { key: 'original_bytes', label: 'Original files', color: 'bg-accent' },
    { key: 'thumbnail_bytes', label: 'Thumbnails', color: 'bg-blue-400' },
    { key: 'preview_bytes', label: 'Previews', color: 'bg-purple-400' },
    { key: 'watermark_bytes', label: 'Watermarks', color: 'bg-amber-400' },
];

export default function R2UsageWidget() {
    const { theme } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const pollRef = useRef(null);

    const fetchStats = useCallback(async () => {
        try {
            const data = await mediaApi.getUsageStats();
            setStats(data);
            return data;
        } catch {
            // silently fail — widget is non-critical
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        const prevUpdated = stats?.last_updated;
        try {
            await mediaApi.refreshUsageStats();
        } catch {
            setRefreshing(false);
            return;
        }
        // Poll until last_updated changes (max 60s)
        let attempts = 0;
        pollRef.current = setInterval(async () => {
            attempts++;
            const data = await fetchStats();
            const newUpdated = data?.last_updated;
            if (newUpdated && newUpdated !== prevUpdated) {
                clearInterval(pollRef.current);
                setRefreshing(false);
            } else if (attempts >= 20) {
                clearInterval(pollRef.current);
                setRefreshing(false);
            }
        }, 3000);
    };

    useEffect(() => () => clearInterval(pollRef.current), []);

    if (loading) return null;
    if (!stats) return null;

    const total = stats.total_bytes || 0;

    return (
        <div className={`border-b ${theme.canvas.border} shrink-0`}>
            {/* Header row */}
            <div className="flex items-center gap-2 px-4 md:px-6 py-2.5">
                <span className={`text-[11px] font-black uppercase tracking-widest ${theme.text.secondary}`}>
                    Storage Usage
                </span>

                {stats.is_stale && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        Stale
                    </span>
                )}

                {stats.last_updated && (
                    <span className={`text-[10px] ${theme.text.secondary} ml-1`}>
                        Last: {timeAgo(stats.last_updated)}
                    </span>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors disabled:opacity-40`}
                        title="Refresh storage stats"
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className={`p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </button>
                </div>
            </div>

            {/* Collapsible body */}
            {!collapsed && (
                <div className="px-4 md:px-6 pb-3 space-y-2">
                    <div className="flex items-baseline gap-2">
                        <span className={`text-base font-black ${theme.text.primary}`}>
                            {formatBytes(total)}
                        </span>
                        <span className={`text-[10px] ${theme.text.secondary}`}>
                            {stats.file_count?.toLocaleString() ?? 0} files
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        {BARS.map(({ key, label, color }) => {
                            const bytes = stats[key] || 0;
                            const pct = total > 0 ? (bytes / total) * 100 : 0;
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`flex-1 h-1.5 rounded-full ${theme.canvas.card} overflow-hidden`}>
                                        <div
                                            className={`h-full rounded-full ${color} transition-all duration-500`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] ${theme.text.secondary} w-24 truncate`}>
                                        {label}
                                    </span>
                                    <span className={`text-[10px] font-semibold ${theme.text.primary} w-16 text-right`}>
                                        {formatBytes(bytes)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
