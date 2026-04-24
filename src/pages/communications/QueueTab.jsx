import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, Trash2, Edit3, X, RefreshCw, Plus, RotateCcw, Eye, ExternalLink, Zap, Check, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as commApi from '../../api/communications';
import { getClients } from '../../api/clients';
import api from '../../api/axios';

const STATUS_COLORS = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

function EditModal({ message, onClose, onSaved, theme }) {
    const [body, setBody] = useState(message?.message_body || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!body.trim()) return;
        setSaving(true);
        try {
            await commApi.editMessage(message.id, body);
            toast.success('Message updated');
            onSaved(message.id, body);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update message');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-lg shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-6 py-4 border-b ${theme.canvas.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <Edit3 size={16} className="text-violet-400" />
                        <span className={`font-semibold text-sm ${theme.text.primary}`}>Edit Message</span>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:text-white transition-colors`}>
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6">
                    <p className={`text-xs ${theme.text.secondary} mb-2`}>To: {message.recipient_name} · {message.recipient_phone}</p>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={10}
                        className={`w-full font-mono text-sm ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-3 ${theme.text.primary} resize-none focus:outline-none focus:border-violet-500/50 whitespace-pre-wrap`}
                        style={{ whiteSpace: 'pre-wrap' }}
                    />
                </div>
                <div className={`px-6 py-4 border-t ${theme.canvas.border} flex justify-end gap-3`}>
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${theme.text.secondary} hover:text-white transition-colors`}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !body.trim()}
                        className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BodyPopover({ body, theme }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const preview = body?.split('\n')[0]?.slice(0, 60) || '';

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`text-left text-xs ${theme.text.secondary} hover:${theme.text.primary} transition-colors max-w-xs truncate`}
            >
                {preview}{body?.length > 60 ? '…' : ''}
            </button>
            {open && (
                <div
                    className={`absolute z-30 left-0 top-6 w-80 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl p-4 shadow-2xl`}
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    <button
                        onClick={() => setOpen(false)}
                        className={`absolute top-2 right-2 ${theme.text.secondary} hover:text-white`}
                    >
                        <X size={12} />
                    </button>
                    <p className={`text-xs ${theme.text.primary} font-mono`} style={{ whiteSpace: 'pre-wrap' }}>{body}</p>
                </div>
            )}
        </div>
    );
}

function ComposeModal({ clients, associates, onClose, onCreated, theme }) {
    const [recipientType, setRecipientType] = useState('client');
    const [recipientId, setRecipientId] = useState('');
    const [body, setBody] = useState('');
    const [saving, setSaving] = useState(false);

    const list = recipientType === 'client'
        ? clients
        : associates.filter(a => a.phone_number?.trim());
    const selected = list.find(r => (r._id || r.id) === recipientId);
    const selectedPhone = recipientType === 'client'
        ? (selected?.whatsapp_number || selected?.phone)
        : selected?.phone_number;

    const handleCreate = async () => {
        if (!recipientId || !body.trim()) return;
        setSaving(true);
        try {
            const msg = await commApi.createMessage({
                recipient_id: recipientId,
                recipient_type: recipientType,
                message_body: body,
            });
            toast.success('Message queued');
            onCreated(msg);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create message');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-lg shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-6 py-4 border-b ${theme.canvas.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <Plus size={16} className="text-violet-400" />
                        <span className={`font-semibold text-sm ${theme.text.primary}`}>Compose Message</span>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:text-white transition-colors`}>
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Recipient type toggle */}
                    <div className={`flex rounded-xl border ${theme.canvas.border} overflow-hidden`}>
                        {['client', 'associate'].map(type => (
                            <button
                                key={type}
                                onClick={() => { setRecipientType(type); setRecipientId(''); }}
                                className={`flex-1 py-1.5 text-xs font-medium transition-colors capitalize ${recipientType === type ? 'bg-violet-600 text-white' : `${theme.text.secondary} hover:text-white`}`}
                            >
                                {type === 'client' ? 'Client' : 'Team Member'}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className={`text-xs font-medium ${theme.text.secondary} mb-1.5 block`}>Recipient</label>
                        <select
                            value={recipientId}
                            onChange={e => setRecipientId(e.target.value)}
                            className={`w-full text-sm ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-2.5 ${theme.text.primary} focus:outline-none focus:border-violet-500/50`}
                        >
                            <option value="">Select {recipientType === 'client' ? 'client' : 'team member'}…</option>
                            {list.map(r => (
                                <option key={r._id || r.id} value={r._id || r.id}>
                                    {r.name} — {recipientType === 'client' ? (r.whatsapp_number || r.phone) : r.phone_number}
                                </option>
                            ))}
                        </select>
                        {recipientType === 'associate' && list.length === 0 && (
                            <p className={`text-xs ${theme.text.secondary} mt-1.5`}>No team members with a phone number on file.</p>
                        )}
                    </div>
                    {selected && selectedPhone && (
                        <p className={`text-xs ${theme.text.secondary}`}>WhatsApp: {selectedPhone}</p>
                    )}
                    <div>
                        <label className={`text-xs font-medium ${theme.text.secondary} mb-1.5 block`}>Message</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={8}
                            placeholder="Type your message here…"
                            className={`w-full font-mono text-sm ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-4 py-3 ${theme.text.primary} resize-none focus:outline-none focus:border-violet-500/50`}
                            style={{ whiteSpace: 'pre-wrap' }}
                        />
                    </div>
                </div>
                <div className={`px-6 py-4 border-t ${theme.canvas.border} flex justify-end gap-3`}>
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${theme.text.secondary} hover:text-white transition-colors`}>
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={saving || !recipientId || !body.trim()}
                        className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Queuing…' : 'Queue Message'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PreviewModal({ message, onClose, onSend, sending, theme }) {
    if (!message) return null;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-sm shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-5 py-4 border-b ${theme.canvas.border} flex items-center justify-between`}>
                    <div>
                        <p className={`text-sm font-semibold ${theme.text.primary}`}>{message.recipient_name}</p>
                        <p className={`text-[11px] ${theme.text.secondary}`}>{message.recipient_phone}</p>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:text-white transition-colors`}>
                        <X size={16} />
                    </button>
                </div>

                {/* WhatsApp-style chat bubble */}
                <div className="p-5 bg-[#0a0a0a]/60">
                    <div className="flex justify-end">
                        <div className="max-w-[85%] bg-[#005c4b] rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                            <p className="text-[13px] text-white/95 leading-relaxed whitespace-pre-wrap font-sans">
                                {message.message_body}
                            </p>
                            <p className="text-[10px] text-white/50 text-right mt-1.5">{timeStr} ✓</p>
                        </div>
                    </div>
                </div>

                <div className={`px-5 py-4 border-t ${theme.canvas.border} flex justify-end gap-3`}>
                    <button onClick={onClose} className={`px-4 py-2 rounded-xl text-sm ${theme.text.secondary} hover:text-white transition-colors`}>
                        Close
                    </button>
                    {message.status === 'pending' && onSend && (
                        <button
                            onClick={() => { onSend(message); onClose(); }}
                            disabled={sending}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                        >
                            <Send size={13} />
                            {sending ? 'Sending…' : 'Send on WhatsApp'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function SourceChip({ source, theme }) {
    const navigate = useNavigate();
    if (!source?.kind || source.kind === 'manual' || !source.id) return null;

    const MAP = {
        project: { label: 'Project', path: `/projects/${source.id}` },
        event: { label: 'Event', path: source.project_id ? `/projects/${source.project_id}` : null },
        task: { label: 'Task', path: null },
    };
    const entry = MAP[source.kind];
    if (!entry) return null;

    const cls = `text-[9px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-0.5 whitespace-nowrap
        bg-zinc-800/60 border-zinc-700 ${theme.text.secondary}`;

    if (entry.path) {
        return (
            <button onClick={() => navigate(entry.path)} className={`${cls} hover:text-white hover:border-zinc-500 transition-colors`}>
                {entry.label} <ExternalLink size={8} />
            </button>
        );
    }
    return <span className={cls}>{entry.label}</span>;
}

const BLAST_TYPES = [
    { value: 'approval_requested', label: 'Approval Requested' },
];

function BlastModal({ onClose, onQueued, theme }) {
    const [step, setStep] = useState(1); // 1 = select type, 2 = preview, 3 = done
    const [alertType, setAlertType] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    const fetchPreview = async () => {
        if (!alertType) return;
        setLoading(true);
        try {
            const data = await commApi.blastPreview(alertType);
            setCandidates(data.items || []);
            setSelected(new Set((data.items || []).map(i => i.recipient_id + '|' + i.source.id)));
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Preview failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (item) => {
        const key = item.recipient_id + '|' + item.source.id;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSend = async () => {
        const selectedItems = candidates.filter(i => selected.has(i.recipient_id + '|' + i.source.id));
        if (!selectedItems.length) { toast.error('No recipients selected'); return; }
        setSending(true);
        try {
            const data = await commApi.blastSend(alertType, selectedItems);
            setResult(data);
            setStep(3);
            onQueued();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Blast failed');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl w-full max-w-lg shadow-2xl`}
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-6 py-4 border-b ${theme.canvas.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                        <Zap size={15} className="text-amber-400" />
                        <span className={`font-semibold text-sm ${theme.text.primary}`}>Blast Message</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20`}>
                            Step {step}/3
                        </span>
                    </div>
                    <button onClick={onClose} className={`${theme.text.secondary} hover:text-white transition-colors`}>
                        <X size={16} />
                    </button>
                </div>

                {step === 1 && (
                    <div className="p-6 space-y-4">
                        <p className={`text-xs ${theme.text.secondary}`}>Select an alert type to preview which recipients will be targeted.</p>
                        <div className="space-y-2">
                            {BLAST_TYPES.map(bt => (
                                <button
                                    key={bt.value}
                                    onClick={() => setAlertType(bt.value)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all text-sm ${alertType === bt.value
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                        : `${theme.canvas.bg} border-zinc-700 ${theme.text.secondary} hover:border-zinc-600`}`}
                                >
                                    {bt.label}
                                    {alertType === bt.value && <Check size={14} className="text-amber-400" />}
                                </button>
                            ))}
                        </div>
                        <div className={`flex justify-end pt-2 border-t ${theme.canvas.border}`}>
                            <button
                                onClick={fetchPreview}
                                disabled={!alertType || loading}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors"
                            >
                                {loading ? <RefreshCw size={13} className="animate-spin" /> : null}
                                {loading ? 'Loading…' : 'Preview recipients →'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className={`text-xs ${theme.text.secondary}`}>
                                {candidates.length} recipient{candidates.length !== 1 ? 's' : ''} found — deselect any to exclude.
                            </p>
                            <button onClick={() => setSelected(new Set(candidates.map(i => i.recipient_id + '|' + i.source.id)))} className={`text-[10px] ${theme.text.secondary} hover:text-white`}>Select all</button>
                        </div>
                        {candidates.length === 0 ? (
                            <div className={`text-center py-8 ${theme.text.secondary} text-sm`}>
                                <Users size={28} className="mx-auto mb-2 opacity-30" />
                                No recipients match right now.
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1.5">
                                {candidates.map(item => {
                                    const key = item.recipient_id + '|' + item.source.id;
                                    const on = selected.has(key);
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleItem(item)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${on
                                                ? `${theme.canvas.bg} border-emerald-500/30 bg-emerald-500/5`
                                                : `${theme.canvas.bg} border-zinc-800 opacity-50`}`}
                                        >
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                                                {on && <Check size={9} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium ${theme.text.primary} truncate`}>{item.recipient_name}</p>
                                                <p className={`text-[10px] ${theme.text.secondary} truncate`}>{item.recipient_phone}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <div className={`flex justify-between items-center pt-2 border-t ${theme.canvas.border}`}>
                            <button onClick={() => setStep(1)} className={`text-xs ${theme.text.secondary} hover:text-white transition-colors`}>← Back</button>
                            <button
                                onClick={handleSend}
                                disabled={sending || selected.size === 0}
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                            >
                                {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                                {sending ? 'Queuing…' : `Queue ${selected.size} message${selected.size !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                            <Check size={22} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${theme.text.primary}`}>Blast queued!</p>
                            <p className={`text-xs ${theme.text.secondary} mt-1`}>
                                {result.queued} message{result.queued !== 1 ? 's' : ''} queued
                                {result.skipped > 0 && `, ${result.skipped} skipped (already sent recently)`}
                            </p>
                        </div>
                        <button onClick={onClose} className={`w-full py-2 rounded-xl text-sm ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:text-white transition-colors`}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QueueTab({ theme }) {
    const [messages, setMessages] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [alertTypes, setAlertTypes] = useState([]);
    const [clients, setClients] = useState([]);
    const [associates, setAssociates] = useState([]);

    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterRecipient, setFilterRecipient] = useState('');
    const [filterChannel, setFilterChannel] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');

    const [editingMsg, setEditingMsg] = useState(null);
    const [previewMsg, setPreviewMsg] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [composing, setComposing] = useState(false);
    const [blasting, setBlasting] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [confirmResendId, setConfirmResendId] = useState(null);
    const confirmResendTimer = useRef(null);

    const LIMIT = 50;

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const data = await commApi.listMessages({
                status: filterStatus || undefined,
                alert_type: filterType || undefined,
                recipient_id: filterRecipient || undefined,
                send_channel: filterChannel || undefined,
                date_from: filterDateFrom || undefined,
                date_to: filterDateTo || undefined,
                sort_by: sortBy,
                order,
                page,
                limit: LIMIT,
            });
            setMessages(data.messages || []);
            setTotal(data.total || 0);
        } catch {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType, filterRecipient, filterChannel, filterDateFrom, filterDateTo, sortBy, order, page]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        commApi.getAlertTypes().then(setAlertTypes).catch(() => {});
        getClients().then(res => setClients(Array.isArray(res) ? res : (res.data || []))).catch(() => {});
        api.get('/associates').then(res => setAssociates(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    }, []);

    const handleSend = async (msg) => {
        setSendingId(msg.id);
        try {
            const result = await commApi.prepareSend(msg.id);
            if (result.wa_url) {
                window.open(result.wa_url, '_blank', 'noopener,noreferrer');
            }
            setMessages(prev => prev.map(m =>
                m.id === msg.id ? { ...m, status: 'sent', sent_at: result.sent_at } : m
            ));
            toast.success(result.wa_url ? 'WhatsApp opened — message marked sent' : 'Message marked sent');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Send failed');
        } finally {
            setSendingId(null);
        }
    };

    const handleResend = async (msg) => {
        setConfirmResendId(null);
        clearTimeout(confirmResendTimer.current);
        setSendingId(msg.id);
        try {
            const result = await commApi.resendMessage(msg.id);
            if (result.wa_url) {
                window.open(result.wa_url, '_blank', 'noopener,noreferrer');
            }
            setMessages(prev => prev.map(m =>
                m.id === msg.id ? { ...m, status: 'sent', sent_at: result.sent_at } : m
            ));
            toast.success('WhatsApp reopened');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Resend failed');
        } finally {
            setSendingId(null);
        }
    };

    const requestResend = (msg) => {
        if (confirmResendId === msg.id) {
            handleResend(msg);
        } else {
            clearTimeout(confirmResendTimer.current);
            setConfirmResendId(msg.id);
            confirmResendTimer.current = setTimeout(() => setConfirmResendId(null), 3000);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await commApi.deleteMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            setTotal(t => t - 1);
            toast.success('Deleted');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditSaved = (id, newBody) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, message_body: newBody, edited: true } : m
        ));
    };

    const handleCreated = (msg) => {
        setMessages(prev => [msg, ...prev]);
        setTotal(t => t + 1);
    };

    const clearFilters = () => {
        setFilterStatus('');
        setFilterType('');
        setFilterRecipient('');
        setFilterChannel('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setPage(1);
    };

    const hasFilters = filterStatus || filterType || filterRecipient || filterChannel || filterDateFrom || filterDateTo;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Type filter */}
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                >
                    <option value="">All types</option>
                    {alertTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                {/* Recipient filter */}
                <select
                    value={filterRecipient}
                    onChange={e => { setFilterRecipient(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                >
                    <option value="">All recipients</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                {/* Status filter */}
                <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                </select>

                {/* Channel filter */}
                <select
                    value={filterChannel}
                    onChange={e => { setFilterChannel(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                >
                    <option value="">All channels</option>
                    <option value="manual">Manual</option>
                    <option value="automation">Automated</option>
                </select>

                {/* Date from */}
                <input
                    type="date"
                    value={filterDateFrom}
                    onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                />
                <input
                    type="date"
                    value={filterDateTo}
                    onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                />

                {/* Sort */}
                <select
                    value={`${sortBy}:${order}`}
                    onChange={e => {
                        const [sb, ord] = e.target.value.split(':');
                        setSortBy(sb);
                        setOrder(ord);
                        setPage(1);
                    }}
                    className={`text-xs ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl px-3 py-2 ${theme.text.secondary} focus:outline-none focus:border-violet-500/50`}
                >
                    <option value="created_at:desc">Newest first</option>
                    <option value="created_at:asc">Oldest first</option>
                    <option value="sent_at:desc">Sent: recent first</option>
                    <option value="sent_at:asc">Sent: oldest first</option>
                </select>

                {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors">
                        <X size={12} /> Clear
                    </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={fetchMessages}
                        className={`p-2 rounded-xl border ${theme.canvas.border} ${theme.text.secondary} hover:text-white transition-colors`}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setBlasting(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-amber-600/80 hover:bg-amber-600 text-white transition-colors"
                    >
                        <Zap size={13} /> Blast
                    </button>
                    <button
                        onClick={() => setComposing(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    >
                        <Plus size={13} /> Compose
                    </button>
                </div>
            </div>

            {/* Count */}
            <p className={`text-xs ${theme.text.secondary}`}>{total} message{total !== 1 ? 's' : ''}</p>

            {/* Table */}
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden`}>
                {loading ? (
                    <div className="py-16 text-center">
                        <RefreshCw size={20} className={`animate-spin mx-auto ${theme.text.secondary}`} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="py-16 text-center">
                        <MessageCircle size={32} className={`mx-auto mb-3 ${theme.text.secondary}`} />
                        <p className={`text-sm ${theme.text.secondary}`}>No messages found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`border-b ${theme.canvas.border}`}>
                                    {['Recipient', 'Type', 'Message', 'Status', 'Generated', 'Sent', 'Actions'].map(h => (
                                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold ${theme.text.secondary}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {messages.map(msg => (
                                    <tr key={msg.id} className={`hover:${theme.canvas.hover} transition-colors`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <p className={`text-xs font-medium ${theme.text.primary} truncate max-w-[100px]`}>{msg.recipient_name}</p>
                                                {msg.recipient_type === 'associate' && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 whitespace-nowrap shrink-0">Team</span>
                                                )}
                                            </div>
                                            <p className={`text-[10px] ${theme.text.secondary} truncate max-w-[120px]`}>{msg.recipient_phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS.pending} whitespace-nowrap self-start`}>
                                                    {alertTypes.find(t => t.value === msg.alert_type)?.label || msg.alert_type}
                                                </span>
                                                <SourceChip source={msg.source} theme={theme} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <BodyPopover body={msg.message_body} theme={theme} />
                                                {msg.edited && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 whitespace-nowrap">edited</span>
                                                )}
                                                {msg.send_channel === 'automation' && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-600/30 whitespace-nowrap">auto</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[msg.status] || STATUS_COLORS.cancelled} whitespace-nowrap`}>
                                                {msg.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className={`text-[10px] ${theme.text.secondary} whitespace-nowrap`}>
                                                {msg.created_at ? format(new Date(msg.created_at), 'dd MMM, HH:mm') : '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className={`text-[10px] ${theme.text.secondary} whitespace-nowrap`}>
                                                {msg.sent_at ? format(new Date(msg.sent_at), 'dd MMM, HH:mm') : '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {/* Preview */}
                                                <button
                                                    onClick={() => setPreviewMsg(msg)}
                                                    title="Preview message"
                                                    className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-white hover:bg-white/5 transition-colors`}
                                                >
                                                    <Eye size={13} />
                                                </button>

                                                {msg.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingMsg(msg)}
                                                            title="Edit"
                                                            className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-violet-400 hover:bg-violet-500/10 transition-colors`}
                                                        >
                                                            <Edit3 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSend(msg)}
                                                            disabled={!!sendingId}
                                                            title="Send on WhatsApp"
                                                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                                                        >
                                                            <Send size={13} className={sendingId === msg.id ? 'animate-pulse' : ''} />
                                                        </button>
                                                    </>
                                                )}
                                                {(msg.status === 'sent' || msg.status === 'failed') && (
                                                    confirmResendId === msg.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-[10px] ${theme.text.secondary}`}>Sure?</span>
                                                            <button
                                                                onClick={() => handleResend(msg)}
                                                                disabled={!!sendingId}
                                                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                                                                title="Confirm resend"
                                                            >
                                                                <RotateCcw size={13} className={sendingId === msg.id ? 'animate-spin' : ''} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmResendId(null)}
                                                                className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-white transition-colors`}
                                                            >
                                                                <X size={11} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => requestResend(msg)}
                                                            disabled={!!sendingId}
                                                            title="Resend on WhatsApp"
                                                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${msg.status === 'failed' ? 'text-red-400 hover:bg-red-500/10' : `${theme.text.secondary} hover:text-emerald-400 hover:bg-emerald-500/10`}`}
                                                        >
                                                            <RotateCcw size={13} />
                                                        </button>
                                                    )
                                                )}
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    disabled={deletingId === msg.id}
                                                    title="Delete"
                                                    className={`p-1.5 rounded-lg ${theme.text.secondary} hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40`}
                                                >
                                                    <Trash2 size={13} className={deletingId === msg.id ? 'animate-pulse' : ''} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-3 py-1.5 rounded-xl text-xs border ${theme.canvas.border} ${theme.text.secondary} disabled:opacity-40 hover:text-white transition-colors`}
                    >
                        Prev
                    </button>
                    <span className={`text-xs ${theme.text.secondary}`}>{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`px-3 py-1.5 rounded-xl text-xs border ${theme.canvas.border} ${theme.text.secondary} disabled:opacity-40 hover:text-white transition-colors`}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modals */}
            {editingMsg && (
                <EditModal
                    message={editingMsg}
                    onClose={() => setEditingMsg(null)}
                    onSaved={handleEditSaved}
                    theme={theme}
                />
            )}
            {previewMsg && (
                <PreviewModal
                    message={previewMsg}
                    onClose={() => setPreviewMsg(null)}
                    onSend={handleSend}
                    sending={sendingId === previewMsg.id}
                    theme={theme}
                />
            )}
            {composing && (
                <ComposeModal
                    clients={clients}
                    associates={associates}
                    onClose={() => setComposing(false)}
                    onCreated={handleCreated}
                    theme={theme}
                />
            )}
            {blasting && (
                <BlastModal
                    onClose={() => setBlasting(false)}
                    onQueued={fetchMessages}
                    theme={theme}
                />
            )}
        </div>
    );
}
