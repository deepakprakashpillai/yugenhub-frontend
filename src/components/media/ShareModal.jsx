import { useState, useEffect } from 'react';
import Modal from '../modals/Modal';
import { Copy, Check, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import * as mediaApi from '../../api/media';
import { toast } from 'sonner';

const EXPIRY_OPTIONS = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: 'Never', value: null },
];

export default function ShareModal({ isOpen, onClose, item }) {
    const { theme } = useTheme();
    const [expiresIn, setExpiresIn] = useState(7);
    const [shareUrl, setShareUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            // share_url is not persisted — reconstruct from share_token if present
            const url = item.share_token
                ? `${window.location.origin}/share/${item.share_token}`
                : null;
            setShareUrl(url);
            setExpiresIn(7);
            setCopied(false);
        }
    }, [isOpen, item]);

    const handleShare = async () => {
        setLoading(true);
        try {
            const data = await mediaApi.shareFile(item.id, expiresIn);
            setShareUrl(data.share_url || data.url);
            toast.success('Share link created');
        } catch {
            toast.error('Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async () => {
        setRevoking(true);
        try {
            await mediaApi.revokeShare(item.id);
            setShareUrl(null);
            toast.success('Share link revoked');
        } catch {
            toast.error('Failed to revoke share link');
        } finally {
            setRevoking(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share File" size="sm">
            <div className="space-y-4">
                <p className={`text-xs ${theme.text.secondary}`}>
                    Sharing: <span className={`font-semibold ${theme.text.primary}`}>{item?.name}</span>
                </p>

                {/* Expiry picker */}
                <div>
                    <label className={`text-xs font-semibold ${theme.text.secondary} block mb-2`}>
                        Link expires after
                    </label>
                    <div className="flex gap-2">
                        {EXPIRY_OPTIONS.map(opt => (
                            <button
                                key={String(opt.value)}
                                onClick={() => setExpiresIn(opt.value)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                    expiresIn === opt.value
                                        ? 'bg-accent/10 text-accent border-accent/30'
                                        : `${theme.canvas.card} ${theme.text.secondary} ${theme.canvas.border} ${theme.canvas.hover}`
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Share URL display */}
                {shareUrl ? (
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}>
                        <span className={`flex-1 text-xs truncate ${theme.text.secondary}`}>{shareUrl}</span>
                        <button
                            onClick={handleCopy}
                            className={`shrink-0 transition-colors ${theme.text.secondary} hover:text-accent`}
                        >
                            {copied
                                ? <Check size={14} className="text-green-500" />
                                : <Copy size={14} />
                            }
                        </button>
                    </div>
                ) : (
                    <div className={`text-xs ${theme.text.secondary} text-center py-3 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}>
                        No active share link
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {shareUrl && (
                        <button
                            onClick={handleRevoke}
                            disabled={revoking}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                            <Trash2 size={13} />
                            {revoking ? 'Revoking…' : 'Revoke'}
                        </button>
                    )}
                    <button
                        onClick={handleShare}
                        disabled={loading}
                        className="ml-auto px-4 py-2 rounded-xl text-sm bg-accent text-white font-semibold disabled:opacity-40 transition-opacity"
                    >
                        {loading ? 'Generating…' : shareUrl ? 'Regenerate' : 'Generate Link'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
