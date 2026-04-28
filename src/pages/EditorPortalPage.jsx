import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { getEditorData, identifyEditor, postEditorComment, getVersionDownloadUrl } from '../api/editor';
import { useMultipartUpload } from '../hooks/useMultipartUpload';
import VersionHistory from '../components/portal/VersionHistory';
import {
  ChevronDown, ChevronUp, MessageSquare, Send, FileText, Image, Video,
  File, LogOut, Upload, Clock, Ban, X, AlertTriangle, RefreshCw,
} from 'lucide-react';

const THEMES = {
  dark: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900 border-zinc-800',
    text: 'text-white',
    textSecondary: 'text-zinc-400',
    border: 'border-zinc-800',
    input: 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500',
    badge: 'bg-zinc-800 text-zinc-300',
    hover: 'hover:bg-zinc-800',
  },
  light: {
    bg: 'bg-[#fdf4ff]',
    card: 'bg-white border-[#e9d5ff]',
    text: 'text-[#334155]',
    textSecondary: 'text-[#64748b]',
    border: 'border-[#e9d5ff]',
    input: 'bg-white border-[#e9d5ff] text-[#334155] placeholder-[#94a3b8]',
    badge: 'bg-[#fae8ff] text-[#701a75]',
    hover: 'hover:bg-[#fae8ff]',
  },
};

const STATUS_COLORS = {
  Pending:             { bg: 'bg-zinc-500/15',  text: 'text-zinc-400',   border: 'border-zinc-500/30',  dot: 'bg-zinc-400'   },
  Uploaded:            { bg: 'bg-blue-500/15',   text: 'text-blue-500',   border: 'border-blue-500/30',  dot: 'bg-blue-500'   },
  Approved:            { bg: 'bg-emerald-500/15',text: 'text-emerald-500',border: 'border-emerald-500/30',dot: 'bg-emerald-500'},
  'Changes Requested': { bg: 'bg-amber-500/15',  text: 'text-amber-500',  border: 'border-amber-500/30', dot: 'bg-amber-500'  },
};

function getFileIcon(contentType) {
  if (contentType?.startsWith('image/')) return Image;
  if (contentType?.startsWith('video/')) return Video;
  if (contentType?.includes('pdf')) return FileText;
  return File;
}

function StatusBadge({ status }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
      {status}
    </span>
  );
}

function FeedbackThread({ deliverable, token, identity, accentColor, t, onComment }) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await postEditorComment(token, deliverable.id, {
        message: message.trim(),
        author_name: identity.name,
        author_email: identity.email,
      });
      setMessage('');
      onComment();
    } catch {
      // silently fail — parent will refresh
    } finally {
      setSending(false);
    }
  };

  const feedback = deliverable.feedback || [];

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 text-sm font-medium ${t.textSecondary} ${t.hover} px-2 py-1 rounded transition-colors`}
      >
        <MessageSquare className="w-4 h-4" />
        Feedback ({feedback.length})
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {feedback.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {feedback.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-lg p-3 text-sm border ${
                    entry.author_type === 'editor'
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : entry.author_type === 'team'
                      ? `${t.card}`
                      : ''
                  }`}
                  style={entry.author_type === 'client' ? { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` } : undefined}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${t.textSecondary}`}>
                      {entry.author_name || (entry.author_type === 'client' ? 'Client' : entry.author_type === 'editor' ? 'Editor' : 'Team')}
                    </span>
                    {entry.author_type === 'editor' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">Editor</span>
                    )}
                    {entry.author_type === 'team' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 font-medium">Team</span>
                    )}
                    {entry.author_type === 'client' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${accentColor}30`, color: accentColor }}>Client</span>
                    )}
                    <span className={`text-[10px] ${t.textSecondary}`}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.author_email && entry.author_type === 'editor' && (
                    <p className={`text-[10px] ${t.textSecondary} mb-1`}>{entry.author_email}</p>
                  )}
                  <p className={t.text}>{entry.message}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a comment..."
              className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${t.input}`}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="px-3 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function UploadZone({ token, deliverable, identity, accentColor, t, onUploaded }) {
  const { upload, abort, reset, progress, status, error } = useMultipartUpload(token);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const MAX = 5 * 1024 * 1024 * 1024;

  const handleFile = async (file) => {
    if (file.size > MAX) {
      alert('File exceeds 5 GB limit');
      return;
    }
    setSelectedFile(file);
    const result = await upload(file, deliverable.id, identity);
    if (result) {
      setSelectedFile(null);
      reset();
      onUploaded();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleCancel = async () => {
    await abort();
    setSelectedFile(null);
  };

  const isActive = deliverable.status === 'Pending' || deliverable.status === 'Changes Requested';

  if (status === 'uploading' && selectedFile) {
    return (
      <div className={`rounded-xl border p-3 mb-3 ${t.card}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium truncate ${t.text}`}>{selectedFile.name}</span>
          <button onClick={handleCancel} className={`p-1 rounded ${t.hover} ${t.textSecondary}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className={`h-1.5 rounded-full bg-zinc-700 overflow-hidden`}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: accentColor }}
          />
        </div>
        <p className={`text-[10px] mt-1 ${t.textSecondary}`}>{progress}%</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-400">{error || 'Upload failed'}</span>
        </div>
        <button onClick={reset} className="text-xs text-red-400 underline">Retry</button>
      </div>
    );
  }

  return (
    <label
      className={`flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors mb-3 ${
        dragging ? 'border-opacity-80 bg-opacity-10' : ''
      } ${isActive ? t.border : 'border-zinc-700 opacity-60'}`}
      style={dragging ? { borderColor: accentColor, backgroundColor: `${accentColor}10` } : undefined}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <Upload className={`w-4 h-4 ${t.textSecondary}`} />
      <span className={`text-xs ${t.textSecondary}`}>
        {isActive ? 'Drop file or click to upload' : 'Upload'}
      </span>
      <input type="file" className="hidden" onChange={handleChange} />
    </label>
  );
}

function VersionUploadModal({ file, token, deliverableId, identity, accentColor, t, onClose, onUploaded }) {
  const [changeNotes, setChangeNotes] = useState('');
  const { upload, abort, reset, progress, status, error } = useMultipartUpload(token);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = '';
    const result = await upload(f, deliverableId, identity, file.id, changeNotes);
    if (result) {
      reset();
      onUploaded();
      onClose();
    }
  };

  const handleCancel = async () => {
    await abort();
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleCancel}>
      <div
        className={`w-full max-w-sm rounded-2xl border p-5 shadow-xl ${t.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-sm font-semibold ${t.text}`}>Upload New Version</p>
            <p className={`text-xs ${t.textSecondary} truncate`}>{file.file_name} · v{file.version || 1} → v{(file.version || 1) + 1}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${t.hover} ${t.textSecondary}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
          placeholder="Change notes (optional)"
          rows={3}
          className={`w-full px-3 py-2 rounded-lg border text-sm resize-none mb-4 ${t.input}`}
        />

        {status === 'uploading' && (
          <div className="mb-4">
            <div className={`h-1.5 rounded-full bg-zinc-700 overflow-hidden`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
            </div>
            <p className={`text-[10px] mt-1 ${t.textSecondary}`}>{progress}%</p>
          </div>
        )}

        {status === 'error' && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className={`flex-1 px-3 py-2 rounded-lg text-sm border ${t.textSecondary} ${t.hover}`}
          >
            {status === 'uploading' ? 'Cancel' : 'Close'}
          </button>
          {status !== 'uploading' && (
            <label
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white text-center cursor-pointer hover:opacity-90 transition-all"
              style={{ backgroundColor: accentColor }}
            >
              Choose File
              <input type="file" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliverableCard({ deliverable, token, identity, accentColor, t, onRefresh }) {
  const files = deliverable.files || [];
  const [versionModalFile, setVersionModalFile] = useState(null);
  const versionTheme = {
    text: { primary: t.text, secondary: t.textSecondary },
    canvas: { card: t.card, border: t.border, hover: t.hover },
  };
  const isChangesRequested = deliverable.status === 'Changes Requested';

  return (
    <div className={`rounded-xl border p-4 ${t.card} ${isChangesRequested ? 'ring-1 ring-amber-500/40' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className={`font-semibold text-sm ${t.text}`}>{deliverable.title}</h4>
        <StatusBadge status={deliverable.status} />
      </div>

      {/* Files with per-file version upload */}
      {files.length > 0 && (
        <div className="space-y-2 mb-3">
          {files.map((file) => {
            const Icon = getFileIcon(file.content_type);
            return (
              <div key={file.id}>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm ${t.card}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${t.textSecondary}`} />
                  <span className={`flex-1 truncate text-xs ${t.text}`}>{file.file_name}</span>
                  <span className={`text-[10px] ${t.textSecondary} mr-1`}>
                    v{file.version || 1}
                  </span>
                  <button
                    onClick={() => setVersionModalFile(file)}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      isChangesRequested
                        ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 animate-pulse'
                        : `${t.border} ${t.textSecondary} ${t.hover}`
                    }`}
                    title="Upload new version"
                  >
                    <RefreshCw className="w-3 h-3" /> New version
                  </button>
                </div>
                <VersionHistory
                  file={file}
                  theme={versionTheme}
                  getDownloadUrl={(v) => getVersionDownloadUrl(token, deliverable.id, file.id, v.version)}
                />
              </div>
            );
          })}
        </div>
      )}

      <UploadZone
        token={token}
        deliverable={deliverable}
        identity={identity}
        accentColor={accentColor}
        t={t}
        onUploaded={onRefresh}
      />

      <FeedbackThread
        deliverable={deliverable}
        token={token}
        identity={identity}
        accentColor={accentColor}
        t={t}
        onComment={onRefresh}
      />

      {versionModalFile && (
        <VersionUploadModal
          file={versionModalFile}
          token={token}
          deliverableId={deliverable.id}
          identity={identity}
          accentColor={accentColor}
          t={t}
          onClose={() => setVersionModalFile(null)}
          onUploaded={onRefresh}
        />
      )}
    </div>
  );
}

export default function EditorPortalPage() {
  const { token } = useParams();

  const [identity, setIdentity] = useState(() => {
    try {
      const stored = localStorage.getItem(`editor_identity_${token}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getEditorData(token);
      setData(result);
    } catch {
      setError('Could not load editor portal. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!identity) return;
    fetchData();
  }, [identity, fetchData]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setAuthError(null);
    try {
      const info = await identifyEditor(token, credentialResponse.credential);
      localStorage.setItem(`editor_identity_${token}`, JSON.stringify(info));
      setIdentity(info);
    } catch {
      setAuthError('Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(`editor_identity_${token}`);
    setIdentity(null);
    setData(null);
  };

  const themeMode = data?.org_settings?.theme_mode || 'dark';
  const t = THEMES[themeMode] || THEMES.dark;
  const accentColor = data?.org_settings?.accent_color || '#ef4444';

  // ── Sign-in gate ──────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-zinc-800">
            <Upload className="w-5 h-5 text-zinc-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Editor Portal</h1>
          <p className="text-sm text-zinc-400 mb-6">Sign in with Google to access your deliverables</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setAuthError('Google sign-in failed. Please try again.')}
              theme="filled_black"
              size="large"
              shape="pill"
            />
          </div>
          {authError && <p className="mt-3 text-sm text-red-400">{authError}</p>}
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ color: accentColor }} />
          <p className={`text-sm ${t.textSecondary}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`min-h-screen ${t.bg} flex items-center justify-center p-4`}>
        <div className="text-center max-w-sm">
          <Ban className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Something went wrong</p>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <button onClick={handleSignOut} className="text-sm text-zinc-400 underline">
            Sign out and try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const linkedDeliverables = (data.deliverables || []).filter((d) => d.event_id);
  const unlinkedDeliverables = (data.deliverables || []).filter((d) => !d.event_id);

  return (
    <div className={`min-h-screen ${t.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${t.border} backdrop-blur-sm`} style={{ backgroundColor: themeMode === 'dark' ? 'rgba(9,9,11,0.9)' : 'rgba(253,244,255,0.9)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm ${t.text}`}>
                {data.org_settings?.org_name || 'Editor Portal'}
              </span>
              {data.project_code && (
                <span className={`text-xs ${t.textSecondary}`}>· {data.project_code}</span>
              )}
              {data.editor_token_label && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {data.editor_token_label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {identity.picture && (
              <img src={identity.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            )}
            <span className={`text-xs ${t.textSecondary} hidden sm:block`}>{identity.name}</span>
            <button
              onClick={handleSignOut}
              className={`p-1.5 rounded-lg ${t.hover} ${t.textSecondary}`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Event-grouped deliverables */}
        {data.events?.map((event) => {
          const eventDeliverables = linkedDeliverables.filter((d) => d.event_id === event.id);
          if (eventDeliverables.length === 0) return null;
          return (
            <section key={event.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider ${t.textSecondary}`}>
                  {event.type}
                </span>
                {event.start_date && (
                  <span className={`text-xs ${t.textSecondary}`}>
                    · {new Date(event.start_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {eventDeliverables.map((d) => (
                  <DeliverableCard
                    key={d.id}
                    deliverable={d}
                    token={token}
                    identity={identity}
                    accentColor={accentColor}
                    t={t}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Unlinked deliverables */}
        {unlinkedDeliverables.length > 0 && (
          <section>
            {data.events?.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider ${t.textSecondary}`}>Other</span>
              </div>
            )}
            <div className="space-y-3">
              {unlinkedDeliverables.map((d) => (
                <DeliverableCard
                  key={d.id}
                  deliverable={d}
                  token={token}
                  identity={identity}
                  accentColor={accentColor}
                  t={t}
                  onRefresh={fetchData}
                />
              ))}
            </div>
          </section>
        )}

        {(data.deliverables || []).length === 0 && (
          <div className="text-center py-16">
            <Clock className={`w-10 h-10 mx-auto mb-3 ${t.textSecondary}`} />
            <p className={`font-medium ${t.text}`}>No deliverables assigned yet</p>
            <p className={`text-sm mt-1 ${t.textSecondary}`}>Check back when the agency has assigned work to this link.</p>
          </div>
        )}
      </div>
    </div>
  );
}
