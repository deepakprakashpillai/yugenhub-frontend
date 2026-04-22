import { useNavigate } from 'react-router-dom';
import SlideOver from '../modals/SlideOver';
import { Image, Video, FileText, File, Download, RefreshCw, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const SOURCE_BADGES = {
    deliverable: { label: 'Deliverable', color: 'bg-blue-500/20 text-blue-400' },
    album: { label: 'Album', color: 'bg-purple-500/20 text-purple-400' },
    direct: { label: 'Direct Upload', color: 'bg-green-500/20 text-green-400' },
};

const PROCESSING_STATUS_LABELS = {
    pending: { label: 'Queued', color: 'text-amber-400' },
    processing: { label: 'Processing…', color: 'text-blue-400' },
    done: { label: 'Done', color: 'text-emerald-400' },
    failed: { label: 'Failed', color: 'text-red-400' },
    'n/a': { label: '—', color: '' },
};

function FileThumbnail({ item }) {
    const { theme } = useTheme();
    if (item.thumbnail_r2_url && item.thumbnail_status === 'done') {
        return (
            <img
                src={item.thumbnail_r2_url}
                alt={item.name}
                className="w-full h-full object-contain"
            />
        );
    }
    const cls = `${theme.text.secondary}`;
    if (item.content_type?.startsWith('image/')) return <Image size={48} className={cls} />;
    if (item.content_type?.startsWith('video/')) return <Video size={48} className={cls} />;
    if (item.content_type === 'application/pdf') return <FileText size={48} className={cls} />;
    return <File size={48} className={cls} />;
}

export default function FileInfoPanel({ isOpen, onClose, item, onDownload, onRetry }) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    if (!item) return null;

    const source = SOURCE_BADGES[item.source] || SOURCE_BADGES.direct;
    const needsProcessing = item.content_type?.startsWith('image/') || item.content_type?.startsWith('video/');
    const thumbFailed = needsProcessing && item.thumbnail_status === 'failed';
    const previewFailed = item.content_type?.startsWith('image/') && item.preview_status === 'failed';
    const showRetry = thumbFailed || previewFailed;

    const thumbInfo = PROCESSING_STATUS_LABELS[item.thumbnail_status] || PROCESSING_STATUS_LABELS['n/a'];
    const previewInfo = PROCESSING_STATUS_LABELS[item.preview_status] || PROCESSING_STATUS_LABELS['n/a'];

    const meta = [
        { label: 'Name', value: item.name },
        { label: 'Type', value: item.content_type || '—' },
        { label: 'Size', value: formatBytes(item.size_bytes) },
        { label: 'Uploaded', value: formatDate(item.created_at) },
        { label: 'Uploaded by', value: item.uploaded_by_name || item.uploaded_by || '—' },
    ];

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="File Info" width="max-w-sm">
            <div className="p-5 space-y-5">
                {/* Thumbnail or icon */}
                <div className={`w-full aspect-video rounded-xl flex items-center justify-center ${theme.canvas.bg} border ${theme.canvas.border} overflow-hidden`}>
                    <FileThumbnail item={item} />
                </div>

                {/* Metadata rows */}
                <div className={`rounded-xl border ${theme.canvas.border} divide-y ${theme.canvas.border}`}>
                    {meta.map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                            <span className={`text-xs font-semibold ${theme.text.secondary} shrink-0`}>{label}</span>
                            <span className={`text-xs ${theme.text.primary} text-right break-all`}>{value}</span>
                        </div>
                    ))}
                </div>

                {/* Processing status */}
                {needsProcessing && (
                    <div className={`rounded-xl border ${theme.canvas.border} divide-y ${theme.canvas.border}`}>
                        <div className="flex items-center justify-between px-4 py-2.5">
                            <span className={`text-xs font-semibold ${theme.text.secondary}`}>Thumbnail</span>
                            <span className={`text-xs font-medium ${thumbInfo.color}`}>{thumbInfo.label}</span>
                        </div>
                        {item.content_type?.startsWith('image/') && (
                            <div className="flex items-center justify-between px-4 py-2.5">
                                <span className={`text-xs font-semibold ${theme.text.secondary}`}>Preview</span>
                                <span className={`text-xs font-medium ${previewInfo.color}`}>{previewInfo.label}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Retry processing */}
                {showRetry && (
                    <button
                        onClick={() => onRetry?.(item)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border ${theme.canvas.border} text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors`}
                    >
                        <RefreshCw size={13} />
                        Retry Processing
                    </button>
                )}

                {/* Source badge + project link */}
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${theme.text.secondary}`}>Source</span>
                    <div className="flex items-center gap-2">
                        {item.source === 'deliverable' && item.source_project_id && (
                            <button
                                onClick={() => { onClose(); navigate(`/projects/${item.source_project_id}`); }}
                                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <ExternalLink size={10} />
                                View project
                            </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${source.color}`}>
                            {source.label}
                        </span>
                    </div>
                </div>

                {/* Share status */}
                {item.share_url && (
                    <div className={`flex items-center justify-between py-2 border-t ${theme.canvas.border}`}>
                        <span className={`text-xs font-semibold ${theme.text.secondary}`}>Shared</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            Active
                        </span>
                    </div>
                )}

                {/* Download */}
                <button
                    onClick={() => onDownload(item)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold"
                >
                    <Download size={15} />
                    Download
                </button>
            </div>
        </SlideOver>
    );
}
