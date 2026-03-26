import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';
import DatePicker from '../ui/DatePicker';
import api from '../../api/axios';

const MetadataModal = ({ isOpen, onClose, onSave, project, loading = false }) => {
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const vertical = project?.vertical?.toLowerCase() || '';
    const configVertical = config?.verticals?.find(v => v.id === vertical);

    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        status: '',
        lead_source: '',
        notes: ''
    });
    const [metadata, setMetadata] = useState({});

    // Client search state
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const clientDropdownRef = useRef(null);

    // Fetch clients when opening
    useEffect(() => {
        if (!isOpen) return;
        const fetchClients = async () => {
            setLoadingClients(true);
            try {
                const res = await api.get('/clients', { params: { limit: 100 } });
                setClients(res.data.data || res.data || []);
            } catch {
                // non-critical
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, [isOpen]);

    // Populate form from project
    useEffect(() => {
        if (isOpen && project) {
            setFormData({
                client_id: project.client_id || '',
                client_name: project.client_name || '',
                status: project.status || '',
                lead_source: project.lead_source || project.metadata?.lead_source || '',
                notes: project.notes || ''
            });
            setClientSearch(project.client_name || '');
            setMetadata({ ...(project.metadata || {}) });
        }
    }, [isOpen, project]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const handleSelectClient = (client) => {
        setFormData(prev => ({ ...prev, client_id: client._id, client_name: client.name }));
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMetadataChange = (e) => {
        let { name, value, type } = e.target;
        if (type === 'number') value = value === '' ? null : Number(value);
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Build clean metadata (strip lead_source if it was stored there previously)
        const cleanMetadata = { ...metadata };
        delete cleanMetadata.lead_source;

        onSave({
            client_id: formData.client_id || undefined,
            client_name: formData.client_name || undefined,
            status: formData.status || undefined,
            lead_source: formData.lead_source || undefined,
            notes: formData.notes,
            metadata: cleanMetadata
        });
    };

    const fields = configVertical?.fields || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Details" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Client */}
                <div ref={clientDropdownRef} className="relative">
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Client</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => {
                                setClientSearch(e.target.value);
                                setShowClientDropdown(true);
                                setFormData(prev => ({ ...prev, client_id: '', client_name: '' }));
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            placeholder="Search client..."
                            className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 pr-10`}
                        />
                        <Icons.Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.text.secondary}`} />
                    </div>
                    {showClientDropdown && (
                        <div className={`absolute z-50 w-full mt-1 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl max-h-48 overflow-y-auto`}>
                            {loadingClients ? (
                                <div className={`px-3 py-4 text-center ${theme.text.secondary} text-sm`}>
                                    <Icons.Loader className="w-4 h-4 animate-spin mx-auto" />
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className={`px-3 py-4 text-center ${theme.text.secondary} text-sm`}>No clients found</div>
                            ) : (
                                filteredClients.slice(0, 10).map(client => (
                                    <button
                                        key={client._id}
                                        type="button"
                                        onClick={() => handleSelectClient(client)}
                                        className={`w-full px-3 py-2.5 flex items-center gap-3 ${theme.canvas.hover} text-left`}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {client.name?.charAt(0)}
                                        </div>
                                        <span className={`${theme.text.primary} text-sm`}>{client.name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Status & Lead Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1`}>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        >
                            <option value="">Select Status...</option>
                            {(config?.statusOptions || []).map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1`}>Lead Source</label>
                        <select
                            name="lead_source"
                            value={formData.lead_source}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        >
                            <option value="">Select Source...</option>
                            {(config?.leadSources || []).map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Project notes..."
                        className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 resize-none`}
                    />
                </div>

                {/* Config-driven vertical metadata fields */}
                {fields.length > 0 && (
                    <>
                        <div className={`border-t ${theme.canvas.border} pt-4`}>
                            <p className={`text-xs uppercase tracking-widest font-medium ${theme.text.secondary} mb-3 flex items-center gap-2`}>
                                <Icons.Briefcase className="w-3.5 h-3.5" />
                                {configVertical?.label || 'Project'} Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fields.map(field => (
                                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className={`block text-sm ${theme.text.secondary} mb-1`}>{field.label}</label>
                                        {field.type === 'select' ? (
                                            <select
                                                name={field.name}
                                                value={metadata[field.name] ?? ''}
                                                onChange={handleMetadataChange}
                                                className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                                            >
                                                <option value="">Select {field.label}</option>
                                                {field.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                name={field.name}
                                                value={metadata[field.name] ?? ''}
                                                onChange={handleMetadataChange}
                                                rows={2}
                                                className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 resize-none`}
                                            />
                                        ) : field.type === 'date' ? (
                                            <DatePicker
                                                value={metadata[field.name] ? String(metadata[field.name]).slice(0, 10) : ''}
                                                onChange={(val) => setMetadata(prev => ({ ...prev, [field.name]: val }))}
                                                placeholder={`Select ${field.label.toLowerCase()}`}
                                                className="w-full"
                                            />
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : field.type === 'tel' ? 'tel' : 'text'}
                                                name={field.name}
                                                value={metadata[field.name] ?? ''}
                                                onChange={handleMetadataChange}
                                                placeholder={field.label}
                                                className={`w-full px-3 py-2.5 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className={`sticky bottom-0 flex gap-3 pt-4 pb-2 border-t ${theme.canvas.border} ${theme.canvas.card}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-lg ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} transition-colors disabled:opacity-50`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icons.Loader className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icons.Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MetadataModal;
