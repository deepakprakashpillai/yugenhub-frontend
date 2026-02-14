import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';

const ROLES = ['Photographer', 'Cinematographer', 'Editor', 'Drone Pilot', 'Lead', 'Assistant'];

const TeamMemberModal = ({ isOpen, onClose, onSave, assignment = null, loading = false }) => {
    const { theme } = useTheme();
    const isEditing = !!assignment;
    const [associates, setAssociates] = useState([]);
    const [loadingAssociates, setLoadingAssociates] = useState(false);

    const [formData, setFormData] = useState({
        associate_id: assignment?.associate_id || '',
        associate_name: assignment?.associate_name || '',
        role: assignment?.role || 'Photographer'
    });

    // Sync formData with assignment prop when it changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                associate_id: assignment?.associate_id || '',
                associate_name: assignment?.associate_name || assignment?.name || '',
                role: assignment?.role || 'Photographer'
            });
        }
    }, [assignment, isOpen]);

    // Fetch associates on mount
    useEffect(() => {
        const fetchAssociates = async () => {
            setLoadingAssociates(true);
            try {
                const res = await api.get('/associates');
                setAssociates(res.data.data || res.data || []);
            } catch (err) {
                console.error('Failed to fetch associates:', err);
            } finally {
                setLoadingAssociates(false);
            }
        };
        if (isOpen) fetchAssociates();
    }, [isOpen]);

    const handleAssociateChange = (e) => {
        const associateId = e.target.value;
        const associate = associates.find(a => a._id === associateId);
        setFormData(prev => ({
            ...prev,
            associate_id: associateId,
            associate_name: associate?.name || '',
            role: associate?.primary_role || prev.role || 'Photographer'
        }));
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
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
                        <select
                            name="associate_id"
                            value={formData.associate_id}
                            onChange={handleAssociateChange}
                            className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        >
                            <option value="">Select an associate...</option>
                            {associates.map(associate => (
                                <option key={associate._id} value={associate._id}>
                                    {associate.name} ({associate.primary_role})
                                </option>
                            ))}
                        </select>
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
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                    >
                        {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

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
