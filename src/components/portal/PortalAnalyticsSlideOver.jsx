import { useState, useEffect } from 'react';
import { X, Eye, Users, Download, Activity } from 'lucide-react';
import { getPortalAnalytics } from '../../api/projects';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PortalAnalyticsSlideOver({ projectId, isOpen, onClose, theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getPortalAnalytics(projectId, days)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isOpen, projectId, days]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg h-full overflow-y-auto border-l ${theme.canvas.card} ${theme.canvas.border} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${theme.canvas.border} ${theme.canvas.card}`}>
          <h3 className={`text-lg font-bold ${theme.text.primary}`}>Portal Analytics</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${theme.text.secondary} ${theme.canvas.hover}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Period selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  days === d ? 'text-white' : `${theme.text.secondary} ${theme.canvas.hover}`
                }`}
                style={days === d ? { backgroundColor: 'var(--accent)' } : undefined}
              >
                {d}d
              </button>
            ))}
          </div>

          {loading && (
            <div className={`text-center py-12 ${theme.text.secondary}`}>Loading analytics...</div>
          )}

          {!loading && data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl border ${theme.canvas.border} p-4 text-center`}>
                  <Eye className={`w-5 h-5 mx-auto mb-1 ${theme.text.secondary}`} />
                  <p className={`text-2xl font-bold ${theme.text.primary}`}>{data.total_visits}</p>
                  <p className={`text-xs ${theme.text.secondary}`}>Visits</p>
                </div>
                <div className={`rounded-xl border ${theme.canvas.border} p-4 text-center`}>
                  <Users className={`w-5 h-5 mx-auto mb-1 ${theme.text.secondary}`} />
                  <p className={`text-2xl font-bold ${theme.text.primary}`}>{data.unique_visitors}</p>
                  <p className={`text-xs ${theme.text.secondary}`}>Unique</p>
                </div>
                <div className={`rounded-xl border ${theme.canvas.border} p-4 text-center`}>
                  <Download className={`w-5 h-5 mx-auto mb-1 ${theme.text.secondary}`} />
                  <p className={`text-2xl font-bold ${theme.text.primary}`}>{data.total_downloads}</p>
                  <p className={`text-xs ${theme.text.secondary}`}>Downloads</p>
                </div>
              </div>

              {/* Timeline chart */}
              {data.timeline?.length > 1 && (
                <div>
                  <h4 className={`text-sm font-semibold ${theme.text.primary} mb-3`}>Activity Over Time</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data.timeline}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Area type="monotone" dataKey="visits" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="downloads" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Per-deliverable downloads */}
              {Object.keys(data.deliverable_downloads || {}).length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${theme.text.primary} mb-3`}>Downloads by Deliverable</h4>
                  <div className="space-y-2">
                    {Object.entries(data.deliverable_downloads).map(([did, count]) => (
                      <div key={did} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border ${theme.canvas.border}`}>
                        <span className={`truncate ${theme.text.secondary}`}>{did}</span>
                        <span className={`font-semibold ${theme.text.primary}`}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              {data.recent_activity?.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${theme.text.primary} mb-3`}>Recent Activity</h4>
                  <div className="space-y-1.5">
                    {data.recent_activity.map((event, i) => (
                      <div key={i} className={`flex items-center gap-3 text-xs px-3 py-2 rounded-lg ${theme.canvas.hover}`}>
                        <Activity className={`w-3 h-3 shrink-0 ${theme.text.secondary}`} />
                        <span className={`flex-1 min-w-0 truncate ${theme.text.primary}`}>
                          {event.event_type === 'visit' && 'Portal visit'}
                          {event.event_type === 'file_download' && `Downloaded ${event.file_name || 'file'}${event.deliverable_title ? ` · ${event.deliverable_title}` : ''}`}
                          {event.event_type === 'deliverable_view' && `Viewed ${event.deliverable_title || 'deliverable'}`}
                        </span>
                        <span className={`ml-auto shrink-0 ${theme.text.secondary}`}>
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.total_visits === 0 && data.total_downloads === 0 && (
                <div className={`text-center py-8 ${theme.text.secondary}`}>
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
