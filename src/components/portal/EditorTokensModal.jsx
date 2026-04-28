import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Users, Copy, Trash2, Plus, Check } from 'lucide-react';
import { createEditorToken, listEditorTokens, revokeEditorToken } from '../../api/projects';

export default function EditorTokensModal({ projectId, deliverables, onClose, theme }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchTokens = useCallback(async () => {
    try {
      const data = await listEditorTokens(projectId);
      setTokens(data);
    } catch {
      toast.error('Failed to load editor tokens');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async () => {
    if (!label.trim()) {
      toast.error('Label is required');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Select at least one deliverable');
      return;
    }
    setCreating(true);
    try {
      const token = await createEditorToken(projectId, {
        label: label.trim(),
        deliverable_ids: selectedIds,
      });
      const url = `${window.location.origin}/editor/${token.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Editor link created and copied!');
      setLabel('');
      setSelectedIds([]);
      setTokens((prev) => [...prev, token]);
    } catch {
      toast.error('Failed to create editor token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!window.confirm('Revoke this editor link? The editor will lose access immediately.')) return;
    try {
      await revokeEditorToken(projectId, tokenId);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      toast.success('Editor link revoked');
    } catch {
      toast.error('Failed to revoke token');
    }
  };

  const handleCopy = async (token) => {
    const url = `${window.location.origin}/editor/${token.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copied!');
  };

  const toggleDeliverable = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border ${theme.canvas.card} ${theme.canvas.border} p-6 shadow-xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className={`w-5 h-5 ${theme.text.secondary}`} />
            <h3 className={`text-lg font-bold ${theme.text.primary}`}>Editor Access</h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${theme.text.secondary} ${theme.canvas.hover}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Existing tokens */}
          {loading ? (
            <p className={`text-sm ${theme.text.secondary}`}>Loading...</p>
          ) : tokens.length === 0 ? (
            <p className={`text-sm ${theme.text.secondary}`}>No editor links yet. Create one below.</p>
          ) : (
            <div className="space-y-2">
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}
                >
                  <div>
                    <p className={`text-sm font-medium ${theme.text.primary}`}>{t.label || 'Untitled'}</p>
                    <p className={`text-xs ${theme.text.secondary}`}>
                      {t.deliverable_ids.length} deliverable{t.deliverable_ids.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(t.created_on).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(t)}
                      className={`p-1.5 rounded-lg ${theme.canvas.hover} ${theme.text.secondary}`}
                      title="Copy link"
                    >
                      {copiedId === t.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRevoke(t.id)}
                      className={`p-1.5 rounded-lg ${theme.canvas.hover} text-red-500`}
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className={`border-t ${theme.canvas.border}`} />

          {/* Create new token */}
          <div>
            <p className={`text-sm font-semibold ${theme.text.primary} mb-3`}>New Editor Link</p>
            <div className="space-y-3">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. Color Grading)"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
              />

              <div>
                <p className={`text-xs font-medium ${theme.text.secondary} mb-2`}>Scoped deliverables</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {deliverables.length === 0 ? (
                    <p className={`text-xs ${theme.text.secondary}`}>No deliverables available.</p>
                  ) : (
                    deliverables.map((d) => (
                      <label
                        key={d.id}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer ${theme.canvas.hover}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(d.id)}
                          onChange={() => toggleDeliverable(d.id)}
                          className="rounded"
                        />
                        <span className={`text-sm ${theme.text.primary}`}>{d.title}</span>
                        <span className={`text-xs ${theme.text.secondary} ml-auto`}>{d.status}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 mt-5 pt-4 border-t ${theme.canvas.border}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.text.secondary} ${theme.canvas.hover}`}
          >
            Close
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creating...' : 'Create & Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
