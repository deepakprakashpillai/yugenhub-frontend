import { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { toast } from 'sonner';
import { TemplateModal } from '../modals/TemplateModal';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

const TemplatesSection = () => {
    const { config } = useAgencyConfig();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ open: false, mode: 'create', template: null });
    const [filterVertical, setFilterVertical] = useState('all');

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

    useEffect(() => {
        fetchTemplates();
    }, [filterVertical]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await api.delete(`/templates/${id}`);
            toast.success("Template deleted");
            fetchTemplates();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete template");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Project Templates</h2>
                <div className="flex justify-between items-end">
                    <p className="text-zinc-500 text-sm max-w-2xl">
                        Manage reusable project structures for different verticals. Start by creating a project and saving it as a template, or create one from scratch here.
                    </p>
                    <button
                        onClick={() => setModal({ open: true, mode: 'create', template: null })}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
                <button
                    onClick={() => setFilterVertical('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterVertical === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
                        }`}
                >
                    All Verticals
                </button>
                {config?.verticals?.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setFilterVertical(v.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterVertical === v.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl">
                    <Icons.LayoutTemplate className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white">No templates found</h3>
                    <p className="text-zinc-500 text-sm mt-1">Create your first template to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                        <div key={tmpl._id} className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all hover:bg-zinc-800/50">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md font-medium border border-zinc-700 group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                                    {tmpl.vertical}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setModal({ open: true, mode: 'edit', template: tmpl })}
                                        className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Icons.Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tmpl._id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{tmpl.name}</h3>
                            <p className="text-sm text-zinc-500 line-clamp-2 mb-6 h-10">
                                {tmpl.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-zinc-500 border-t border-zinc-800 pt-4 mt-auto">
                                <div className="flex items-center gap-1.5">
                                    <Icons.Calendar className="w-3.5 h-3.5" />
                                    <span>{tmpl.events?.length || 0} Events</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Icons.Package className="w-3.5 h-3.5" />
                                    <span>
                                        {tmpl.events?.reduce((acc, e) => acc + (e.deliverables?.length || 0), 0)} Deliverables
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TemplateModal
                isOpen={modal.open}
                onClose={() => setModal({ ...modal, open: false })}
                onSave={() => {
                    setModal({ ...modal, open: false });
                    fetchTemplates();
                }}
                mode={modal.mode}
                template={modal.template}
            />
        </div>
    );
};

export default TemplatesSection;
