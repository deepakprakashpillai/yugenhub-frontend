
import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, X, Plus, Edit3, Check, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import EditableTagList from '../ui/EditableTagList';
import StatusDeleteModal from './StatusDeleteModal';
import { useTheme } from '../../context/ThemeContext';

function WorkflowSection({ role }) {
    const { theme } = useTheme();
    const { refreshConfig } = useAgencyConfig();
    const [workflow, setWorkflow] = useState({ status_options: [], lead_sources: [], deliverable_types: [] });
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const [saving, setSaving] = useState(false);
    const [newStatusLabel, setNewStatusLabel] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#f59e0b');
    const [deleteModal, setDeleteModal] = useState({ open: false, status: null });
    const isOwner = role === 'owner';

    useEffect(() => {
        api.get('/settings/workflow').then(r => { setWorkflow(r.data); setDraft(r.data); });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings/workflow', draft);
            // Re-fetch to get server-normalized data (fixed flags preserved)
            const res = await api.get('/settings/workflow');
            setWorkflow(res.data);
            setDraft(res.data);
            setEditing(false);
            await refreshConfig();
            toast.success('Workflow config updated');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const addStatus = () => {
        if (!newStatusLabel.trim()) return;
        const id = newStatusLabel.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36);
        setDraft({
            ...draft,
            status_options: [...(draft.status_options || []), { id, label: newStatusLabel.trim(), color: newStatusColor, fixed: false }]
        });
        setNewStatusLabel('');
        setNewStatusColor('#f59e0b');
    };

    const handleDeleteClick = async (status) => {
        // Fetch usage count before showing modal
        try {
            const res = await api.get(`/settings/workflow/status/${status.id}/usage`);
            setDeleteModal({
                open: true,
                status: { ...status, usageCount: res.data.count }
            });
        } catch {
            toast.error('Failed to check status usage');
        }
    };

    const handleDeleteConfirm = async (deleteId, reassignTo) => {
        try {
            const res = await api.post('/settings/workflow/status/delete', {
                delete_id: deleteId,
                reassign_to: reassignTo,
            });
            toast.success(res.data.message);
            // Refresh data
            const fresh = await api.get('/settings/workflow');
            setWorkflow(fresh.data);
            setDraft(fresh.data);
            await refreshConfig();
            setDeleteModal({ open: false, status: null });
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete status');
        }
    };

    const updateStatusColor = (index, color) => {
        const updated = [...draft.status_options];
        updated[index] = { ...updated[index], color };
        setDraft({ ...draft, status_options: updated });
    };

    const updateStatusLabel = (index, label) => {
        const updated = [...draft.status_options];
        updated[index] = { ...updated[index], label };
        setDraft({ ...draft, status_options: updated });
    };

    const moveStatus = (index, direction) => {
        const arr = [...draft.status_options];
        const target = index + direction;
        if (target < 0 || target >= arr.length) return;
        [arr[index], arr[target]] = [arr[target], arr[index]];
        setDraft({ ...draft, status_options: arr });
    };

    const removeStatusFromDraft = (index) => {
        setDraft({ ...draft, status_options: draft.status_options.filter((_, i) => i !== index) });
    };

    const displayOptions = editing ? draft.status_options : workflow.status_options;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Workflow Configuration</h2>
                    <p className={`text-sm ${theme.text.secondary} mt-1`}>Customize project statuses, lead sources, and deliverable types</p>
                </div>
                {isOwner && !editing && (
                    <button onClick={() => setEditing(true)} className={`flex items-center gap-2 px-4 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-xl text-sm ${theme.text.secondary} hover:${theme.text.primary} hover:border-zinc-600 transition-colors`}>
                        <Edit3 size={14} /> Edit
                    </button>
                )}
            </div>
            <div className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-6 space-y-6`}>
                {/* Status Options */}
                <div>
                    <label className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-3 block`}>Project Statuses</label>
                    <div className="flex flex-wrap gap-2">
                        {(displayOptions || []).map((status, i) => {
                            const isFixed = status.fixed;
                            return (
                                <span key={status.id || i} className={`inline-flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm ${isFixed ? `${theme.canvas.bg} opacity-70 ${theme.canvas.border} ${theme.text.secondary}` : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.primary}`}`}>
                                    {editing && !isFixed && (
                                        <span className="flex gap-0.5 mr-0.5">
                                            <button onClick={() => moveStatus(i, -1)} className={`${theme.text.secondary} hover:${theme.text.primary}`}><ArrowUp size={10} className="rotate-[-90deg]" /></button>
                                            <button onClick={() => moveStatus(i, 1)} className={`${theme.text.secondary} hover:${theme.text.primary}`}><ArrowDown size={10} className="rotate-[-90deg]" /></button>
                                        </span>
                                    )}

                                    {/* Color dot/picker */}
                                    {editing && !isFixed ? (
                                        <input type="color" value={status.color} onChange={e => updateStatusColor(i, e.target.value)} className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0" />
                                    ) : (
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                                    )}

                                    {/* Label */}
                                    {editing && !isFixed ? (
                                        <input
                                            type="text"
                                            value={status.label}
                                            onChange={e => updateStatusLabel(i, e.target.value)}
                                            className={`bg-transparent border-none text-sm ${theme.text.primary} focus:outline-none w-24`}
                                        />
                                    ) : (
                                        <span>{status.label}</span>
                                    )}

                                    {/* Fixed lock / Delete button */}
                                    {isFixed && (
                                        <Lock size={10} className={`${theme.text.secondary} ml-1`} title="Fixed status" />
                                    )}
                                    {editing && !isFixed && (
                                        <button onClick={() => removeStatusFromDraft(i)} className={`${theme.text.secondary} hover:text-red-400 ml-1`}><X size={12} /></button>
                                    )}
                                </span>
                            );
                        })}

                        {/* Add new custom status */}
                        {editing && (
                            <span className={`inline-flex items-center gap-1 border border-dashed ${theme.canvas.border} rounded-lg overflow-hidden`}>
                                <input type="color" value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} className="w-6 h-6 ml-2 rounded cursor-pointer bg-transparent border-0 p-0" />
                                <input
                                    type="text"
                                    value={newStatusLabel}
                                    onChange={e => setNewStatusLabel(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStatus(); } }}
                                    placeholder="New status..."
                                    className={`bg-transparent border-none px-2 py-1.5 text-sm ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none w-28`}
                                />
                                <button onClick={addStatus} className={`px-2 py-1.5 ${theme.text.secondary} hover:${theme.text.primary}`}><Plus size={14} /></button>
                            </span>
                        )}
                    </div>

                    {/* Saved custom statuses — delete buttons (only shown when NOT in edit mode) */}
                    {!editing && isOwner && (workflow.status_options || []).some(s => !s.fixed) && (
                        <div className={`mt-3 pt-3 border-t ${theme.canvas.border}`}>
                            <p className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Custom Statuses</p>
                            <div className="flex flex-wrap gap-2">
                                {(workflow.status_options || []).filter(s => !s.fixed).map(status => (
                                    <span key={status.id} className={`inline-flex items-center gap-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-1.5 text-sm ${theme.text.primary}`}>
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                                        {status.label}
                                        <button
                                            onClick={() => handleDeleteClick(status)}
                                            className={`${theme.text.secondary} hover:text-red-400 ml-1 transition-colors`}
                                            title="Delete status"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <EditableTagList
                    title="Lead Sources"
                    items={(editing ? draft : workflow).lead_sources || []}
                    editing={editing}
                    onUpdate={(items) => setDraft({ ...draft, lead_sources: items })}
                />

                <EditableTagList
                    title="Deliverable Types"
                    items={(editing ? draft : workflow).deliverable_types || []}
                    editing={editing}
                    onUpdate={(items) => setDraft({ ...draft, deliverable_types: items })}
                />

                <EditableTagList
                    title="Associate Roles"
                    items={(editing ? draft : workflow).associate_roles || []}
                    editing={editing}
                    onUpdate={(items) => setDraft({ ...draft, associate_roles: items })}
                />

                {editing && (
                    <div className="flex gap-3 pt-2">
                        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 ${theme.canvas.button.primary} font-bold text-sm rounded-xl disabled:opacity-50`}>
                            <Check size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={() => { setDraft(workflow); setEditing(false); }} className={`flex items-center gap-2 px-5 py-2.5 ${theme.canvas.bg} ${theme.text.secondary} text-sm rounded-xl hover:${theme.text.primary} transition-colors border ${theme.canvas.border}`}>
                            <X size={14} /> Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <StatusDeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, status: null })}
                statusToDelete={deleteModal.status}
                allStatuses={workflow.status_options || []}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}

export default WorkflowSection;
