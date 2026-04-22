import { useState, useEffect } from 'react';
import { X, Link, Copy, Check, Trash2, RefreshCw, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { shareFolderCreate, shareFolderRevoke } from '../../api/media';

const EXPIRY_OPTIONS = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: 'Never', value: null },
];

function formatExpiry(expiresAt) {
    if (!expiresAt) return 'Never expires';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'Expired';
    return `Expires ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function ShareFolderModal({ isOpen, onClose, onRevoke, folder, theme }) {
    const [includeSubfolders, setIncludeSubfolders] = useState(false);
    const [allowDownload, setAllowDownload] = useState(true);
    const [expiryDays, setExpiryDays] = useState(7);
    const [shareUrl, setShareUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [revoking, setRevoking] = useState(false);

    // Sync settings from folder when modal opens or folder changes
    useEffect(() => {
        if (folder) {
            setIncludeSubfolders(folder.share_include_subfolders ?? false);
            setAllowDownload(folder.share_allow_download ?? true);
        }
    }, [folder]);

    useEffect(() => {
        if (!isOpen) { setShareUrl(null); setCopied(false); }
    }, [isOpen]);

    if (!isOpen || !folder) return null;

    const hasToken = !!folder.share_token;
    const existingUrl = hasToken
        ? `${window.location.origin}/folder-share/${folder.share_token}`
        : null;

    const displayUrl = shareUrl || existingUrl;
    const showingExistingLink = displayUrl && !shareUrl; // pre-existing link, not just generated

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const data = await shareFolderCreate(folder.id, {
                expires_in_days: expiryDays,
                include_subfolders: includeSubfolders,
                allow_download: allowDownload,
            });
            setShareUrl(data.share_url);
            toast.success(hasToken ? 'New share link created — old link is now invalid' : 'Share link created');
        } catch {
            toast.error('Failed to create share link');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async () => {
        setRevoking(true);
        try {
            await shareFolderRevoke(folder.id);
            setShareUrl(null);
            toast.success('Share link revoked');
            onRevoke?.();
            onClose();
        } catch {
            toast.error('Failed to revoke share link');
        } finally {
            setRevoking(false);
        }
    };

    const handleCopy = () => {
        if (!displayUrl) return;
        navigator.clipboard.writeText(displayUrl);
        setCopied(true);
        toast.success('Link copied');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-md shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-5 py-4 border-b ${theme.canvas.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                        <FolderOpen size={15} className="text-accent" />
                        <span className={`font-semibold text-sm ${theme.text.primary}`}>Share Folder</span>
                        <span className={`text-xs ${theme.text.secondary} truncate max-w-[140px]`}>{folder.name}</span>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:text-white transition-colors`}>
                        <X size={15} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Active link display */}
                    {displayUrl && (
                        <div className="space-y-1.5">
                            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.canvas.border} ${theme.canvas.bg}`}>
                                <span className={`flex-1 text-xs ${theme.text.secondary} truncate font-mono`}>{displayUrl}</span>
                                <button
                                    onClick={handleCopy}
                                    className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {copied
                                        ? <Check size={13} className="text-emerald-400" />
                                        : <Copy size={13} className={theme.text.secondary} />
                                    }
                                </button>
                            </div>
                            {showingExistingLink && (
                                <p className={`text-[11px] px-1 ${folder.share_expires_at && new Date(folder.share_expires_at) < new Date() ? 'text-red-400' : theme.text.secondary}`}>
                                    {formatExpiry(folder.share_expires_at)}
                                    {folder.share_include_subfolders && <span className="ml-2 opacity-60">· Subfolders included</span>}
                                    {!folder.share_allow_download && <span className="ml-2 opacity-60">· No downloads</span>}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Settings — always visible */}
                    <div>
                        <p className={`text-xs font-medium ${theme.text.secondary} mb-2`}>
                            {displayUrl ? 'New link expires' : 'Link expires'}
                        </p>
                        <div className="flex gap-2">
                            {EXPIRY_OPTIONS.map(opt => (
                                <button
                                    key={String(opt.value)}
                                    onClick={() => setExpiryDays(opt.value)}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all ${expiryDays === opt.value
                                        ? 'bg-accent/10 border-accent/40 text-accent'
                                        : `${theme.canvas.bg} border-zinc-700 ${theme.text.secondary} hover:border-zinc-500`
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Toggle label="Include sub-folders" checked={includeSubfolders} onChange={setIncludeSubfolders} theme={theme} />
                        <Toggle label="Allow downloads" checked={allowDownload} onChange={setAllowDownload} theme={theme} />
                    </div>

                    {!displayUrl ? (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white disabled:opacity-50 transition-colors hover:opacity-90"
                        >
                            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Link size={14} />}
                            {generating ? 'Generating…' : 'Generate link'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border ${theme.canvas.border} ${theme.text.secondary} hover:text-white disabled:opacity-40 transition-colors`}
                                title="Generates a new token — the current link will stop working"
                            >
                                <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
                                {generating ? 'Generating…' : 'New link'}
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={revoking}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                            >
                                <Trash2 size={11} />
                                Revoke
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange, theme }) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-xs ${theme.text.secondary}`}>{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-8 h-4 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-zinc-700'}`}
            >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'left-4.5 translate-x-0.5' : 'left-0.5'}`} />
            </button>
        </div>
    );
}
