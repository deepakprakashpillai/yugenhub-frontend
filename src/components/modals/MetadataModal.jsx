import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';

// Field type definitions for different verticals
const VERTICAL_FIELDS = {
    knots: [
        { name: 'side', label: 'Side', type: 'select', options: ['Groom', 'Bride', 'Both'] },
        { name: 'groom_name', label: 'Groom Name', type: 'text' },
        { name: 'bride_name', label: 'Bride Name', type: 'text' },
        { name: 'groom_number', label: 'Groom Phone', type: 'text' },
        { name: 'bride_number', label: 'Bride Phone', type: 'text' },
        { name: 'groom_age', label: 'Groom Age', type: 'number' },
        { name: 'bride_age', label: 'Bride Age', type: 'number' },
        { name: 'groom_location', label: 'Groom Location', type: 'text' },
        { name: 'bride_location', label: 'Bride Location', type: 'text' },
        { name: 'wedding_style', label: 'Wedding Style', type: 'select', options: ['Traditional', 'Modern', 'Destination', 'Intimate'] },
        { name: 'wedding_date', label: 'Wedding Date', type: 'date' }
    ],
    pluto: [
        { name: 'child_name', label: 'Child Name', type: 'text' },
        { name: 'child_age', label: 'Child Age', type: 'number' },
        { name: 'child_birthday', label: 'Birthday', type: 'date' },
        { name: 'occasion_type', label: 'Occasion', type: 'select', options: ['Birthday', 'Baptism', 'Newborn'] },
        { name: 'father_name', label: 'Father Name', type: 'text' },
        { name: 'mother_name', label: 'Mother Name', type: 'text' },
        { name: 'address', label: 'Address', type: 'textarea' },
        { name: 'theme', label: 'Theme', type: 'text' }
    ],
    festia: [
        { name: 'event_scale', label: 'Event Scale', type: 'select', options: ['Private', 'Corporate', 'Mass'] },
        { name: 'company_name', label: 'Company/Organizer', type: 'text' },
        { name: 'event_name', label: 'Event Name', type: 'text' },
        { name: 'venue', label: 'Venue', type: 'text' }
    ],
    thryv: [
        { name: 'business_name', label: 'Business Name', type: 'text' },
        { name: 'campaign_type', label: 'Campaign Type', type: 'text' },
        { name: 'target_audience', label: 'Target Audience', type: 'text' }
    ]
};

const MetadataModal = ({ isOpen, onClose, onSave, project, loading = false }) => {
    const vertical = project?.vertical?.toLowerCase() || 'thryv';
    const fields = VERTICAL_FIELDS[vertical] || VERTICAL_FIELDS.thryv;

    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (isOpen && project?.metadata) {
            setFormData({ ...project.metadata });
        }
    }, [isOpen, project]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseInt(value) : '') : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ metadata: formData });
    };

    const renderField = (field) => {
        const value = formData[field.name] ?? '';

        switch (field.type) {
            case 'select':
                return (
                    <select
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        name={field.name}
                        value={value ? value.slice(0, 10) : ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Details" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm text-zinc-400 mb-1.5">{field.label}</label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
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
