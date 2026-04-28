import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPortalData, approveDeliverable, submitFeedback, getDownloadUrl, trackPortalEvent } from '../api/portal';
import { Check, Clock, MessageSquare, Send, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Download, FileText, Image, Video, File, MapPin, Calendar, ExternalLink, X, Play, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
function ThumbnailGrid({ files, onFileClick, onShowAll, onDownloadAll, downloadProgress, t, token, deliverable, watermarkText }) {
  const mediaFiles = files.filter(isMedia);
  const nonMediaFiles = files.filter(f => !isMedia(f));
  const maxVisible = 4;
  const visibleMedia = mediaFiles.slice(0, maxVisible);
  const extraCount = mediaFiles.length - maxVisible;

  const isSingle = visibleMedia.length === 1;
  const singleFile = isSingle ? visibleMedia[0] : null;
  const isSingleVideo = isSingle && singleFile?.content_type?.startsWith('video/');

  const gridClass = isSingle ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div>
      {visibleMedia.length > 0 && (
        <div className={`grid ${gridClass} gap-0.5 overflow-hidden rounded-t-2xl`}>
          {visibleMedia.map((file, i) => {
            const isLast = i === maxVisible - 1 && extraCount > 0;
            const mediaIndex = files.indexOf(file);
            const isVideo = file.content_type?.startsWith('video/');

            // Single video/image: fixed height, object-contain so nothing gets cropped
            // Multiple files: fixed height grid (preview thumbnails, cropping acceptable)
            const cellClass = isSingle
              ? 'relative w-full h-52 overflow-hidden focus:outline-none group'
              : 'relative w-full h-44 overflow-hidden focus:outline-none group';

            return (
              <button
                key={file.id}
                type="button"
                onClick={() => isLast && onShowAll ? onShowAll() : onFileClick(mediaIndex)}
                className={cellClass}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {file.thumbnail_r2_url ? (
                      <img
                        src={file.thumbnail_r2_url}
                        alt={file.file_name}
                        loading="lazy"
                        className={`w-full h-full ${isSingle ? 'object-contain' : 'object-cover'}`}
                      />
                    ) : (
                      <video
                        src={file.r2_url}
                        className={`w-full h-full ${isSingle ? 'object-contain' : 'object-cover'}`}
                        muted
                        preload="metadata"
                      />
                    )}
                    {file.watermark_status === 'done' && <VideoWatermark text={watermarkText} />}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                      <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getThumbnailUrl(file)}
                    alt={file.file_name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
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
        <div className={`${visibleMedia.length > 0 ? 'px-4 pt-3' : 'px-4 pt-0'} space-y-1.5`}>
          {nonMediaFiles.map((file) => {
            const Icon = getFileIcon(file.content_type);
            const downloadUrl = token && deliverable ? getDownloadUrl(token, deliverable.id, file.id) : file.r2_url;
            return (
              <a
                key={file.id}
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg border ${t.border} transition-colors ${t.hover}`}
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
          <div className="px-4 pt-2">
            <button
              type="button"
              onClick={onDownloadAll}
              disabled={!!downloadProgress}
              className={`flex items-center gap-2 text-xs font-medium ${t.textSecondary} ${t.hover} px-3 py-2 rounded-lg transition-colors disabled:opacity-50`}
            >
              <Download className="w-3.5 h-3.5" />
              {downloadProgress
                ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...`
                : `Download All (${downloadableCount} files)`}
            </button>
          </div>
        );
      })()}
      {/* Download limit/disabled messages */}
      {deliverable?.downloads_disabled && (
        <div className="px-4 pt-3">
          <p className={`flex items-center gap-1.5 text-xs ${t.textSecondary}`}>
            <Ban className="w-3.5 h-3.5" /> Downloads are disabled for this deliverable
          </p>
        </div>
      )}
      {!deliverable?.downloads_disabled && deliverable?.max_downloads != null && deliverable?.download_count >= deliverable?.max_downloads && (
        <div className="px-4 pt-3">
          <p className={`text-xs ${t.textSecondary}`}>Download limit reached ({deliverable.download_count}/{deliverable.max_downloads})</p>
        </div>
      )}
      {!deliverable?.downloads_disabled && deliverable?.max_downloads != null && deliverable?.download_count < deliverable?.max_downloads && (
        <div className="px-4 pt-2">
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    try { return localStorage.getItem('portal_author_name') || ''; } catch { return ''; }
  });
  const [commentError, setCommentError] = useState('');
  const feedbackRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setShowFeedback(false);
    }
  }, [isOpen, initialIndex]);

  // Reset feedback panel and image loaded state when changing files
  useEffect(() => {
    setShowFeedback(false);
    setImageLoaded(false);
  }, [currentIndex]);

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

  // Preload adjacent images for smooth swiping
  useEffect(() => {
    if (!isOpen) return;
    [currentIndex - 1, currentIndex + 1, currentIndex + 2]
      .filter(i => i >= 0 && i < files.length)
      .filter(i => files[i]?.content_type?.startsWith('image/'))
      .forEach(i => {
        const img = new window.Image();
        img.src = files[i].preview_r2_url || files[i].r2_url;
      });
  }, [isOpen, currentIndex, files]);

  // Auto-focus gallery container for accessibility
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => galleryRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !files.length) return null;

  const file = files[currentIndex];
  const type = file?.content_type || '';
  const fileFeedback = feedback.filter(f => f.file_id === file?.id);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    setCommentError('');
    try {
      await submitFeedback(token, deliverableId, commentText.trim(), authorName || undefined, file.id);
      setCommentText('');
      try { if (authorName) localStorage.setItem('portal_author_name', authorName); } catch { /* localStorage unavailable */ }
      onRefresh();
    } catch {
      setCommentError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80 && currentIndex > 0) setCurrentIndex(i => i - 1);
    else if (info.offset.x < -80 && currentIndex < files.length - 1) setCurrentIndex(i => i + 1);
  };

  return (
    <div ref={galleryRef} role="dialog" aria-modal="true" aria-label="Media gallery" tabIndex={-1} className="fixed inset-0 z-50 bg-black/95 flex flex-col outline-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-3 sm:px-4 text-white shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{file?.file_name}</span>
          <span className="text-xs text-white/40 shrink-0">{currentIndex + 1}/{files.length}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Feedback toggle button — always visible */}
          <button
            type="button"
            onClick={() => setShowFeedback(v => !v)}
            className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle comments"
            title="Comments"
          >
            <MessageSquare className="w-5 h-5" />
            {fileFeedback.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          {!downloadsDisabled && file.watermark_status !== 'done' && (
            <button
              type="button"
              onClick={() => downloadFile(getDownloadUrl(token, deliverableId, file.id), file.file_name)}
              className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Download file"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close gallery"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center: media display + nav */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-0">
        {/* Desktop nav arrows */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors hidden sm:flex"
            aria-label="Previous file"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={currentIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full h-full flex items-center justify-center px-2 sm:px-12 cursor-grab active:cursor-grabbing"
        >
          {type.startsWith('image/') && (
            <div className="relative w-full h-full flex items-center justify-center">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={file.preview_r2_url || file.r2_url}
                alt={file.file_name}
                className={`max-w-full max-h-full object-contain select-none transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
          {type.startsWith('video/') && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={file.r2_url}
                controls
                className="max-w-full max-h-full"
                autoPlay
                playsInline
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
            <div className="text-center text-white px-6">
              <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium break-all">{file.file_name}</p>
              {!downloadsDisabled && (
                <button
                  type="button"
                  onClick={() => downloadFile(getDownloadUrl(token, deliverableId, file.id), file.file_name)}
                  className="mt-4 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
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
            className="absolute right-2 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors hidden sm:flex"
            aria-label="Next file"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Mobile: Instagram-style dot indicators (max 5 dots, sliding window) */}
        {files.length > 1 && (() => {
          const total = files.length;
          const maxDots = Math.min(total, 5);
          const windowStart = total <= 5 ? 0 : Math.max(0, Math.min(currentIndex - 2, total - 5));
          const visibleIndices = Array.from({ length: maxDots }, (_, i) => windowStart + i);
          return (
            <div className="flex items-center gap-1.5 py-3 sm:hidden shrink-0">
              {visibleIndices.map((idx) => {
                const dist = Math.abs(idx - currentIndex);
                const isActive = idx === currentIndex;
                const sizeClass = isActive ? 'w-4 h-1.5' : dist === 1 ? 'w-1.5 h-1.5' : 'w-1 h-1';
                const colorClass = isActive ? 'bg-white' : dist === 1 ? 'bg-white/50' : 'bg-white/30';
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to file ${idx + 1}`}
                    className={`rounded-full transition-all duration-200 ${sizeClass} ${colorClass}`}
                  />
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Bottom: per-file feedback panel — collapsible on mobile, always visible on sm+ */}
      <AnimatePresence>
        {(showFeedback) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-black/70 border-t border-white/10 overflow-hidden shrink-0"
          >
            <div className="px-4 py-3">
              {fileFeedback.length > 0 && (
                <div ref={feedbackRef} className="max-h-40 overflow-y-auto space-y-2 mb-3 px-1">
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
              <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
                {!authorName && (
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-base sm:text-sm outline-none placeholder-white/40 focus:ring-2 focus:ring-white/30"
                  />
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Comment on this file..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-base sm:text-sm outline-none placeholder-white/40 focus:ring-2 focus:ring-white/30"
                  />
                  <button
                    type="submit"
                    disabled={sending || !commentText.trim()}
                    className="px-3 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {commentError && <p className="text-xs text-red-400">{commentError}</p>}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* On sm+: always show feedback panel */}
      <div className="hidden sm:block bg-black/60 border-t border-white/10 px-4 py-3 shrink-0">
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
        <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
          {!authorName && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none placeholder-white/40 focus:ring-2 focus:ring-white/30"
            />
          )}
          <div className="flex gap-2">
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
          </div>
          {commentError && <p className="text-xs text-red-400">{commentError}</p>}
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
            className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
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

// --- MediaGridModal: Full-screen grid view of all media ---
function MediaGridModal({ files, isOpen, onClose, onFileClick, t }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !files.length) return null;

  const mediaFiles = files.filter(isMedia);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/95 flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">{mediaFiles.length} Photos & Videos</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-1.5">
            {mediaFiles.map((file) => {
              const fileIndex = files.indexOf(file);
              const isVideoFile = file.content_type?.startsWith('video/');
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onFileClick(fileIndex)}
                  className="relative aspect-square overflow-hidden rounded-lg group focus:outline-none"
                >
                  {isVideoFile ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      {file.thumbnail_r2_url ? (
                        <img
                          src={file.thumbnail_r2_url}
                          alt={file.file_name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={file.r2_url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={getThumbnailUrl(file)}
                      alt={file.file_name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeliverableCard({ deliverable, token, t, accentColor, onRefresh, watermarkText }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showGridModal, setShowGridModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [authorName, setAuthorName] = useState(() => {
    try { return localStorage.getItem('portal_author_name') || ''; } catch { return ''; }
  });
  const sc = STATUS_COLORS[deliverable.status] || STATUS_COLORS.Pending;

  const generalFeedback = (deliverable.feedback || []).filter(f => !f.file_id);

  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(''), 5000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await approveDeliverable(token, deliverable.id);
      onRefresh();
    } catch {
      setErrorMsg('Failed to approve. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await submitFeedback(token, deliverable.id, feedbackText.trim(), authorName || undefined);
      setFeedbackText('');
      try { if (authorName) localStorage.setItem('portal_author_name', authorName); } catch { /* localStorage unavailable */ }
      onRefresh();
    } catch {
      setErrorMsg('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (deliverable.downloads_disabled) return;
    const downloadable = (deliverable.files || []).filter(f => f.watermark_status !== 'done');
    if (!downloadable.length) return;
    setDownloadProgress({ current: 0, total: downloadable.length });
    for (let i = 0; i < downloadable.length; i++) {
      downloadFile(getDownloadUrl(token, deliverable.id, downloadable[i].id), downloadable[i].file_name);
      setDownloadProgress({ current: i + 1, total: downloadable.length });
      if (i < downloadable.length - 1) await new Promise(r => setTimeout(r, 600));
    }
    setTimeout(() => setDownloadProgress(null), 2000);
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
            onShowAll={() => setShowGridModal(true)}
            onDownloadAll={deliverable.files.length > 1 ? handleDownloadAll : null}
            downloadProgress={downloadProgress}
            t={t}
            token={token}
            deliverable={deliverable}
            watermarkText={watermarkText}
          />
        )}

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-base sm:text-lg ${t.text}`}>{deliverable.title}</h3>
              {deliverable.description && (
                <p className={`text-sm mt-1 ${t.textSecondary}`}>{deliverable.description}</p>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {deliverable.status}
            </span>
          </div>

          {/* Gallery link for Digital Album deliverables */}
          {deliverable.gallery_url && (
            <a
              href={deliverable.gallery_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 w-full justify-center min-h-[44px]"
              style={{ backgroundColor: accentColor }}
            >
              <ExternalLink className="w-4 h-4" /> View Gallery
            </a>
          )}

          {/* Actions — only show when files have been uploaded */}
          {deliverable.files?.length > 0 && (
            <>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {deliverable.status !== 'Approved' && (
                    <button
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={loading}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 min-h-[44px]"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${t.badge} transition-colors ${t.hover} min-h-[44px]`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {generalFeedback.length > 0 ? `Feedback (${generalFeedback.length})` : 'Feedback'}
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
                {showApproveConfirm && (
                  <div className={`p-4 rounded-xl border ${t.card} shadow-lg`}>
                    <p className={`text-sm font-medium ${t.text} mb-3`}>Approve &ldquo;{deliverable.title}&rdquo;?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowApproveConfirm(false); handleApprove(); }}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowApproveConfirm(false)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${t.badge} transition-colors ${t.hover}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
              </div>

              {/* Feedback thread — scrollable */}
              {expanded && (
                <div className="mt-4">
                  {generalFeedback.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      <FeedbackThread feedback={generalFeedback} t={t} accentColor={accentColor} />
                    </div>
                  )}
                  <form onSubmit={handleFeedback} className="mt-3 flex flex-col gap-2">
                    {!authorName && (
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Your name..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-base sm:text-sm outline-none focus:ring-2 ${t.input}`}
                        style={{ '--tw-ring-color': accentColor }}
                      />
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Leave feedback..."
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-base sm:text-sm outline-none focus:ring-2 ${t.input}`}
                        style={{ '--tw-ring-color': accentColor }}
                      />
                      <button
                        type="submit"
                        disabled={loading || !feedbackText.trim()}
                        className="px-3 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 min-h-[44px] min-w-[44px]"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Grid modal — tile view of all media */}
      <MediaGridModal
        files={deliverable.files || []}
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        onFileClick={(index) => {
          setShowGridModal(false);
          handleFileClick(index);
        }}
        t={t}
      />
    </>
  );
}

function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-5 w-32 bg-zinc-800 rounded" />
          </div>
          <div className="h-6 w-20 bg-zinc-800 rounded-full" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="space-y-2"><div className="h-3 w-12 bg-zinc-800 rounded" /><div className="h-4 w-20 bg-zinc-800 rounded" /></div>)}
        </div>
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 h-24" />)}
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 h-64" />
      </div>
    </div>
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

  if (loading) return <PortalSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
          <p className="text-white text-lg font-semibold">{error}</p>
          <p className="text-zinc-500 text-sm mt-2">Please check the link and try again.</p>
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
      <header className={`border-b ${t.border} px-4 py-4 sm:px-6 sm:py-5`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <img src="/yugen_logo_ui.png" alt="YugenHub" className="h-8 w-8 rounded-lg shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold leading-tight uppercase tracking-wide" style={{ color: accentColor }}>
                {orgName ? `${orgName} Gallery` : 'Yugen Gallery'}
              </h1>
              {data.project_code && (
                <p className={`text-xs ${t.textSecondary} mt-0.5`}>{data.project_code}</p>
              )}
            </div>
          </div>
          <span
            className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
            style={{ backgroundColor: accentColor }}
          >
            {data.status}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Portal Heading & Description */}
        {(data.portal_heading || data.portal_description) && (
          <section>
            <div className={`rounded-2xl border ${t.card} p-4 sm:p-6`}>
              {data.portal_heading && (
                <h2 className="text-lg sm:text-xl font-bold leading-snug mb-1" style={{ color: accentColor }}>
                  {data.portal_heading}
                </h2>
              )}
              {data.portal_description && (
                <p className={`text-sm sm:text-base leading-relaxed ${t.textSecondary}`}>
                  {data.portal_description}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Gallery CTA — shown when linked album is published */}
        {data.gallery_url && (
          <section>
            <a
              href={data.gallery_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 transition-all group"
              style={{
                borderColor: accentColor + '44',
                backgroundColor: accentColor + '0d',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accentColor + '22' }}>
                  <svg className="w-5 h-5" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base" style={{ color: accentColor }}>View Your Gallery</p>
                  <p className={`text-xs ${t.textSecondary} mt-0.5`}>Your photos are ready — explore the full gallery</p>
                </div>
              </div>
              <svg className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </section>
        )}

        {/* Event Timeline */}
        {data.events?.length > 0 && (
          <section>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accentColor }} />
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
                      className={`w-full p-4 text-left ${hasContent ? 'cursor-pointer' : 'cursor-default'} min-h-[56px]`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {hasContent && (
                            isExpanded
                              ? <ChevronDown className={`w-4 h-4 mt-0.5 shrink-0 ${t.textSecondary}`} />
                              : <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${t.textSecondary}`} />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-base">{event.type}</p>
                            {event.venue_name && (
                              <p className={`text-xs sm:text-sm ${t.textSecondary} flex items-center gap-1 mt-0.5`}>
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{event.venue_name}{event.venue_location && ` · ${event.venue_location}`}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`text-right text-xs ${t.textSecondary} shrink-0`}>
                          <p className="flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(event.start_date).toLocaleDateString()}
                          </p>
                          {event.end_date && event.end_date !== event.start_date && (
                            <p className="mt-0.5">to {new Date(event.end_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={`px-3 pb-3 sm:px-4 sm:pb-4 space-y-3 border-t ${t.border} pt-3 sm:pt-4`}>
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
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accentColor }} />
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
      <footer className={`border-t ${t.border} px-4 py-5 sm:px-6 mt-10`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className={`text-xs ${t.textSecondary}`}>
            {orgName ? `${orgName} Client Portal` : 'Client Portal'}
          </p>
          <a
            href="https://yugenhub.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs ${t.textSecondary} flex items-center gap-1.5 hover:opacity-80`}
          >
            <img src="/yugen_logo_ui.png" alt="YugenHub" className="h-4 w-4 rounded" />
            Powered by YugenHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
