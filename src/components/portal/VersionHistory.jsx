import { useState } from 'react';
import { ChevronDown, ChevronUp, History, Download } from 'lucide-react';

export default function VersionHistory({ file, theme, getDownloadUrl = null }) {
  const [expanded, setExpanded] = useState(false);
  const versions = file.previous_versions || [];

  if (versions.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 text-xs ${theme.text.secondary} ${theme.canvas.hover} px-2 py-1 rounded transition-colors`}
      >
        <History className="w-3 h-3" />
        v{file.version || 1} ({versions.length} previous)
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className={`mt-1.5 ml-2 space-y-1.5 border-l-2 ${theme.canvas.border} pl-3`}>
          {versions.map((v, i) => {
            const downloadUrl = getDownloadUrl ? getDownloadUrl(v) : null;
            return (
              <div key={i} className={`text-xs ${theme.text.secondary}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">v{v.version}</span>
                  <span>{v.file_name}</span>
                  <span className="opacity-60">
                    {new Date(v.uploaded_on).toLocaleDateString()}
                  </span>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${theme.canvas.border} ${theme.canvas.hover} transition-colors`}
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                </div>
                {v.change_notes && (
                  <p className="mt-0.5 opacity-70 italic">{v.change_notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
