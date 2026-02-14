import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { toast } from 'sonner';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

export const TemplateModal = ({
    isOpen,
    onClose,
    onSave, // Returns template data
    onSelect, // Returns selected template for import
    mode = 'create', // 'create', 'edit', 'select'
    template = null, // For edit mode
    initialVertical = null,
    projectId = null // For "Save as Template"
}) => {
    const { config } = useAgencyConfig();
    const [loading, setLoading] = useState(false);

    // Form State (Create/Edit)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        vertical: initialVertical || 'knots',
        events: [], // Structure only: type, notes, etc.
        project_id: projectId // Include if creating from project
    });

    // Selection State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [filterVertical, setFilterVertical] = useState(initialVertical || 'all');

    // Fetch Templates for Selection
    useEffect(() => {
        if (isOpen && mode === 'select') {
            fetchTemplates();
        }
    }, [isOpen, mode, filterVertical]);

    // Initialize Form for Edit or Save as Template
    useEffect(() => {
        if (isOpen && mode === 'edit' && template) {
            setFormData({
                name: template.name,
                description: template.description || '',
                vertical: template.vertical,
                events: template.events || []
            });
        }
        if (isOpen && mode === 'create') {
            if (projectId) {
                // Fetch project details to populate preview
                const fetchProject = async () => {
                    setLoading(true);
                    try {
                        const res = await api.get(`/projects/${projectId}`);
                        const proj = res.data;
                        setFormData({
                            name: `Template from ${proj.code}`,
                            description: proj.name ? `Based on project ${proj.name}` : '',
                            vertical: proj.vertical,
                            events: proj.events || [], // Preview purpose
                            project_id: projectId
                        });
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to load project details");
                    } finally {
                        setLoading(false);
                    }
                };
                fetchProject();
            } else {
                setFormData({
                    name: '',
                    description: '',
                    vertical: initialVertical || 'knots',
                    events: [],
                    project_id: null
                });
            }
        }
    }, [isOpen, mode, template, initialVertical, projectId]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const params = filterVertical !== 'all' ? { vertical: filterVertical } : {};
            const res = await api.get('/templates', { params });
            setTemplates(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.warning("Template name is required");
            return;
        }

        setLoading(true);
        try {
            if (mode === 'edit' && template) {
                await api.patch(`/templates/${template._id}`, formData);
                toast.success("Template updated");
                onSave && onSave();
            } else {
                await api.post('/templates', formData);
                toast.success("Template created");
                onSave && onSave();
            }
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save template");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = () => {
        if (!selectedTemplateId) return;
        const tmpl = templates.find(t => t._id === selectedTemplateId);
        if (tmpl) {
            onSelect && onSelect(tmpl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {mode === 'select' ? 'Import Template' : (mode === 'edit' ? 'Edit Template' : 'New Template')}
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            {mode === 'select' ? 'Choose a structure to start with' : 'Define project structure'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {mode === 'select' ? (
                        <div className="space-y-4">
                            {/* Filter */}
                            {!initialVertical && (
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    <button
                                        onClick={() => setFilterVertical('all')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterVertical === 'all' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        All Verticals
                                    </button>
                                    {config?.verticals?.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setFilterVertical(v.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterVertical === v.id ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* List */}
                            {loading ? (
                                <div className="text-center py-10 text-zinc-500">Loading templates...</div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                                    <p className="text-zinc-500">No templates found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map(tmpl => (
                                        <div
                                            key={tmpl._id}
                                            onClick={() => setSelectedTemplateId(tmpl._id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTemplateId === tmpl._id
                                                ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500'
                                                : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-white truncate pr-2">{tmpl.name}</h3>
                                                <span className="text-[10px] uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                                                    {tmpl.vertical}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 line-clamp-2 mb-3 h-8">
                                                {tmpl.description || "No description"}
                                            </p>
                                            <div className="flex gap-3 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Icons.Calendar className="w-3 h-3" />
                                                    {tmpl.events?.length || 0} Events
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // CREATE / EDIT FORM
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Template Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                        placeholder="e.g., Standard Wedding Package"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Vertical</label>
                                    <select
                                        value={formData.vertical}
                                        onChange={e => setFormData({ ...formData, vertical: e.target.value })}
                                        disabled={mode === 'edit'} // Lock vertical on edit
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                    >
                                        {config?.verticals?.map(v => (
                                            <option key={v.id} value={v.id}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 h-20 resize-none"
                                    placeholder="Describe what this template includes..."
                                />
                            </div>

                            <div className="border-t border-zinc-800 pt-6">
                                <h3 className="text-sm font-bold text-white mb-2">Structure Preview</h3>
                                <p className="text-xs text-zinc-500 mb-4">
                                    Events and deliverables structure. (Edit strictly via creating a project and saving as template for now to ensure complex structure integrity).
                                </p>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {formData.events?.map((evt, i) => (
                                        <div key={i} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 flex justify-between items-center">
                                            <div>
                                                <span className="text-sm font-medium text-white block">{evt.type}</span>
                                                <span className="text-xs text-zinc-500">{evt.deliverables?.length || 0} Deliverables</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.events || formData.events.length === 0) && (
                                        <div className="text-center p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-600 text-xs">
                                            No events defined. It's recommended to create a project first and "Save as Template".
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>

                    {mode === 'select' ? (
                        <button
                            onClick={handleSelect}
                            disabled={!selectedTemplateId}
                            className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Import Selected
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (mode === 'edit' ? 'Update Template' : 'Create Template')}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
