import { useState } from 'react';
import { toast } from 'sonner';
import { updatePortalSettings } from '../../api/projects';
import { X, Shield, Download, Type } from 'lucide-react';

export default function PortalSettingsModal({ projectId, project, onClose, onRefresh, theme }) {
  const [watermarkEnabled, setWatermarkEnabled] = useState(project.portal_watermark_enabled || false);
  const [watermarkText, setWatermarkText] = useState(project.portal_watermark_text || '');
  const [defaultLimit, setDefaultLimit] = useState(project.portal_default_download_limit ?? '');
  const [portalHeading, setPortalHeading] = useState(project.portal_heading || '');
  const [portalDescription, setPortalDescription] = useState(project.portal_description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePortalSettings(projectId, {
        portal_watermark_enabled: watermarkEnabled,
        portal_watermark_text: watermarkText || null,
        portal_default_download_limit: defaultLimit === '' ? null : parseInt(defaultLimit, 10),
        portal_heading: portalHeading || null,
        portal_description: portalDescription || null,
      });
      toast.success('Portal settings updated');
      onRefresh();
      onClose();
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl border ${theme.canvas.card} ${theme.canvas.border} p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-bold ${theme.text.primary}`}>Portal Settings</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${theme.text.secondary} ${theme.canvas.hover}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Portal Heading & Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className={`w-4 h-4 ${theme.text.secondary}`} />
              <span className={`text-sm font-semibold ${theme.text.primary}`}>Portal Header</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={portalHeading}
                onChange={(e) => setPortalHeading(e.target.value)}
                placeholder="e.g. Your Wedding Gallery is Ready!"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
              />
              <textarea
                value={portalDescription}
                onChange={(e) => setPortalDescription(e.target.value)}
                placeholder="Add a message for your client..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
              />
            </div>
            <p className={`text-xs mt-1 ${theme.text.secondary}`}>
              Shown at the top of the portal instead of the project details.
            </p>
          </div>

          {/* Watermark Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className={`w-4 h-4 ${theme.text.secondary}`} />
              <span className={`text-sm font-semibold ${theme.text.primary}`}>Video Watermark</span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${watermarkEnabled ? '' : 'bg-zinc-600'}`}
                style={watermarkEnabled ? { backgroundColor: 'var(--accent)' } : undefined}
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${watermarkEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
              <span className={`text-sm ${theme.text.primary}`}>
                {watermarkEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
            {watermarkEnabled && (
              <div className="mt-3">
                <label className={`text-xs font-medium ${theme.text.secondary} block mb-1`}>
                  Watermark Text (leave empty for org name)
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. PREVIEW ONLY"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
                />
              </div>
            )}
            {watermarkEnabled && (
              <p className={`text-xs mt-2 ${theme.text.secondary}`}>
                When enabled, video downloads are automatically disabled and a watermarked preview is shown.
              </p>
            )}
          </div>

          {/* Default Download Limit */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Download className={`w-4 h-4 ${theme.text.secondary}`} />
              <span className={`text-sm font-semibold ${theme.text.primary}`}>Default Download Limit</span>
            </div>
            <input
              type="number"
              min="0"
              value={defaultLimit}
              onChange={(e) => setDefaultLimit(e.target.value)}
              placeholder="Unlimited"
              className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.canvas.card} ${theme.canvas.border} ${theme.text.primary}`}
            />
            <p className={`text-xs mt-1 ${theme.text.secondary}`}>
              Applied to new deliverables. Leave empty for unlimited.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.canvas.button?.secondary || theme.text.secondary} ${theme.canvas.hover}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
