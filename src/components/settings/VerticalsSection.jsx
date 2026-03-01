import { useState, useEffect } from 'react';
import {
    Plus, Edit3, Trash2, X,
    LayoutGrid, List, Settings, ChevronRight,
    Save, IndianRupee, Calendar, Camera,
    Eye, Table2, Type, CornerDownRight, Check
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../api/axios';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';


// ─── FIELD EDITOR COMPONENT ────────────────────────────────────────────────
const FieldEditor = ({ fields, onFieldsChange, label, theme }) => {
    const [newField, setNewField] = useState({ label: '', type: 'text', options: '' });

    const handleAdd = () => {
        if (!newField.label.trim()) return;
        const name = newField.label.trim().toLowerCase().replace(/\s+/g, '_');

        if (fields.find(f => f.name === name)) {
            toast.error('Field with this name already exists');
            return;
        }

        const fieldObj = {
            name,
            label: newField.label.trim(),
            type: newField.type,
            options: []
        };

        if (newField.type === 'select') {
            const opts = newField.options.split(',').map(s => s.trim()).filter(Boolean);
            if (opts.length === 0) {
                toast.error('Provide at least one option for Select fields');
                return;
            }
            fieldObj.options = opts;
        }

        onFieldsChange([...fields, fieldObj]);
        setNewField({ label: '', type: 'text', options: '' });
    };

    const handleRemove = (name) => {
        onFieldsChange(fields.filter(f => f.name !== name));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest`}>{label}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.canvas.bg} border ${theme.canvas.border} ${theme.text.secondary}`}>
                    {fields.length} fields
                </span>
            </div>

            {/* Add field form */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        placeholder="Field label..."
                        value={newField.label}
                        onChange={e => setNewField({ ...newField, label: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className={`flex-1 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-colors`}
                    />
                    <select
                        value={newField.type}
                        onChange={e => setNewField({ ...newField, type: e.target.value })}
                        className={`w-28 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-2 py-2 text-sm ${theme.text.primary} focus:outline-none cursor-pointer`}
                    >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="tel">Phone</option>
                        <option value="select">Select</option>
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!newField.label}
                        className={`px-3 py-2 ${theme.canvas.button.primary} rounded-lg disabled:opacity-30 text-sm font-medium flex items-center gap-1.5`}
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                {newField.type === 'select' && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <CornerDownRight size={14} className={`${theme.text.secondary} ml-2 mt-2.5`} />
                        <input
                            placeholder="Options (comma separated)"
                            value={newField.options}
                            onChange={e => setNewField({ ...newField, options: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className={`flex-1 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 transition-colors`}
                        />
                    </div>
                )}
            </div>

            {/* Field list */}
            {fields.length === 0 ? (
                <div className={`text-center py-6 border border-dashed ${theme.canvas.border} rounded-xl`}>
                    <List size={20} className={`mx-auto mb-2 ${theme.text.secondary}`} />
                    <p className={`text-xs ${theme.text.secondary}`}>No fields added yet</p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {fields.map((f, i) => (
                        <motion.div
                            key={f.name}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center justify-between p-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg group hover:border-zinc-500 transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded ${theme.canvas.hover} flex items-center justify-center text-[10px] font-mono ${theme.text.secondary} border ${theme.canvas.border}`}>
                                    {i + 1}
                                </span>
                                <div>
                                    <span className={`text-sm ${theme.text.primary} font-medium`}>{f.label}</span>
                                    {f.type === 'select' && f.options?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {f.options.map((opt, oi) => (
                                                <span key={oi} className={`text-[9px] px-1.5 py-px rounded ${theme.canvas.hover} border ${theme.canvas.border} ${theme.text.secondary}`}>{opt}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${theme.text.secondary} ${theme.canvas.hover} px-2 py-0.5 rounded border ${theme.canvas.border}`}>{f.type}</span>
                                <button
                                    onClick={() => handleRemove(f.name)}
                                    className={`w-7 h-7 flex items-center justify-center ${theme.text.secondary} hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};


// ─── FIELD PICKER (for card_fields / table_fields) ──────────────────────────
const FieldPicker = ({ allFields, selectedFields, onChange, label, icon: Icon, theme }) => {
    const toggleField = (fieldName) => {
        if (selectedFields.includes(fieldName)) {
            onChange(selectedFields.filter(f => f !== fieldName));
        } else {
            onChange([...selectedFields, fieldName]);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-blue-400" />
                <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest`}>{label}</h4>
            </div>
            {allFields.length === 0 ? (
                <p className={`text-xs ${theme.text.secondary} italic`}>Add project fields first</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {allFields.map(f => {
                        const isSelected = selectedFields.includes(f.name);
                        return (
                            <button
                                key={f.name}
                                onClick={() => toggleField(f.name)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                    ${isSelected
                                        ? 'bg-accent/15 text-accent border-accent/30'
                                        : `${theme.canvas.bg} ${theme.text.secondary} ${theme.canvas.border} hover:border-zinc-500`
                                    }`}
                            >
                                {isSelected && <Check size={12} />}
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


// ─── VERTICAL EDITOR PANEL ──────────────────────────────────────────────────
const VerticalEditor = ({ vertical, isCreating, onSave, onCancel, onDelete, theme }) => {
    const [draft, setDraft] = useState(vertical);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    useEffect(() => {
        setDraft(vertical);
    }, [vertical]);

    const handleSave = async () => {
        if (!draft.label?.trim()) {
            toast.error('Vertical name is required');
            return;
        }
        setSaving(true);
        await onSave(draft);
        setSaving(false);
    };

    // Resolve title template for live preview
    const resolveTemplate = (template) => {
        if (!template) return '(Client Name)';
        let resolved = template;
        const fields = draft.fields || [];
        fields.forEach(f => {
            resolved = resolved.replace(`{${f.name}}`, f.label);
        });
        // Replace any unresolved placeholders
        resolved = resolved.replace(/\{[^}]+\}/g, '…');
        return resolved || '(Client Name)';
    };

    const tabs = [
        { id: 'identity', label: 'Identity', icon: Settings },
        { id: 'display', label: 'Display', icon: Eye },
        { id: 'fields', label: 'Project Fields', icon: List },
        ...(draft.has_events !== false ? [{ id: 'events', label: 'Event Fields', icon: Calendar }] : []),
    ];

    return (
        <motion.div
            layoutId={`card-${vertical.id || 'new'}`}
            className={`${theme.canvas.card} border ${theme.canvas.border} rounded-2xl overflow-hidden shadow-2xl`}
        >
            {/* Editor Header */}
            <div className={`px-6 py-4 border-b ${theme.canvas.border} flex items-center justify-between ${theme.canvas.bg}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${theme.canvas.hover} flex items-center justify-center`}>
                        {draft.has_events !== false
                            ? <Calendar size={20} className="text-purple-400" />
                            : <Camera size={20} className="text-amber-400" />
                        }
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${theme.text.primary}`}>
                            {isCreating ? 'New Vertical' : `Edit ${draft.label}`}
                        </h3>
                        <p className={`text-xs ${theme.text.secondary}`}>
                            {draft.has_events !== false ? 'Event-based' : 'Single shoot'} • {(draft.fields || []).length} fields
                        </p>
                    </div>
                </div>
                <button onClick={onCancel} className={`p-2 rounded-lg ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors`}>
                    <X size={18} />
                </button>
            </div>

            {/* Tab Bar */}
            <div className={`flex border-b ${theme.canvas.border} ${theme.canvas.bg} px-6 gap-1`}>
                {tabs.map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all
                                ${isActive
                                    ? `${theme.text.primary} border-current`
                                    : `${theme.text.secondary} border-transparent hover:${theme.text.primary}`
                                }`}
                        >
                            <TabIcon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className={`p-6 min-h-[300px] max-h-[500px] overflow-y-auto ${theme.canvas.bg}`}>
                <AnimatePresence mode="wait">
                    {/* ─── IDENTITY TAB ─── */}
                    {activeTab === 'identity' && (
                        <motion.div key="identity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-xs ${theme.text.secondary} uppercase tracking-wider font-semibold block mb-2`}>Name</label>
                                    <input
                                        value={draft.label || ''}
                                        onChange={e => setDraft({ ...draft, label: e.target.value })}
                                        className={`w-full bg-transparent text-lg font-bold ${theme.text.primary} focus:outline-none border-b ${theme.canvas.border} focus:border-zinc-500 pb-1 transition-colors`}
                                        placeholder="e.g. Corporate"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs ${theme.text.secondary} uppercase tracking-wider font-semibold block mb-2`}>Description</label>
                                    <input
                                        value={draft.description || ''}
                                        onChange={e => setDraft({ ...draft, description: e.target.value })}
                                        className={`w-full bg-transparent text-sm ${theme.text.primary} focus:outline-none border-b ${theme.canvas.border} focus:border-zinc-500 pb-1 transition-colors`}
                                        placeholder="Short description"
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border ${theme.canvas.border}`}>
                                {/* Has Events Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className={`text-sm font-medium ${theme.text.primary} flex items-center gap-2`}>
                                            <Calendar size={14} className="text-purple-400" /> Event-based
                                        </label>
                                        <p className={`text-[10px] ${theme.text.secondary} mt-0.5 ml-5`}>
                                            Multi-event model with venues & timeline
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDraft({ ...draft, has_events: draft.has_events === false ? true : false })}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${draft.has_events !== false ? 'bg-purple-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${draft.has_events !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Finance Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className={`text-sm font-medium ${theme.text.primary} flex items-center gap-2`}>
                                            <IndianRupee size={14} className="text-emerald-400" /> Finance Summary
                                        </label>
                                        <p className={`text-[10px] ${theme.text.secondary} mt-0.5 ml-5`}>
                                            Include in financial overview
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDraft({ ...draft, include_in_finance_summary: !draft.include_in_finance_summary })}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${draft.include_in_finance_summary !== false ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${draft.include_in_finance_summary !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Calendar Sync Toggle */}
                                <div className="flex items-center justify-between col-span-1 md:col-span-2 mt-2 pt-4 border-t border-zinc-500/10 dark:border-zinc-800/50">
                                    <div>
                                        <label className={`text-sm font-medium ${theme.text.primary} flex items-center gap-2`}>
                                            <Calendar size={14} className="text-blue-400" /> Calendar Sync
                                        </label>
                                        <p className={`text-[10px] ${theme.text.secondary} mt-0.5 ml-5`}>
                                            Sync events to an external calendar <span className="text-emerald-500 font-semibold text-[9px]">(Requires Global Calendar Sync)</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setDraft({ ...draft, calendar_sync: draft.calendar_sync !== false ? false : true })}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${draft.calendar_sync !== false ? 'bg-blue-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${draft.calendar_sync !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Delete */}
                            {!isCreating && (
                                <div className={`pt-4 border-t ${theme.canvas.border}`}>
                                    <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-xs font-medium hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">
                                        Delete Vertical
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── DISPLAY TAB ─── */}
                    {activeTab === 'display' && (
                        <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Title Template */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Type size={14} className="text-blue-400" />
                                        <h4 className={`text-xs font-bold ${theme.text.secondary} uppercase tracking-widest`}>Title Template</h4>
                                    </div>
                                    <p className={`text-[10px] ${theme.text.secondary} ml-5 mb-3`}>
                                        Use <code className={`px-1 py-px rounded ${theme.canvas.hover} text-[10px]`}>{'{field_name}'}</code> placeholders. Falls back to client name if empty.
                                    </p>
                                </div>
                                <input
                                    value={draft.title_template || ''}
                                    onChange={e => setDraft({ ...draft, title_template: e.target.value })}
                                    placeholder='e.g. {groom_name} & {bride_name}'
                                    className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-3 py-2 text-sm ${theme.text.primary} focus:outline-none focus:border-zinc-500 font-mono transition-colors`}
                                />
                                {/* Available fields hint */}
                                {(draft.fields || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className={`text-[10px] ${theme.text.secondary} mr-1`}>Fields:</span>
                                        {(draft.fields || []).map(f => (
                                            <button
                                                key={f.name}
                                                onClick={() => {
                                                    const template = (draft.title_template || '') + `{${f.name}}`;
                                                    setDraft({ ...draft, title_template: template });
                                                }}
                                                className={`text-[10px] px-1.5 py-0.5 rounded ${theme.canvas.hover} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary} cursor-pointer transition-colors`}
                                            >
                                                {`{${f.name}}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {/* Live preview */}
                                <div className={`text-sm ${theme.text.primary} p-3 rounded-lg border border-dashed ${theme.canvas.border}`}>
                                    <span className={`text-[10px] ${theme.text.secondary} uppercase tracking-wider block mb-1`}>Preview</span>
                                    <span className="font-medium">{resolveTemplate(draft.title_template)}</span>
                                </div>
                            </div>

                            {/* Card & Table field pickers */}
                            <FieldPicker
                                allFields={draft.fields || []}
                                selectedFields={draft.card_fields || []}
                                onChange={card_fields => setDraft({ ...draft, card_fields })}
                                label="Card Badge Fields"
                                icon={Eye}
                                theme={theme}
                            />

                            <FieldPicker
                                allFields={draft.fields || []}
                                selectedFields={draft.table_fields || []}
                                onChange={table_fields => setDraft({ ...draft, table_fields })}
                                label="Table Columns"
                                icon={Table2}
                                theme={theme}
                            />
                        </motion.div>
                    )}

                    {/* ─── PROJECT FIELDS TAB ─── */}
                    {activeTab === 'fields' && (
                        <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <FieldEditor
                                fields={draft.fields || []}
                                onFieldsChange={fields => setDraft({ ...draft, fields })}
                                label="Project Metadata Fields"
                                theme={theme}
                            />
                        </motion.div>
                    )}

                    {/* ─── EVENT FIELDS TAB ─── */}
                    {activeTab === 'events' && draft.has_events !== false && (
                        <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <p className={`text-xs ${theme.text.secondary} mb-4`}>
                                Core event fields (Type, Dates, Venue) are always included. Add extra fields here.
                            </p>
                            <FieldEditor
                                fields={draft.event_fields || []}
                                onFieldsChange={event_fields => setDraft({ ...draft, event_fields })}
                                label="Custom Event Fields"
                                theme={theme}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${theme.canvas.border} ${theme.canvas.bg} flex justify-end gap-3`}>
                <button onClick={onCancel} className={`px-6 py-2.5 text-sm ${theme.text.secondary} hover:${theme.text.primary} transition-colors rounded-lg`}>
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold ${theme.canvas.button.primary} flex items-center gap-2 disabled:opacity-50 active:scale-95`}
                >
                    {saving ? <Settings size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                </button>
            </div>
        </motion.div>
    );
};


// ─── VERTICAL VIEW CARD ─────────────────────────────────────────────────────
const VerticalViewCard = ({ vertical, onEdit, canEdit, theme }) => {
    const fieldCount = (vertical.fields || []).length;
    const eventFieldCount = (vertical.event_fields || []).length;
    const hasEvents = vertical.has_events !== false;

    return (
        <motion.div
            layoutId={`card-${vertical.id}`}
            className={`group relative ${theme.canvas.card} border ${theme.canvas.border} hover:border-zinc-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/50 flex flex-col`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-zinc-800/10 dark:bg-zinc-800 border ${theme.canvas.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        {hasEvents
                            ? <Calendar size={18} strokeWidth={1.5} className="text-purple-400" />
                            : <Camera size={18} strokeWidth={1.5} className="text-amber-400" />
                        }
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${theme.text.primary} group-hover:text-purple-500 transition-colors`}>{vertical.label}</h3>
                        <p className={`text-xs ${theme.text.secondary}`}>{vertical.description}</p>
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

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium
                    ${hasEvents
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                >
                    {hasEvents ? '📅 Event-based' : '📷 Single Shoot'}
                </span>
                {vertical.include_in_finance_summary !== false && (
                    <span className={`text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium`}>
                        💰 Finance
                    </span>
                )}
            </div>

            {/* Fields Summary */}
            <div className="space-y-3 flex-1">
                <div>
                    <div className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-1.5`}>Project Fields</div>
                    {fieldCount > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(vertical.fields || []).slice(0, 6).map(f => (
                                <span key={f.name} className={`text-[10px] px-2 py-0.5 rounded ${theme.canvas.hover} border ${theme.canvas.border} ${theme.text.secondary}`}>
                                    {f.label}
                                </span>
                            ))}
                            {fieldCount > 6 && (
                                <span className={`text-[10px] px-2 py-0.5 ${theme.text.secondary}`}>+{fieldCount - 6}</span>
                            )}
                        </div>
                    ) : (
                        <span className={`text-[10px] ${theme.text.secondary} italic`}>No fields</span>
                    )}
                </div>

                {hasEvents && (
                    <div>
                        <div className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-1.5`}>Event Fields</div>
                        <span className={`text-[10px] ${theme.text.secondary}`}>
                            Core + {eventFieldCount} custom
                        </span>
                    </div>
                )}

                {/* Display Config Preview */}
                {vertical.title_template && (
                    <div>
                        <div className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-1`}>Title Formula</div>
                        <code className={`text-[10px] ${theme.text.secondary} font-mono`}>{vertical.title_template}</code>
                    </div>
                )}
            </div>

            <div className={`mt-4 pt-3 border-t ${theme.canvas.border}`}>
                {canEdit ? (
                    <button
                        onClick={onEdit}
                        className={`w-full py-2 rounded-lg ${theme.canvas.hover} text-xs font-medium ${theme.text.secondary} group-hover:${theme.text.primary} transition-all flex items-center justify-center gap-2 border border-transparent group-hover:border-zinc-500`}
                    >
                        Configure <ChevronRight size={14} />
                    </button>
                ) : (
                    <div className={`w-full py-2 text-center text-xs ${theme.text.secondary} italic`}>View Only</div>
                )}
            </div>
        </motion.div>
    );
};


// ─── MAIN SECTION ───────────────────────────────────────────────────────────
function VerticalsSection({ role }) {
    const { theme } = useTheme();
    const { refreshConfig } = useAgencyConfig();
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const isOwner = role === 'owner';

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

            await api.patch('/settings/verticals', { verticals: newList });
            setVerticals(newList);
            setEditingId(null);
            await refreshConfig();
            toast.success(isCreating ? 'Vertical Created' : 'Configuration Saved');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save changes');
        }
    };

    const handleDeleteVertical = async (id) => {
        const confirmed = confirm(
            "⚠️ WARNING: Deleting this vertical will NOT delete the actual projects associated with it.\n\n" +
            "However, those projects may become inaccessible or display incorrectly.\n\n" +
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
                        Verticals
                    </h2>
                    <p className={`${theme.text.secondary} mt-2 max-w-xl`}>
                        Configure your business verticals — define fields, control display, and choose between event-based or single-shoot workflows.
                    </p>
                </div>
                {!editingId && isOwner && (
                    <button
                        onClick={() => setEditingId('new')}
                        className={`px-6 py-3 ${theme.canvas.button.primary} rounded-xl font-bold text-sm flex items-center gap-2`}
                    >
                        <Plus size={18} /> Add Vertical
                    </button>
                )}
            </div>

            {/* Grid / Editor */}
            <div className="relative">
                <AnimatePresence mode="popLayout">
                    {/* Editor (full-width) */}
                    {editingId && (
                        <motion.div key={`editor-${editingId}`} layout className="mb-6">
                            <VerticalEditor
                                vertical={
                                    isCreating
                                        ? { label: '', description: '', has_events: true, include_in_finance_summary: true, fields: [], event_fields: [], title_template: '', card_fields: [], table_fields: [] }
                                        : verticals.find(v => v.id === editingId) || {}
                                }
                                isCreating={isCreating}
                                onSave={handleSaveVertical}
                                onCancel={() => setEditingId(null)}
                                onDelete={() => handleDeleteVertical(editingId)}
                                theme={theme}
                            />
                        </motion.div>
                    )}

                    {/* View Cards */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${editingId ? 'opacity-20 pointer-events-none grayscale' : ''} transition-all`}>
                        {verticals.map(vertical => (
                            <VerticalViewCard
                                key={vertical.id}
                                vertical={vertical}
                                onEdit={() => setEditingId(vertical.id)}
                                canEdit={isOwner}
                                theme={theme}
                            />
                        ))}
                    </div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default VerticalsSection;
