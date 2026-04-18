import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import {
  getDeliverables,
  deleteDeliverable,
  deleteFileFromDeliverable,
  addTeamFeedback,
  generatePortalToken,
  replaceFile,
  getUploadUrl,
  toggleFileWatermark,
  attachMediaToDeliverable,
} from '../../api/projects';
import FileUpload, { FileList } from './FileUpload';
import DownloadLimitSettings from './DownloadLimitSettings';
import VersionHistory from './VersionHistory';
import PortalAnalyticsSlideOver from './PortalAnalyticsSlideOver';
import MediaPickerModal from '../media/MediaPickerModal';
import { Trash2, Link, MessageSquare, Send, ChevronDown, ChevronUp, Package, Loader2, Calendar, FileText, BarChart3, Eye, X, Stamp, RefreshCw, ChevronLeft, ChevronRight, Play, HardDrive } from 'lucide-react';

const isMediaFile = (f) => f.content_type?.startsWith('image/') || f.content_type?.startsWith('video/');

// --- MediaLightbox: simple fullscreen viewer for team view ---
function MediaLightbox({ files, index, onClose, onIndexChange }) {
  const file = files[index];
  if (!file) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white text-sm font-medium truncate max-w-xs">{file.file_name}</span>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">{index + 1} / {files.length}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-12" onClick={e => e.stopPropagation()}>
        {index > 0 && (
          <button onClick={() => onIndexChange(index - 1)} className="absolute left-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {file.content_type?.startsWith('image/') && (
          <img src={file.r2_url} alt={file.file_name} className="max-w-full max-h-full object-contain" />
        )}
        {file.content_type?.startsWith('video/') && (
          <video src={file.r2_url} controls autoPlay className="max-w-full max-h-full" />
        )}
        {index < files.length - 1 && (
          <button onClick={() => onIndexChange(index + 1)} className="absolute right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

// --- ThumbnailCell: single thumbnail with hover actions ---
// eslint-disable-next-line no-unused-vars
function ThumbnailCell({ file, index, onOpen, onDelete, onReplace, onToggleWatermark, togglingWatermarkId, replacingFileId, theme }) {
  const isVideo = file.content_type?.startsWith('video/');
  const wmDone = file.watermark_status === 'done';
  const wmProcessing = file.watermark_status === 'processing';
  const src = file.thumbnail_r2_url || file.r2_url;

  return (
    <div className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden bg-black">
      {isVideo ? (
        <>
          {file.thumbnail_r2_url
            ? <img src={src} alt={file.file_name} className="w-full h-full object-cover" />
            : <video src={file.r2_url} className="w-full h-full object-cover" muted preload="metadata" />
          }
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            </div>
          </div>
        </>
      ) : (
        <img src={src} alt={file.file_name} className="w-full h-full object-cover" />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors rounded-lg" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Open */}
        <button
          type="button"
          onClick={() => onOpen(index)}
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors"
          title="View"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <div className="flex gap-1.5">
          {/* Watermark (video only) */}
          {isVideo && (
            <button
              type="button"
              onClick={() => onToggleWatermark(file.id, !wmDone)}
              disabled={togglingWatermarkId === file.id || wmProcessing}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${wmDone ? 'bg-amber-500/80 text-white' : 'bg-white/15 hover:bg-white/30 text-white'}`}
              title={wmDone ? 'Remove watermark' : 'Add watermark'}
            >
              {togglingWatermarkId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stamp className="w-3.5 h-3.5" />}
            </button>
          )}
          {/* Replace */}
          <label className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer" title="Replace">
            {replacingFileId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) onReplace(file.id, e.target.files[0]); }} disabled={replacingFileId === file.id} />
          </label>
          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-red-500/80 text-white transition-colors"
            title="Delete"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Version badge */}
      {file.version > 1 && (
        <span className="absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded bg-black/60 text-white font-medium">v{file.version}</span>
      )}
    </div>
  );
}

// --- AllFilesModal: full-screen grid of all thumbnails ---
function AllFilesModal({ files, onClose, onOpen, onDelete, onReplace, onToggleWatermark, togglingWatermarkId, replacingFileId, theme }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white font-semibold">{files.length} files</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5" onClick={e => e.stopPropagation()}>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
          {files.map((file, i) => (
            <ThumbnailCell
              key={file.id}
              file={file}
              index={i}
              onOpen={onOpen}
              onDelete={onDelete}
              onReplace={onReplace}
              onToggleWatermark={onToggleWatermark}
              togglingWatermarkId={togglingWatermarkId}
              replacingFileId={replacingFileId}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- MediaThumbnailGrid: inline 1-row preview ---
const MAX_PREVIEW = 6;
function MediaThumbnailGrid({ files, onOpen, onOpenAll, onDelete, onReplace, onToggleWatermark, togglingWatermarkId, replacingFileId, theme }) {
  const overflow = files.length - MAX_PREVIEW;
  const visible = overflow > 0 ? files.slice(0, MAX_PREVIEW) : files;

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
      {visible.map((file, i) => (
        <ThumbnailCell
          key={file.id}
          file={file}
          index={i}
          onOpen={onOpen}
          onDelete={onDelete}
          onReplace={onReplace}
          onToggleWatermark={onToggleWatermark}
          togglingWatermarkId={togglingWatermarkId}
          replacingFileId={replacingFileId}
          theme={theme}
        />
      ))}
      {overflow > 0 && (
        <button
          type="button"
          onClick={onOpenAll}
          className="aspect-square rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>+{overflow}</span>
        </button>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  Pending: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
  Uploaded: { bg: 'bg-blue-500/15', text: 'text-blue-500', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  Approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  'Changes Requested': { bg: 'bg-amber-500/15', text: 'text-amber-500', border: 'border-amber-500/30', dot: 'bg-amber-500' },
};

function DeliverableCard({ deliverable, projectId, onRefresh, theme }) {
  const [expanded, setExpanded] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState((deliverable.files?.length || 0) <= 3);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [replacingFileId, setReplacingFileId] = useState(null);
  const [togglingWatermarkId, setTogglingWatermarkId] = useState(null);
  const [watermarkModal, setWatermarkModal] = useState(null); // { fileId }
  const [watermarkText, setWatermarkText] = useState('');
  const [lightbox, setLightbox] = useState(null); // index
  const [allFilesOpen, setAllFilesOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sc = STATUS_COLORS[deliverable.status] || STATUS_COLORS.Pending;
  const allMedia = deliverable.files?.length > 0 && deliverable.files.every(isMediaFile);

  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFileFromDeliverable(projectId, deliverable.id, fileId);
      toast.success('File deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeliverable(projectId, deliverable.id);
      toast.success('Deliverable deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete deliverable');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setLoading(true);
    try {
      await addTeamFeedback(projectId, deliverable.id, feedbackText.trim());
      setFeedbackText('');
      toast.success('Feedback sent');
      onRefresh();
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatermark = (fileId, enabled) => {
    if (enabled) {
      setWatermarkText('');
      setWatermarkModal({ fileId });
    } else {
      applyWatermark(fileId, false, '');
    }
  };

  const applyWatermark = async (fileId, enabled, text) => {
    setWatermarkModal(null);
    setTogglingWatermarkId(fileId);
    try {
      await toggleFileWatermark(projectId, deliverable.id, fileId, enabled, text || undefined);
      toast.success(enabled ? 'Watermark enabled' : 'Watermark removed');
      onRefresh();
    } catch {
      toast.error('Failed to update watermark');
    } finally {
      setTogglingWatermarkId(null);
    }
  };

  const handleAttachMedia = async (mediaItem) => {
    try {
      await attachMediaToDeliverable(projectId, deliverable.id, mediaItem.id);
      toast.success('File attached from Media library');
      onRefresh();
    } catch {
      toast.error('Failed to attach file');
      throw new Error('Attach failed');
    }
  };

  const handleReplaceFile = async (fileId, file) => {
    setReplacingFileId(fileId);
    try {
      // Get upload URL
      const { r2_key, upload_url, r2_url } = await getUploadUrl(projectId, file.name, file.type);
      // Upload to R2
      await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      // Register replacement
      const changeNotes = prompt('Change notes (optional):') || '';
      await replaceFile(projectId, deliverable.id, fileId, {
        file_name: file.name,
        content_type: file.type,
        r2_key,
        r2_url,
        change_notes: changeNotes,
        reset_downloads: true,
      });
      toast.success('File replaced');
      onRefresh();
    } catch {
      toast.error('Failed to replace file');
    } finally {
      setReplacingFileId(null);
    }
  };

  return (
    <div className={`rounded-2xl border ${theme.canvas.card} ${theme.canvas.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold ${theme.text.primary}`}>{deliverable.title}</h4>
            {deliverable.description && !deliverable.description.startsWith('Deliverable for ') && (
              <p className={`text-sm mt-0.5 ${theme.text.secondary}`}>{deliverable.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {deliverable.status}
            </span>
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-red-500 transition-colors`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Files */}
        <div className="mt-4">
          {deliverable.files?.length > 0 ? (
            <>
              {allMedia ? (
                <MediaThumbnailGrid
                  files={deliverable.files}
                  onOpen={(i) => { setAllFilesOpen(false); setLightbox(i); }}
                  onOpenAll={() => setAllFilesOpen(true)}
                  onDelete={handleDeleteFile}
                  onReplace={handleReplaceFile}
                  onToggleWatermark={handleToggleWatermark}
                  togglingWatermarkId={togglingWatermarkId}
                  replacingFileId={replacingFileId}
                  theme={theme}
                />
              ) : (
                <>
                  {deliverable.files.length > 3 && (
                    <button
                      onClick={() => setFilesExpanded(!filesExpanded)}
                      className={`flex items-center gap-2 text-sm ${theme.text.secondary} ${theme.canvas.hover} px-3 py-1.5 rounded-lg transition-colors mb-2`}
                    >
                      {filesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {filesExpanded ? 'Hide' : `Show ${deliverable.files.length}`} files
                    </button>
                  )}
                  {filesExpanded && (
                    <>
                      <FileList
                        files={deliverable.files}
                        onDelete={handleDeleteFile}
                        onReplace={handleReplaceFile}
                        replacingFileId={replacingFileId}
                        onToggleWatermark={handleToggleWatermark}
                        togglingWatermarkId={togglingWatermarkId}
                        theme={theme}
                      />
                      {deliverable.files.some(f => f.previous_versions?.length > 0) && (
                        <div className="mt-1 space-y-0.5">
                          {deliverable.files.map((file) => (
                            <VersionHistory key={file.id} file={file} theme={theme} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              <div className="flex items-center gap-2 mt-2">
                <FileUpload
                  projectId={projectId}
                  deliverableId={deliverable.id}
                  onUploadComplete={onRefresh}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${theme.canvas.border} ${theme.canvas.hover} ${theme.text.secondary} transition-colors shrink-0`}
                >
                  <HardDrive size={12} />
                  From Media
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <FileUpload projectId={projectId} deliverableId={deliverable.id} onUploadComplete={onRefresh} />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${theme.canvas.border} ${theme.canvas.hover} ${theme.text.secondary} transition-colors`}
              >
                <HardDrive size={12} />
                Select from Media
              </button>
            </div>
          )}
        </div>

        {/* Download Limits + Feedback toggle — same row */}
        <div className="flex items-center justify-between gap-3 mt-1">
          <DownloadLimitSettings
            projectId={projectId}
            deliverable={deliverable}
            onRefresh={onRefresh}
            theme={theme}
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className={`shrink-0 flex items-center gap-2 text-sm ${theme.text.secondary} ${theme.canvas.hover} px-3 py-1.5 rounded-lg transition-colors`}
          >
            <MessageSquare className="w-4 h-4" />
            Feedback ({deliverable.feedback?.length || 0})
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3">
            {deliverable.feedback?.length > 0 && (
              <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                {deliverable.feedback.map((entry) => {
                  const linkedFile = entry.file_id
                    ? deliverable.files?.find(f => f.id === entry.file_id)
                    : null;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-lg p-3 text-sm ${
                        entry.author_type === 'team' ? `${theme.canvas.card} border ${theme.canvas.border}` : 'bg-accent/10'
                      }`}
                      style={entry.author_type === 'client' ? { backgroundColor: 'var(--accent-glow)' } : undefined}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${theme.text.secondary}`}>
                          {entry.author_name || (entry.author_type === 'client' ? 'Client' : 'Team')}
                        </span>
                        <span className={`text-[10px] ${theme.text.secondary}`}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        {linkedFile && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${theme.canvas.card} border ${theme.canvas.border}`}>
                            <FileText className="w-2.5 h-2.5" /> {linkedFile.file_name}
                          </span>
                        )}
                      </div>
                      <p className={theme.text.primary}>{entry.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <form onSubmit={handleFeedback} className="flex gap-2">
              <input
                type="text"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Reply to client..."
                className={`flex-1 px-4 py-2 rounded-lg border text-sm outline-none ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
              />
              <button
                type="submit"
                disabled={loading || !feedbackText.trim()}
                className="px-3 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* All files modal */}
      {allFilesOpen && (
        <AllFilesModal
          files={deliverable.files}
          onClose={() => setAllFilesOpen(false)}
          onOpen={(i) => { setAllFilesOpen(false); setLightbox(i); }}
          onDelete={handleDeleteFile}
          onReplace={handleReplaceFile}
          onToggleWatermark={handleToggleWatermark}
          togglingWatermarkId={togglingWatermarkId}
          replacingFileId={replacingFileId}
          theme={theme}
        />
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <MediaLightbox
          files={deliverable.files}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}

      {/* Media picker */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAttachMedia}
      />

      {/* Watermark text modal */}
      {watermarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-xl ${theme.canvas.card} ${theme.canvas.border}`}>
            <h3 className={`font-semibold mb-1 ${theme.text.primary}`}>Set watermark text</h3>
            <p className={`text-xs mb-4 ${theme.text.secondary}`}>This text will be shown as a visual overlay on the video in the client portal.</p>
            <input
              type="text"
              autoFocus
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyWatermark(watermarkModal.fileId, true, watermarkText);
                if (e.key === 'Escape') setWatermarkModal(null);
              }}
              placeholder="e.g. CONFIDENTIAL, Draft, Client Name…"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none mb-4 ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setWatermarkModal(null)}
                className={`px-3 py-1.5 rounded-lg text-sm ${theme.text.secondary} ${theme.canvas.hover} transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyWatermark(watermarkModal.fileId, true, watermarkText)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Apply watermark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventSection({ title, deliverables, projectId, onRefresh, theme, defaultExpanded = true }) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div className={`rounded-xl border ${theme.canvas.border} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left ${theme.canvas.hover} transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} />
          <span className={`font-semibold text-sm ${theme.text.primary}`}>{title}</span>
          <span className={`text-xs ${theme.text.secondary}`}>({deliverables.length})</span>
        </div>
        {open ? <ChevronUp className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} /> : <ChevronDown className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} />}
      </button>
      {open && (
        <div className={`px-4 pb-4 space-y-4 border-t ${theme.canvas.border}`}>
          {deliverables.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              projectId={projectId}
              onRefresh={onRefresh}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeliverablesByEvent({ deliverables, events, projectId, onRefresh, theme }) {
  // Group deliverables by event_id
  const grouped = {};
  const unlinked = [];
  for (const d of deliverables) {
    if (d.event_id) {
      if (!grouped[d.event_id]) grouped[d.event_id] = [];
      grouped[d.event_id].push(d);
    } else {
      unlinked.push(d);
    }
  }

  // Order event groups by the event order in the events array
  const eventIdSet = new Set(events.map((ev) => ev.id));
  const eventSections = events
    .filter((ev) => grouped[ev.id]?.length > 0)
    .map((ev) => ({ event: ev, deliverables: grouped[ev.id] }));

  // Collect deliverables linked to events that no longer exist
  const orphaned = Object.entries(grouped)
    .filter(([eventId]) => !eventIdSet.has(eventId))
    .flatMap(([, dels]) => dels);

  // Combine unlinked + orphaned into the General section
  const generalDeliverables = [...unlinked, ...orphaned];

  return (
    <div className="space-y-4">
      {eventSections.map(({ event, deliverables: dels }) => (
        <EventSection
          key={event.id}
          title={event.type}
          deliverables={dels}
          projectId={projectId}
          onRefresh={onRefresh}
          theme={theme}
        />
      ))}
      {generalDeliverables.length > 0 && (
        <EventSection
          title="General"
          deliverables={generalDeliverables}
          projectId={projectId}
          onRefresh={onRefresh}
          theme={theme}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
export default function DeliverableManager({ projectId, events = [], project = {} }) {
  const { theme } = useTheme();
  const [deliverables, setDeliverables] = useState([]);
  const [portalToken, setPortalToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchDeliverables = useCallback(async () => {
    try {
      const data = await getDeliverables(projectId);
      setDeliverables(data.deliverables || []);
      setPortalToken(data.portal_token);
    } catch (err) {
      console.error('Failed to fetch deliverables:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchDeliverables(); }, [fetchDeliverables]);

  const handleCopyLink = async () => {
    let token = portalToken;
    if (!token) {
      try {
        const res = await generatePortalToken(projectId);
        token = res.portal_token;
        setPortalToken(token);
      } catch {
        toast.error('Failed to generate portal link');
        return;
      }
    }
    const url = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Portal link copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`w-6 h-6 animate-spin ${theme.text.secondary}`} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${theme.text.primary} uppercase tracking-wider flex items-center gap-2`}>
          <Package className={`w-5 h-5 ${theme.text.secondary}`} />
          Portal Deliverables ({deliverables.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(true)}
            className={`p-2 ${theme.canvas.button?.secondary || ''} border rounded-lg transition-colors ${theme.canvas.border}`}
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.button.secondary} border rounded-lg font-bold text-sm transition-colors`}
          >
            <Link className="w-4 h-4" /> Copy Portal Link
          </button>
        </div>
      </div>

      {/* Deliverables list — grouped by event */}
      {deliverables.length === 0 ? (
        <div className={`text-center py-12 ${theme.text.secondary}`}>
          <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No portal deliverables yet.</p>
          <p className="text-sm mt-1">Portal deliverables are auto-created when deliverable tasks are added.</p>
        </div>
      ) : (
        <DeliverablesByEvent
          deliverables={deliverables}
          events={events}
          projectId={projectId}
          onRefresh={fetchDeliverables}
          theme={theme}
        />
      )}

      {/* Analytics SlideOver */}
      <PortalAnalyticsSlideOver
        projectId={projectId}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        theme={theme}
      />
    </div>
  );
}
