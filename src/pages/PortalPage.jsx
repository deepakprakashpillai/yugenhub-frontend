import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPortalData, approveDeliverable, submitFeedback, getDownloadUrl, trackPortalEvent } from '../api/portal';
import { Check, Clock, MessageSquare, Send, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Download, FileText, Image, Video, File, MapPin, Calendar, ExternalLink, X, Play, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

// Inline theme maps for the portal (no auth context available)
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
  Pending: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
  Uploaded: { bg: 'bg-blue-500/15', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  Approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  'Changes Requested': { bg: 'bg-amber-500/15', text: 'text-amber-500', border: 'border-amber-500/30', dot: 'bg-amber-500' },
};

function isMedia(file) {
  const type = file.content_type || '';
  return type.startsWith('image/') || type.startsWith('video/');
}

function getFileIcon(contentType) {
  if (contentType?.startsWith('image/')) return Image;
  if (contentType?.startsWith('video/')) return Video;
  if (contentType?.includes('pdf')) return FileText;
  return File;
}

function downloadFile(url, fileName) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getThumbnailUrl(file) {
  return file.thumbnail_r2_url || file.r2_url;
}

function VideoWatermark({ text }) {
  const label = text || 'CONFIDENTIAL';
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 1 }}>
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <span
            key={`${row}-${col}`}
            className="absolute text-white/20 font-bold uppercase tracking-widest whitespace-nowrap"
            style={{
              fontSize: '13px',
              transform: 'rotate(-35deg)',
              left: `${col * 30 - 10}%`,
              top: `${row * 20 - 5}%`,
            }}
          >
            {label}
          </span>
        ))
      )}
    </div>
  );
}

// --- ThumbnailGrid: WhatsApp-style file preview ---
function ThumbnailGrid({ files, onFileClick, onDownloadAll, t, token, deliverable, watermarkText }) {
  const mediaFiles = files.filter(isMedia);
  const nonMediaFiles = files.filter(f => !isMedia(f));
  const maxVisible = 4;
  const visibleMedia = mediaFiles.slice(0, maxVisible);
  const extraCount = mediaFiles.length - maxVisible;

  const gridClass = visibleMedia.length === 1
    ? 'grid-cols-1'
    : 'grid-cols-2';

  return (
    <div>
      {visibleMedia.length > 0 && (
        <div className={`grid ${gridClass} gap-0.5 overflow-hidden rounded-t-2xl`}>
          {visibleMedia.map((file, i) => {
            const isLast = i === maxVisible - 1 && extraCount > 0;
            const mediaIndex = files.indexOf(file);
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onFileClick(mediaIndex)}
                className="relative w-full h-48 overflow-hidden focus:outline-none group"
              >
                {file.content_type?.startsWith('video/') ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {file.thumbnail_r2_url ? (
                      <img src={file.thumbnail_r2_url} alt={file.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={file.r2_url} className="w-full h-full object-cover" muted preload="metadata" />
                    )}
                    {file.watermark_status === 'done' && <VideoWatermark text={watermarkText} />}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={getThumbnailUrl(file)} alt={file.file_name} className="w-full h-full object-cover" />
                )}
                {isLast && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">+{extraCount}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            );
          })}
        </div>
      )}
      {nonMediaFiles.length > 0 && !deliverable?.downloads_disabled && (
        <div className={`${visibleMedia.length > 0 ? 'px-5 pt-3' : 'px-5 pt-0'} space-y-1.5`}>
          {nonMediaFiles.map((file) => {
            const Icon = getFileIcon(file.content_type);
            const downloadUrl = token && deliverable ? getDownloadUrl(token, deliverable.id, file.id) : file.r2_url;
            return (
              <a
                key={file.id}
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-2.5 rounded-lg border ${t.border} transition-colors ${t.hover}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${t.textSecondary}`} />
                <span className={`truncate text-sm ${t.text}`}>{file.file_name}</span>
                <Download className={`w-3.5 h-3.5 ml-auto shrink-0 ${t.textSecondary}`} />
              </a>
            );
          })}
        </div>
      )}
      {onDownloadAll && !deliverable?.downloads_disabled && (() => {
        const downloadableCount = files.filter(f => f.watermark_status !== 'done').length;
        if (downloadableCount < 2) return null;
        return (
          <div className={`${visibleMedia.length > 0 && nonMediaFiles.length === 0 ? 'px-5 pt-3' : nonMediaFiles.length > 0 ? 'px-5 pt-2' : 'px-5'}`}>
            <button
              type="button"
              onClick={onDownloadAll}
              className={`flex items-center gap-2 text-xs font-medium ${t.textSecondary} ${t.hover} px-3 py-1.5 rounded-lg transition-colors`}
            >
              <Download className="w-3.5 h-3.5" /> Download All ({downloadableCount} files)
            </button>
          </div>
        );
      })()}
      {/* Download limit/disabled messages */}
      {deliverable?.downloads_disabled && (
        <div className="px-5 pt-3">
          <p className={`flex items-center gap-1.5 text-xs ${t.textSecondary}`}>
            <Ban className="w-3.5 h-3.5" /> Downloads are disabled for this deliverable
          </p>
        </div>
      )}
      {!deliverable?.downloads_disabled && deliverable?.max_downloads != null && deliverable?.download_count >= deliverable?.max_downloads && (
        <div className="px-5 pt-3">
          <p className={`text-xs ${t.textSecondary}`}>Download limit reached ({deliverable.download_count}/{deliverable.max_downloads})</p>
        </div>
      )}
      {!deliverable?.downloads_disabled && deliverable?.max_downloads != null && deliverable?.download_count < deliverable?.max_downloads && (
        <div className="px-5 pt-2">
          <p className={`text-xs ${t.textSecondary}`}>{deliverable.download_count}/{deliverable.max_downloads} downloads used</p>
        </div>
      )}
    </div>
  );
}

// --- MediaGallery: Fullscreen lightbox/gallery ---
function MediaGallery({ files, initialIndex, isOpen, onClose, t, accentColor, token, deliverableId, feedback = [], onRefresh, watermarkText, downloadsDisabled }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(files.length - 1, i + 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, files.length, onClose]);

  if (!isOpen || !files.length) return null;

  const file = files[currentIndex];
  const type = file?.content_type || '';
  const fileFeedback = feedback.filter(f => f.file_id === file?.id);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await submitFeedback(token, deliverableId, commentText.trim(), null, file.id);
      setCommentText('');
      onRefresh();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80 && currentIndex > 0) setCurrentIndex(i => i - 1);
    else if (info.offset.x < -80 && currentIndex < files.length - 1) setCurrentIndex(i => i + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{file?.file_name}</span>
          <span className="text-xs text-white/50 shrink-0">{currentIndex + 1} / {files.length}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!downloadsDisabled && file.watermark_status !== 'done' && (
            <button
              type="button"
              onClick={() => downloadFile(getDownloadUrl(token, deliverableId, file.id), file.file_name)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center: media display + nav */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-h-0">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors hidden sm:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={currentIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full h-full flex items-center justify-center px-12 cursor-grab active:cursor-grabbing"
        >
          {type.startsWith('image/') && (
            <img src={file.r2_url} alt={file.file_name} className="max-w-full max-h-full object-contain select-none" draggable={false} />
          )}
          {type.startsWith('video/') && (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <video
                src={file.r2_url}
                controls
                className="max-w-full max-h-full"
                autoPlay
                controlsList={file.watermark_status === 'done' ? 'nodownload' : undefined}
                onContextMenu={file.watermark_status === 'done' ? (e) => e.preventDefault() : undefined}
              />
              {file.watermark_status === 'done' && <VideoWatermark text={watermarkText} />}
            </div>
          )}
          {type === 'application/pdf' && (
            <iframe src={file.r2_url} title={file.file_name} className="w-full h-full border-0 rounded-lg" />
          )}
          {!type.startsWith('image/') && !type.startsWith('video/') && type !== 'application/pdf' && (
            <div className="text-center text-white">
              <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{file.file_name}</p>
              {!downloadsDisabled && (
                <button
                  type="button"
                  onClick={() => downloadFile(getDownloadUrl(token, deliverableId, file.id), file.file_name)}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  Download File
                </button>
              )}
            </div>
          )}
        </motion.div>

        {currentIndex < files.length - 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex(i => i + 1)}
            className="absolute right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors hidden sm:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom: per-file feedback */}
      <div className="bg-black/60 border-t border-white/10 px-4 py-3">
        {fileFeedback.length > 0 && (
          <div ref={feedbackRef} className="max-h-48 overflow-y-auto space-y-2 mb-3 px-1">
            {fileFeedback.map((entry) => (
              <div
                key={entry.id}
                className={`flex gap-2 ${entry.author_type === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    entry.author_type === 'client'
                      ? 'text-white rounded-br-sm'
                      : 'bg-white/10 text-white rounded-bl-sm'
                  }`}
                  style={entry.author_type === 'client' ? { backgroundColor: accentColor } : undefined}
                >
                  {entry.author_name && (
                    <p className="text-[10px] font-semibold mb-0.5 text-white/60">{entry.author_name}</p>
                  )}
                  <p>{entry.message}</p>
                  <p className="text-[10px] mt-0.5 text-white/40">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Comment on this file..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none placeholder-white/40 focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={sending || !commentText.trim()}
            className="px-3 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function FeedbackThread({ feedback, t, accentColor }) {
  return (
    <div className="space-y-3 mt-4">
      {feedback.map((entry) => (
        <div
          key={entry.id}
          className={`flex gap-3 ${entry.author_type === 'client' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              entry.author_type === 'client'
                ? 'text-white rounded-br-sm'
                : `${t.card} border rounded-bl-sm`
            }`}
            style={entry.author_type === 'client' ? { backgroundColor: accentColor } : undefined}
          >
            {entry.author_name && (
              <p className={`text-xs font-semibold mb-1 ${entry.author_type === 'client' ? 'text-white/70' : t.textSecondary}`}>
                {entry.author_name}
              </p>
            )}
            <p>{entry.message}</p>
            <p className={`text-[10px] mt-1 ${entry.author_type === 'client' ? 'text-white/50' : t.textSecondary}`}>
              {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeliverableCard({ deliverable, token, t, accentColor, onRefresh, watermarkText }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const sc = STATUS_COLORS[deliverable.status] || STATUS_COLORS.Pending;

  const generalFeedback = (deliverable.feedback || []).filter(f => !f.file_id);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveDeliverable(token, deliverable.id);
      onRefresh();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setLoading(true);
    try {
      await submitFeedback(token, deliverable.id, feedbackText.trim());
      setFeedbackText('');
      onRefresh();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    if (deliverable.downloads_disabled) return;
    (deliverable.files || [])
      .filter(f => f.watermark_status !== 'done')
      .forEach((file) => {
        downloadFile(getDownloadUrl(token, deliverable.id, file.id), file.file_name);
      });
  };

  const handleFileClick = (index) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  return (
    <>
      <div className={`rounded-2xl border ${t.card} overflow-hidden`}>
        {/* Thumbnail grid */}
        {deliverable.files?.length > 0 && (
          <ThumbnailGrid
            files={deliverable.files}
            onFileClick={handleFileClick}
            onDownloadAll={deliverable.files.length > 1 ? handleDownloadAll : null}
            t={t}
            token={token}
            deliverable={deliverable}
            watermarkText={watermarkText}
          />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg ${t.text}`}>{deliverable.title}</h3>
              {deliverable.description && (
                <p className={`text-sm mt-1 ${t.textSecondary}`}>{deliverable.description}</p>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {deliverable.status}
            </span>
          </div>

          {/* Actions — only show when files have been uploaded */}
          {deliverable.files?.length > 0 && (
            <>
              <div className="mt-4 flex items-center gap-3">
                {deliverable.status !== 'Approved' && (
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${t.badge} transition-colors ${t.hover}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback ({generalFeedback.length})
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Feedback thread — scrollable */}
              {expanded && (
                <div className="mt-4">
                  {generalFeedback.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      <FeedbackThread feedback={generalFeedback} t={t} accentColor={accentColor} />
                    </div>
                  )}
                  <form onSubmit={handleFeedback} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Leave feedback..."
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ${t.input}`}
                  style={{ '--tw-ring-color': accentColor }}
                />
                <button
                  type="submit"
                  disabled={loading || !feedbackText.trim()}
                  className="px-3 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Gallery overlay */}
      <MediaGallery
        files={deliverable.files || []}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        t={t}
        accentColor={accentColor}
        token={token}
        deliverableId={deliverable.id}
        feedback={deliverable.feedback || []}
        onRefresh={onRefresh}
        watermarkText={watermarkText}
        downloadsDisabled={deliverable.downloads_disabled}
      />
    </>
  );
}

export default function PortalPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const result = await getPortalData(token);
      setData(result);
      setError(null);
      // Expand all events by default
      if (result.events?.length) {
        setExpandedEvents(new Set(result.events.map(e => e.id)));
      }
    } catch (err) {
      setError(err.response?.status === 404 ? 'Portal not found' : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Track portal visit
  useEffect(() => {
    if (token) trackPortalEvent(token, 'visit');
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">{error}</p>
          <p className="text-zinc-600 text-sm mt-2">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const themeMode = data.org_settings?.theme_mode || 'dark';
  const accentColor = data.org_settings?.accent_color || '#ef4444';
  const t = THEMES[themeMode] || THEMES.dark;
  const orgName = data.org_settings?.org_name || '';

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
        trackPortalEvent(token, 'deliverable_view', eventId);
      }
      return next;
    });
  };

  // Separate portal deliverables linked to events vs unlinked
  const linkedDeliverables = (data.portal_deliverables || []).filter((d) => d.event_id);
  const unlinkedDeliverables = (data.portal_deliverables || []).filter((d) => !d.event_id);

  return (
    <div className={`min-h-screen ${t.bg} ${t.text}`} style={{ '--accent': accentColor }}>
      {/* Header */}
      <header className={`border-b ${t.border} px-6 py-5`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {orgName && <p className={`text-xs font-bold uppercase tracking-widest ${t.textSecondary}`}>{orgName}</p>}
            <h1 className="text-xl font-bold mt-0.5">{data.project_code}</h1>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
            style={{ backgroundColor: accentColor }}
          >
            {data.status}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* Project Overview */}
        <section>
          <div className={`rounded-2xl border ${t.card} p-6`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.client_name && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary} mb-1`}>Client</p>
                  <p className="font-semibold">{data.client_name}</p>
                </div>
              )}
              {data.vertical && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary} mb-1`}>Type</p>
                  <p className="font-semibold capitalize">{data.vertical}</p>
                </div>
              )}
              {data.created_on && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${t.textSecondary} mb-1`}>Created</p>
                  <p className="font-semibold">{new Date(data.created_on).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Event Timeline */}
        {data.events?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: accentColor }} />
              Events
            </h2>
            <div className="space-y-3">
              {data.events.map((event) => {
                const isExpanded = expandedEvents.has(event.id);
                const eventPortalDeliverables = linkedDeliverables.filter((d) => d.event_id === event.id);
                const hasContent = eventPortalDeliverables.length > 0;

                return (
                  <div key={event.id} className={`rounded-xl border ${t.card} overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => hasContent && toggleEvent(event.id)}
                      className={`w-full p-4 text-left ${hasContent ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          {hasContent && (
                            isExpanded
                              ? <ChevronDown className={`w-4 h-4 mt-1 shrink-0 ${t.textSecondary}`} />
                              : <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${t.textSecondary}`} />
                          )}
                          <div>
                            <p className="font-bold">{event.type}</p>
                            {event.venue_name && (
                              <p className={`text-sm ${t.textSecondary} flex items-center gap-1 mt-1`}>
                                <MapPin className="w-3.5 h-3.5" /> {event.venue_name}
                                {event.venue_location && <span> &middot; {event.venue_location}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`text-right text-sm ${t.textSecondary} shrink-0`}>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(event.start_date).toLocaleDateString()}
                          </p>
                          {event.end_date && event.end_date !== event.start_date && (
                            <p className="text-xs mt-0.5">to {new Date(event.end_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`px-4 pb-4 space-y-3 border-t ${t.border} pt-4`}>
                        {eventPortalDeliverables.map((d) => (
                          <DeliverableCard
                            key={d.id}
                            deliverable={d}
                            token={token}
                            t={t}
                            accentColor={accentColor}
                            onRefresh={fetchData}
                            watermarkText={data.portal_watermark_text || 'CONFIDENTIAL'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Unlinked Deliverables */}
        {unlinkedDeliverables.length > 0 && (
          <section>
            <h2 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: accentColor }} />
              Deliverables
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlinkedDeliverables.map((d) => (
                <DeliverableCard
                  key={d.id}
                  deliverable={d}
                  token={token}
                  t={t}
                  accentColor={accentColor}
                  onRefresh={fetchData}
                  watermarkText={data.portal_watermark_text || 'CONFIDENTIAL'}
                />
              ))}
            </div>
          </section>
        )}

        {data.portal_deliverables?.length === 0 && !data.events?.length && (
          <section className="text-center py-16">
            <FileText className={`w-12 h-12 mx-auto ${t.textSecondary} mb-3`} />
            <p className={`${t.textSecondary}`}>No deliverables shared yet.</p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t ${t.border} px-6 py-6 mt-10`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className={`text-xs ${t.textSecondary}`}>
            {orgName ? `${orgName} Client Portal` : 'Client Portal'}
          </p>
          <a
            href="https://yugenhub.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${t.textSecondary} flex items-center gap-1 hover:opacity-80`}
          >
            Powered by YugenHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
