
import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';

function ExportSection() {
    const [exporting, setExporting] = useState(null);

    const exportData = async (type) => {
        setExporting(type);
        try {
            const endpoints = {
                projects: '/projects',
                tasks: '/tasks',
                clients: '/clients',
                associates: '/associates',
            };
            const res = await api.get(endpoints[type], { params: { limit: 10000 } });
            const data = res.data?.data || res.data || [];

            if (!Array.isArray(data) || data.length === 0) {
                toast.error('No data to export');
                return;
            }

            // Convert to CSV
            // 1. Collect all unique headers from all rows
            const allHeaders = new Set();
            data.forEach(row => {
                Object.keys(row).forEach(k => {
                    if (k !== '_id' && k !== '__v') {
                        allHeaders.add(k);
                    }
                });
            });
            const headers = Array.from(allHeaders).sort();

            if (headers.length === 0) {
                toast.error('Data found but no valid fields to export');
                return;
            }

            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    return `"${str.replace(/"/g, '""')}"`;
                }).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); // Append to body for Firefox
            a.click();
            document.body.removeChild(a); // Cleanup
            URL.revokeObjectURL(url);
            toast.success(`${type} exported successfully`);
        } catch (err) {
            console.error("Export failed:", err);
            toast.error(`Failed to export ${type}: ${err.message || 'Unknown error'}`);
        } finally {
            setExporting(null);
        }
    };

    const exports = [
        { type: 'projects', label: 'Projects', desc: 'Export all project data' },
        { type: 'tasks', label: 'Tasks', desc: 'Export all task data' },
        { type: 'clients', label: 'Clients', desc: 'Export client directory' },
        { type: 'associates', label: 'Associates', desc: 'Export team directory' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Data Export</h2>
                <p className="text-sm text-zinc-500 mt-1">Download your data as CSV files</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exports.map(e => (
                    <div key={e.type} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-white">{e.label}</p>
                            <p className="text-xs text-zinc-500 mt-1">{e.desc}</p>
                        </div>
                        <button
                            onClick={() => exportData(e.type)}
                            disabled={exporting !== null}
                            className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            {exporting === e.type ? <span className="text-[10px] animate-pulse">Running...</span> : <Download size={16} />}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExportSection;
