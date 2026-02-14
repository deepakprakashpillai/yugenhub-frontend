import { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { toast } from 'sonner';
import { TemplateModal } from '../modals/TemplateModal';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';

const TemplatesSection = () => {
    const { theme } = useTheme();
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
                <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>Project Templates</h2>
                <div className="flex justify-between items-end">
                    <p className={`${theme.text.secondary} text-sm max-w-2xl`}>
                        Manage reusable project structures for different verticals. Start by creating a project and saving it as a template, or create one from scratch here.
                    </p>
                    <button
                        onClick={() => setModal({ open: true, mode: 'create', template: null })}
                        className={`flex items-center gap-2 px-4 py-2 ${theme.text.inverse} bg-black dark:bg-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors`}
                    >
                        <Icons.Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={`flex gap-2 overflow-x-auto pb-2 border-b ${theme.canvas.border}`}>
                <button
                    onClick={() => setFilterVertical('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterVertical === 'all' ? `${theme.canvas.active} ${theme.text.primary}` : `${theme.text.secondary} hover:${theme.text.primary}`
                        }`}
                >
                    All Verticals
                </button>
                {config?.verticals?.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setFilterVertical(v.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterVertical === v.id ? `${theme.canvas.active} ${theme.text.primary}` : `${theme.text.secondary} hover:${theme.text.primary}`
                            }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme.text.secondary}`}></div>
                </div>
            ) : templates.length === 0 ? (
                <div className={`text-center py-20 border-2 border-dashed ${theme.canvas.border} rounded-2xl`}>
                    <Icons.LayoutTemplate className={`w-12 h-12 ${theme.text.secondary} mx-auto mb-4`} />
                    <h3 className={`text-lg font-medium ${theme.text.primary}`}>No templates found</h3>
                    <p className={`${theme.text.secondary} text-sm mt-1`}>Create your first template to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tmpl => (
                        <div key={tmpl._id} className={`group relative ${theme.canvas.card} border ${theme.canvas.border} rounded-2xl p-5 hover:border-zinc-500 transition-all hover:${theme.canvas.hover}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] uppercase tracking-wider ${theme.canvas.bg} ${theme.text.secondary} px-2 py-1 rounded-md font-medium border ${theme.canvas.border} group-hover:${theme.text.primary} transition-colors`}>
                                    {tmpl.vertical}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setModal({ open: true, mode: 'edit', template: tmpl })}
                                        className={`p-1.5 hover:${theme.canvas.bg} rounded-lg ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                                    >
                                        <Icons.Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tmpl._id)}
                                        className={`p-1.5 hover:bg-red-500/20 rounded-lg ${theme.text.secondary} hover:text-red-400 transition-colors`}
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className={`text-lg font-bold ${theme.text.primary} mb-2 line-clamp-1`}>{tmpl.name}</h3>
                            <p className={`text-sm ${theme.text.secondary} line-clamp-2 mb-6 h-10`}>
                                {tmpl.description || "No description provided."}
                            </p>

                            <div className={`flex items-center gap-4 text-xs ${theme.text.secondary} border-t ${theme.canvas.border} pt-4 mt-auto`}>
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
