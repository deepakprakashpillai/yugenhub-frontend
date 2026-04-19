import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import SearchableSelect from '../ui/SearchableSelect';
import Select from '../ui/Select';

const TeamMemberModal = ({ isOpen, onClose, onSave, assignment = null, loading = false, verticalId }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const isEditing = !!assignment;
    const [associates, setAssociates] = useState([]);
    const [loadingAssociates, setLoadingAssociates] = useState(false);

    // Use config-driven roles instead of hardcoded list
    const roleOptions = config?.associateRoles || [];

    const verticalConfig = config?.verticals?.find(v => v.id === verticalId);
    const assignmentTags = verticalConfig?.assignment_tags || [];

    const [formData, setFormData] = useState({
        associate_id: assignment?.associate_id || '',
        associate_name: assignment?.associate_name || '',
        role: assignment?.role || roleOptions[0] || '',
        tags: assignment?.tags || []
    });

    // Sync formData with assignment prop when it changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                associate_id: assignment?.associate_id || '',
                associate_name: assignment?.associate_name || assignment?.name || '',
                role: assignment?.role || roleOptions[0] || '',
                tags: assignment?.tags || []
            });
        }
    }, [assignment, isOpen]);

    // Fetch associates on mount
    useEffect(() => {
        const fetchAssociates = async () => {
            setLoadingAssociates(true);
            try {
                const res = await api.get('/associates', { params: { limit: 1000 } });
                setAssociates(res.data.data || res.data || []);
            } catch (err) {
                console.error('Failed to fetch associates:', err);
            } finally {
                setLoadingAssociates(false);
            }
        };
        if (isOpen) fetchAssociates();
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const toggleTag = (tag) => {
        const current = formData.tags || [];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        setFormData(prev => ({ ...prev, tags: updated }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Team Member' : 'Add Team Member'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Associate Selection */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Team Member</label>
                    {loadingAssociates ? (
                        <div className={`flex items-center gap-2 ${theme.text.secondary} text-sm`}>
                            <Icons.Loader className="w-4 h-4 animate-spin" />
                            Loading associates...
                        </div>
                    ) : (
                        <SearchableSelect
                            value={formData.associate_id}
                            onChange={(val) => {
                                const associate = associates.find(a => a._id === val);
                                setFormData(prev => ({
                                    ...prev,
                                    associate_id: val,
                                    associate_name: associate?.name || '',
                                    role: associate?.primary_role || prev.role || roleOptions[0] || ''
                                }));
                            }}
                            placeholder="Select an associate..."
                            options={associates.map(a => ({ value: a._id, label: `${a.name} (${a.primary_role})` }))}
                        />
                    )}
                </div>

                {/* Or enter name manually */}
                <div className={`text-center ${theme.text.secondary} text-xs`}>— or enter name manually —</div>

                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Name *</label>
                    <input
                        type="text"
                        name="associate_name"
                        value={formData.associate_name}
                        onChange={handleChange}
                        placeholder="Enter name"
                        required
                        className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-purple-500`}
                    />
                </div>

                {/* Role */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Role *</label>
                    <Select
                        value={formData.role}
                        onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                        placeholder="Select a role"
                        options={roleOptions.map(r => ({ value: r, label: r }))}
                        className="w-full"
                    />
                </div>

                {/* Tags */}
                {assignmentTags.length > 0 && (
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {assignmentTags.map(tag => {
                                const selected = (formData.tags || []).includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                            selected
                                                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                                                : `${theme.canvas.bg} ${theme.text.secondary} ${theme.canvas.border} hover:border-zinc-500`
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors disabled:opacity-50`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.associate_name || !formData.role}
                        className={`flex-1 px-4 py-2.5 rounded-lg bg-purple-600 ${theme.text.inverse} hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <Icons.Loader className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icons.UserPlus className="w-4 h-4" />
                                {isEditing ? 'Update' : 'Add Member'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TeamMemberModal;
