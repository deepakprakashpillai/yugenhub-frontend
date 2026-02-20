import { useState, useEffect } from 'react';
import {
    Plus, Edit3, Trash2, Check, X,
    MoreVertical, Lock, LayoutGrid, List,
    Settings, Shield, ChevronRight, Activity,
    Save, Gem, Baby, Briefcase, CornerDownRight
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';

// System Fields Configuration (Immutable)
const SYSTEM_FIELDS_CONFIG = {
    wedding: {
        label: 'Wedding',
        Icon: Gem,
        description: 'Manage wedding specific fields',
        color: 'rose',
        fields: [
            { label: 'Client Side', type: 'select', locked: true },
            { label: 'Groom Name', type: 'text', locked: true },
            { label: 'Bride Name', type: 'text', locked: true },
            { label: 'Groom Contact', type: 'tel', locked: true },
            { label: 'Bride Contact', type: 'tel', locked: true },
            { label: 'Date', type: 'date', locked: true },
            { label: 'Wedding Style', type: 'text', locked: true },
        ],
        keys: ['client_side', 'groom_name', 'bride_name', 'groom_number', 'bride_number', 'wedding_date', 'wedding_style', 'groom_age', 'bride_age', 'religion', 'groom_location', 'bride_location']
    },
    children: {
        label: 'Children',
        Icon: Baby,
        description: 'Manage kids & birthday fields',
        color: 'blue',
        fields: [
            { label: 'Child Name', type: 'text', locked: true },
            { label: 'Age', type: 'number', locked: true },
            { label: 'Occasion', type: 'select', locked: true },
            { label: 'Parents', type: 'text', locked: true },
            { label: 'Address', type: 'text', locked: true },
        ],
        keys: ['child_name', 'child_age', 'occasion_type', 'mother_name', 'father_name', 'address']
    },
    general: {
        label: 'General',
        Icon: Briefcase,
        description: 'Standard project fields',
        color: 'zinc',
        fields: [
            { label: 'Project Name', type: 'text', locked: true },
            { label: 'Client', type: 'relationship', locked: true },
        ],
        keys: ['project_name', 'client_id']
    }
};

const VerticalCard = ({ vertical, isEditing, onEdit, onSave, onCancel, onDelete, isCreating = false, canEdit = false }) => {
    const { theme } = useTheme();
    // Local state for editing to prevent global re-renders
    const [draft, setDraft] = useState(vertical);
    const [newField, setNewField] = useState({ name: '', label: '', type: 'text', options: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(vertical);
    }, [vertical]);

    const vType = draft.type || (['knots'].includes(draft.id) ? 'wedding' : ['pluto'].includes(draft.id) ? 'children' : 'general');
    const systemConfig = SYSTEM_FIELDS_CONFIG[vType] || SYSTEM_FIELDS_CONFIG.general;
    const Icon = systemConfig.Icon;

    // Filter out system fields from custom fields list to avoid duplicates
    const customFields = draft.fields?.filter(f => !systemConfig.keys.includes(f.name)) || [];

    const handleAddField = () => {
        if (!newField.label.trim()) return;

        const label = newField.label.trim();
        const name = label.toLowerCase().replace(/\s+/g, '_');

        // Prevent duplicate names
        if (customFields.find(f => f.name === name) || systemConfig.keys.includes(name)) {
            toast.error('Field with this name already exists');
            return;
        }

        const fieldObj = {
            name,
            label,
            type: newField.type,
            options: []
        };

        if (newField.type === 'select') {
            const opts = newField.options.split(',').map(s => s.trim()).filter(Boolean);
            if (opts.length === 0) {
                toast.error('Please provide at least one option for Select field');
                return;
            }
            fieldObj.options = opts;
        }

        const updatedFields = [...(draft.fields || []), fieldObj];

        setDraft({ ...draft, fields: updatedFields });
        setNewField({ name: '', label: '', type: 'text', options: '' });
    };

    const handleRemoveField = (fieldName) => {
        setDraft({
            ...draft,
            fields: draft.fields.filter(f => f.name !== fieldName)
        });
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(draft);
        setSaving(false);
    };

    if (isEditing) {
        return (
            <motion.div
                layoutId={`card-${vertical.id}`}
                className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden shadow-2xl relative h-[600px] flex flex-col md:flex-row`}
            >
                {/* LEFT PANEL: Identity & System Fields */}
                <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r ${theme.canvas.border} flex flex-col ${theme.canvas.bg}`}>
                    {/* Header */}
                    <div className={`p-6 border-b ${theme.canvas.border}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl ${theme.canvas.hover} bg-zinc-800/10 dark:bg-zinc-800 flex items-center justify-center ${theme.text.secondary}`}>
                                <Icon size={24} />
                            </div>
                            <div className="flex-1">
                                <label className={`text-xs ${theme.text.secondary} uppercase tracking-wider font-semibold`}>Vertical Name</label>
                                <input
                                    value={draft.label}
                                    onChange={e => setDraft({ ...draft, label: e.target.value })}
                                    className={`bg-transparent text-xl font-bold ${theme.text.primary} focus:outline-none placeholder:${theme.text.secondary} w-full mt-1`}
                                    placeholder="e.g. Corporate"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={`text-xs ${theme.text.secondary} uppercase tracking-wider font-semibold block mb-2`}>Vertical Type</label>
                                {isCreating ? (
                                    <select
                                        value={draft.type}
                                        onChange={e => setDraft({ ...draft, type: e.target.value })}
                                        className={`w-full ${theme.canvas.bg} text-sm ${theme.text.primary} border ${theme.canvas.border} rounded-lg px-3 py-2 focus:ring-2 focus:ring-zinc-500 cursor-pointer`}
                                    >
                                        <option value="general">General (Projects)</option>
                                        <option value="wedding">Wedding (Bride/Groom)</option>
                                        <option value="children">Children (Kids/Events)</option>
                                    </select>
                                ) : (
                                    <div className={`flex items-center gap-2 ${theme.canvas.bg} px-3 py-2 rounded-lg border ${theme.canvas.border}`}>
                                        <span className={`text-sm ${theme.text.primary} capitalize`}>{vType}</span>
                                        <span className={`text-xs ${theme.text.secondary} ml-auto`}>Immutable</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* System Fields List (Read Only) */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className={`flex items-center gap-2 ${theme.text.secondary} mb-4`}>
                            <Shield size={14} className="text-emerald-500" />
                            <h4 className="text-xs font-bold uppercase tracking-widest">Core Fields</h4>
                        </div>
                        <div className="space-y-2">
                            {systemConfig.fields.map((f, i) => (
                                <div key={i} className={`flex items-center justify-between p-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg`}>
                                    <div className="flex items-center gap-3">
                                        <Lock size={12} className={theme.text.secondary} />
                                        <span className={`text-xs ${theme.text.primary} font-medium`}>{f.label}</span>
                                    </div>
                                    <span className={`text-[10px] ${theme.text.secondary} font-mono ${theme.canvas.hover} px-1.5 py-0.5 rounded`}>{f.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delete Button Area */}
                    {!isCreating && (
                        <div className={`p-6 border-t ${theme.canvas.border} mt-auto`}>
                            <button onClick={onDelete} className="w-full py-2 text-red-600 dark:text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-red-500/20">
                                Delete Vertical
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: Custom Fields */}
                <div className={`flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 border-l ${theme.canvas.border}`}>
                    <div className={`p-6 border-b ${theme.canvas.border} flex justify-between items-center ${theme.canvas.bg}`}>
                        <div className="flex items-center gap-2">
                            <Settings size={16} className="text-blue-500" />
                            <h4 className={`text-sm font-bold ${theme.text.primary} uppercase tracking-wider`}>Custom Fields Configuration</h4>
                        </div>
                        <div className={`text-xs ${theme.text.secondary}`}>
                            {customFields.length} custom fields
                        </div>
                    </div>

                    {/* Add Field Area */}
                    <div className={`p-6 ${theme.canvas.bg} border-b ${theme.canvas.border}`}>
                        <div className={`text-xs font-medium ${theme.text.secondary} mb-3 uppercase tracking-wider`}>Add New Field</div>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <input
                                    placeholder="Field Label (e.g. Venue Contact)"
                                    value={newField.label}
                                    onChange={e => setNewField({ ...newField, label: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleAddField()}
                                    className={`flex-1 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-colors placeholder:${theme.text.secondary}`}
                                />
                                <select
                                    value={newField.type}
                                    onChange={e => setNewField({ ...newField, type: e.target.value })}
                                    className={`w-32 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 cursor-pointer`}
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="select">Select</option>
                                </select>
                                <button
                                    onClick={handleAddField}
                                    disabled={!newField.label}
                                    className={`px-4 ${theme.text.inverse} bg-black dark:bg-white hover:opacity-90 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2`}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                            {/* Conditional Options Input for Select Type */}
                            {newField.type === 'select' && (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <CornerDownRight size={14} className={`${theme.text.secondary} ml-2 mt-2.5`} />
                                    <input
                                        placeholder="Options (comma separated, e.g. Pending, Approved, Rejected)"
                                        value={newField.options}
                                        onChange={e => setNewField({ ...newField, options: e.target.value })}
                                        onKeyDown={e => e.key === 'Enter' && handleAddField()}
                                        className={`flex-1 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-colors placeholder:${theme.text.secondary}`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className={`flex-1 overflow-y-auto p-6 ${theme.canvas.bg} custom-scrollbar`}>
                        {customFields.length === 0 ? (
                            <div className={`h-full flex flex-col items-center justify-center ${theme.text.secondary} space-y-2 border border-dashed ${theme.canvas.border} rounded-xl`}>
                                <List size={24} className={theme.text.secondary} />
                                <p className="text-sm">No custom fields added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {customFields.map((f, i) => (
                                    <motion.div
                                        key={f.name}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center justify-between p-3 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg group hover:border-zinc-500 hover:${theme.canvas.hover} transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg ${theme.canvas.bg} flex items-center justify-center ${theme.text.secondary} text-xs font-mono border ${theme.canvas.border}`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className={`text-sm ${theme.text.primary} font-medium`}>{f.label}</div>
                                                {f.type === 'select' && f.options && (
                                                    <div className={`text-[10px] ${theme.text.secondary} mt-0.5 flex flex-wrap gap-1`}>
                                                        {f.options.map((opt, oi) => (
                                                            <span key={oi} className={`${theme.canvas.bg} border ${theme.canvas.border} px-1 py-px rounded`}>{opt}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] ${theme.text.secondary} uppercase font-bold tracking-wider ${theme.canvas.bg} px-2 py-1 rounded border ${theme.canvas.border}`}>{f.type}</span>
                                            <button
                                                onClick={() => handleRemoveField(f.name)}
                                                className={`w-8 h-8 flex items-center justify-center ${theme.text.secondary} hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Panel Footer */}
                    <div className={`p-6 border-t ${theme.canvas.border} ${theme.canvas.bg} flex justify-end gap-3`}>
                        <button onClick={onCancel} className={`px-6 py-2.5 text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-8 py-2.5 rounded-xl text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-white/5 active:scale-95`}
                        >
                            {saving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // View Mode
    return (
        <motion.div
            layoutId={`card-${vertical.id}`}
            className={`group relative ${theme.canvas.card} border ${theme.canvas.border} hover:border-zinc-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/50 h-64 flex flex-col`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-zinc-800/10 dark:bg-zinc-800 border ${theme.canvas.border} flex items-center justify-center text-2xl group-hover:${theme.text.primary} group-hover:scale-110 transition-all duration-300`}>
                        <Icon size={20} strokeWidth={1.5} className={theme.text.secondary} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${theme.text.primary} group-hover:text-purple-500 transition-colors`}>{vertical.label}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${theme.text.secondary} bg-zinc-800/10 dark:bg-zinc-800/50 px-2 py-0.5 rounded capitalize`}>
                                {vType}
                            </span>
                            <span className={`text-xs ${theme.text.secondary}`}>•</span>
                            <span className={`text-xs ${theme.text.secondary}`}>{customFields.length} Custom Fields</span>
                        </div>
                    </div>
                </div>
                {canEdit && (
                    <button
                        onClick={onEdit}
                        className={`p-2 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors opacity-0 group-hover:opacity-100 border ${theme.canvas.border}`}
                    >
                        <Edit3 size={14} />
                    </button>
                )}
            </div>

            {/* Config Preview - Schema Snapshot */}
            <div className="flex-1 overflow-hidden">
                <div className="space-y-4">
                    {/* System Fields Hint */}
                    <div>
                        <div className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-2`}>Core Schema</div>
                        <div className="flex flex-wrap gap-2">
                            {systemConfig.fields.slice(0, 3).map(f => (
                                <span key={f.label} className={`text-[10px] px-2 py-1 rounded bg-zinc-800/10 dark:bg-zinc-800/50 ${theme.text.secondary} border ${theme.canvas.border} flex items-center gap-1`}>
                                    <Lock size={8} /> {f.label}
                                </span>
                            ))}
                            <span className={`text-[10px] px-2 py-1 ${theme.text.secondary}`}>+ {Math.max(0, systemConfig.fields.length - 3)} more</span>
                        </div>
                    </div>

                    {/* Custom Fields List */}
                    <div>
                        <div className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-2 flex justify-between`}>
                            <span>Custom Fields</span>
                            <span className={`bg-zinc-800/10 dark:bg-zinc-800 ${theme.text.secondary} px-1.5 rounded text-[10px]`}>{customFields.length}</span>
                        </div>
                        {customFields.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {customFields.slice(0, 5).map(f => (
                                    <span key={f.name} className={`text-[10px] px-2 py-1 rounded bg-zinc-800/10 dark:bg-zinc-800 ${theme.text.primary} border ${theme.canvas.border}`}>
                                        {f.label}
                                    </span>
                                ))}
                                {customFields.length > 5 && (
                                    <span className={`text-[10px] px-2 py-1 rounded bg-zinc-800/10 dark:bg-zinc-800/30 ${theme.text.secondary} border ${theme.canvas.border}`}>
                                        + {customFields.length - 5} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className={`text-[10px] ${theme.text.secondary} italic`}>No custom fields added</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`mt-auto pt-4 border-t ${theme.canvas.border}`}>
                {canEdit ? (
                    <button
                        onClick={onEdit}
                        className={`w-full py-2 rounded-lg bg-zinc-800/10 dark:bg-zinc-800/50 text-xs font-medium ${theme.text.secondary} group-hover:${theme.text.primary} group-hover:${theme.canvas.hover} transition-all flex items-center justify-center gap-2 border border-transparent group-hover:border-zinc-500`}
                    >
                        Configure Vertical
                    </button>
                ) : (
                    <div className={`w-full py-2 text-center text-xs ${theme.text.secondary} italic`}>
                        View Only
                    </div>
                )}
            </div>
        </motion.div>
    );
};

function VerticalsSection({ role }) {
    const { theme } = useTheme();
    const { refreshConfig } = useAgencyConfig();
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // 'new' or vertical.id
    const isOwner = role === 'owner';

    // Derived state for creating new vertical
    const isCreating = editingId === 'new';

    function fetchVerticals() {
        setLoading(true);
        api.get('/settings/verticals').then(r => {
            setVerticals(r.data.verticals || []);
            setLoading(false);
        });
    }

    useEffect(() => {
        setTimeout(() => fetchVerticals(), 0);
    }, []);

    const handleSaveVertical = async (updatedVertical) => {
        try {
            let newList;
            if (isCreating) {
                const id = updatedVertical.label.toLowerCase().replace(/\s+/g, '_');
                const newVertical = { ...updatedVertical, id };
                newList = [...verticals, newVertical];
            } else {
                newList = verticals.map(v => v.id === updatedVertical.id ? updatedVertical : v);
            }

            // Persistence
            await api.patch('/settings/verticals', { verticals: newList });

            setVerticals(newList);
            setEditingId(null);
            await refreshConfig(); // Update context
            toast.success(isCreating ? 'Vertical Created' : 'Configuration Saved');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save changes');
        }
    };

    const handleDeleteVertical = async (id) => {
        const confirmed = confirm(
            "⚠️ WARNING: Deleting this vertical will NOT delete the actual projects associated with it.\n\n" +
            "However, those projects may become inaccessible or display incorrectly in the dashboard because their configuration will be missing.\n\n" +
            "Are you sure you want to delete this vertical?"
        );
        if (!confirmed) return;

        try {
            const newList = verticals.filter(v => v.id !== id);
            await api.patch('/settings/verticals', { verticals: newList });
            setVerticals(newList);
            setEditingId(null);
            await refreshConfig();
            toast.success('Vertical Deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className={theme.text.secondary}>Loading configuration...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                        <LayoutGrid className="text-purple-500" />
                        Command Center
                    </h2>
                    <p className={`${theme.text.secondary} mt-2 max-w-xl`}>
                        Configure your agency's business verticals. Define custom fields, manage core data requirements, and control your project workflows from a single pane of glass.
                    </p>
                </div>
                {!editingId && isOwner && (
                    <button
                        onClick={() => setEditingId('new')}
                        className={`px-6 py-3 ${theme.text.inverse} bg-black dark:bg-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2`}
                    >
                        <Plus size={18} /> Add Vertical
                    </button>
                )}
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative items-start">
                {/* 
                    If creating new, show the editor card first.
                 */}
                <AnimatePresence mode="popLayout">
                    {isCreating && (
                        <div className="xl:col-span-2">
                            <VerticalCard
                                key="new-vertical"
                                vertical={{ label: '', type: 'general', fields: [] }}
                                isEditing={true}
                                isCreating={true}
                                onSave={handleSaveVertical}
                                onCancel={() => setEditingId(null)}
                                canEdit={true}
                            />
                        </div>
                    )}

                    {verticals.map(vertical => (
                        <motion.div
                            layout
                            key={vertical.id}
                            className={`${editingId === vertical.id ? 'xl:col-span-2' : ''} ${editingId && editingId !== vertical.id ? 'opacity-30 pointer-events-none grayscale transition-all' : ''}`}
                        >
                            <VerticalCard
                                vertical={vertical}
                                isEditing={editingId === vertical.id}
                                onEdit={() => setEditingId(vertical.id)}
                                onSave={handleSaveVertical}
                                onCancel={() => setEditingId(null)}
                                onDelete={() => handleDeleteVertical(vertical.id)}
                                canEdit={isOwner}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default VerticalsSection;
