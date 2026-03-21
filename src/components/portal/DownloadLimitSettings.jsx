import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { setDownloadSettings, resetDownloads } from '../../api/projects';
import { RotateCcw, Ban } from 'lucide-react';

export default function DownloadLimitSettings({ projectId, deliverable, onRefresh, theme }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setInputVal(deliverable.max_downloads != null ? String(deliverable.max_downloads) : '');
    setEditing(true);
  };

  const commitEdit = async () => {
    setEditing(false);
    const val = inputVal.trim() === '' ? null : parseInt(inputVal, 10);
    if (val === deliverable.max_downloads) return;
    setSaving(true);
    try {
      await setDownloadSettings(projectId, deliverable.id, { max_downloads: val });
      onRefresh();
    } catch {
      toast.error('Failed to update limit');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetDownloads(projectId, deliverable.id);
      onRefresh();
    } catch {
      toast.error('Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisabled = async () => {
    setSaving(true);
    try {
      await setDownloadSettings(projectId, deliverable.id, {
        downloads_disabled: !deliverable.downloads_disabled,
      });
      onRefresh();
    } catch {
      toast.error('Failed to toggle downloads');
    } finally {
      setSaving(false);
    }
  };

  const max = deliverable.max_downloads;
  const count = deliverable.download_count || 0;
  const remaining = max != null ? max - count : null;

  return (
    <div className={`flex items-center gap-2 text-xs ${theme.text.secondary}`}>
      <span>Downloads:</span>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          placeholder="∞"
          className={`w-14 px-1.5 py-0.5 rounded border text-xs ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
        />
      ) : (
        <button
          onClick={startEdit}
          disabled={saving}
          className={`${theme.canvas.hover} px-1.5 py-0.5 rounded transition-colors ${deliverable.downloads_disabled ? 'line-through opacity-50' : ''}`}
          title="Click to set limit"
        >
          {remaining === null ? '–' : remaining <= 0 ? 'limit reached' : `${remaining} remaining`}
        </button>
      )}

      {count > 0 && (
        <button
          onClick={handleReset}
          disabled={saving}
          className={`${theme.canvas.hover} p-0.5 rounded transition-colors disabled:opacity-30`}
          title={`Reset (${count} used)`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}

      <button
        onClick={handleToggleDisabled}
        disabled={saving}
        className={`p-0.5 rounded transition-colors ${deliverable.downloads_disabled ? 'text-red-500' : theme.canvas.hover}`}
        title={deliverable.downloads_disabled ? 'Enable downloads' : 'Disable downloads'}
      >
        <Ban className="w-3 h-3" />
      </button>
    </div>
  );
}
