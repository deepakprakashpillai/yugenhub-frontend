import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Video, File, Loader2, RefreshCw, Stamp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getUploadUrl, addFileToDeliverable } from '../../api/projects';

const FILE_ICONS = {
  image: Image,
  video: Video,
  pdf: FileText,
  default: File,
};

function getFileIcon(contentType) {
  if (contentType?.startsWith('image/')) return FILE_ICONS.image;
  if (contentType?.startsWith('video/')) return FILE_ICONS.video;
  if (contentType?.includes('pdf')) return FILE_ICONS.pdf;
  return FILE_ICONS.default;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

export default function FileUpload({ projectId, deliverableId, onUploadComplete, compact = false }) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileIndex, setFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;

    const fileArray = Array.from(files);
    const total = fileArray.reduce((sum, f) => sum + f.size, 0);

    setUploading(true);
    setTotalFiles(fileArray.length);
    setTotalBytes(total);
    setUploadedBytes(0);
    setProgress(0);

    let previousFilesBytes = 0;

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setFileIndex(i + 1);
        setCurrentFileName(file.name);

        // 1. Get presigned URL
        const { upload_url, r2_key, r2_url } = await getUploadUrl(projectId, file.name, file.type);

        // 2. PUT to R2 with progress tracking
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', upload_url);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const currentUploaded = previousFilesBytes + e.loaded;
              setUploadedBytes(currentUploaded);
              setProgress(total > 0 ? Math.round((currentUploaded / total) * 100) : 0);
            }
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(file);
        });

        previousFilesBytes += file.size;

        // 3. Save metadata
        await addFileToDeliverable(projectId, deliverableId, {
          file_name: file.name,
          content_type: file.type,
          r2_key,
          r2_url,
        });
      }
      onUploadComplete?.();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setProgress(0);
      setFileIndex(0);
      setTotalFiles(0);
      setUploadedBytes(0);
      setTotalBytes(0);
      setCurrentFileName('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Compact mode: small inline button, shown when files already exist
  if (compact) {
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${theme.text.secondary}`} />
            <span className={`text-xs ${theme.text.secondary}`}>
              {fileIndex}/{totalFiles} — {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
            </span>
            <div className={`flex-1 h-1 rounded-full overflow-hidden ${theme.canvas.border} max-w-24`}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-dashed transition-colors ${theme.canvas.border} ${theme.text.secondary} ${theme.canvas.hover}`}
          >
            <Upload className="w-3 h-3" />
            Add more files
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragOver ? 'border-accent bg-accent/5' : `${theme.canvas.border} ${theme.canvas.hover}`
      } ${uploading ? 'pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <div className="space-y-2">
          <Loader2 className={`w-6 h-6 mx-auto animate-spin ${theme.text.secondary}`} />
          <p className={`text-sm font-medium ${theme.text.primary}`}>
            Uploading {fileIndex}/{totalFiles}
          </p>
          <p className={`text-xs ${theme.text.secondary} truncate max-w-xs mx-auto`}>
            {currentFileName}
          </p>
          <p className={`text-xs ${theme.text.secondary}`}>
            {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
          </p>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme.canvas.border}`}>
            <div
              className="h-full rounded-full transition-all bg-accent"
              style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>
      ) : (
        <>
          <Upload className={`w-6 h-6 mx-auto mb-2 ${theme.text.secondary}`} />
          <p className={`text-sm ${theme.text.secondary}`}>
            Drop files here or <span className="font-semibold" style={{ color: 'var(--accent)' }}>browse</span>
          </p>
        </>
      )}
    </div>
  );
}

export function FileList({ files, onDelete, onReplace, replacingFileId, onToggleWatermark, togglingWatermarkId, theme }) {
  if (!files?.length) return null;

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.content_type);
        const isVideo = file.content_type?.startsWith('video/');
        const wmDone = file.watermark_status === 'done';
        const wmProcessing = file.watermark_status === 'processing';

        return (
          <div key={file.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${theme.canvas.card} ${theme.canvas.border}`}>
            {file.content_type?.startsWith('image/') ? (
              <img src={file.r2_url} alt={file.file_name} className="w-8 h-8 rounded object-cover shrink-0" />
            ) : (
              <Icon className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} />
            )}
            <a
              href={file.r2_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 text-sm truncate ${theme.text.primary} hover:underline min-w-0`}
            >
              {file.file_name}
              {file.version > 1 && (
                <span className={`ml-1.5 text-[10px] px-1 py-0.5 rounded font-medium align-middle ${theme.canvas.border} border`}>
                  v{file.version}
                </span>
              )}
            </a>
            {/* Watermark toggle — video files only */}
            {isVideo && onToggleWatermark && (
              <button
                onClick={() => onToggleWatermark(file.id, !wmDone)}
                disabled={togglingWatermarkId === file.id || wmProcessing}
                className={`shrink-0 flex items-center gap-1 text-xs px-1.5 py-1 rounded transition-colors ${
                  wmDone ? 'text-amber-500' : theme.text.secondary
                } ${theme.canvas.hover} disabled:opacity-40`}
                title={wmDone ? 'Remove watermark' : wmProcessing ? 'Processing…' : 'Add watermark'}
              >
                {wmProcessing || togglingWatermarkId === file.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Stamp className="w-3 h-3" />
                )}
              </button>
            )}
            {onReplace && (
              <label className={`shrink-0 flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded transition-colors ${theme.text.secondary} ${theme.canvas.hover}`}>
                {replacingFileId === file.id ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Replacing…</>
                ) : (
                  <><RefreshCw className="w-3 h-3" /> Replace</>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) onReplace(file.id, e.target.files[0]); }}
                  disabled={replacingFileId === file.id}
                />
              </label>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                className={`shrink-0 p-1 rounded-md ${theme.text.secondary} hover:text-red-500 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
