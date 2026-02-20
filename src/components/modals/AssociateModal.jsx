import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

const AssociateModal = ({ isOpen, onClose, onSave, associate = null, loading = false }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const isEditing = !!associate;

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        email: '',
        phone: '',
        location: '',
        notes: ''
    });

    const roleOptions = config?.associateRoles || [];

    useEffect(() => {
        if (isOpen && associate) {
            setTimeout(() => setFormData({
                name: associate.name || '',
                role: associate.role || '',
                email: associate.email || '',
                phone: associate.phone || '',
                location: associate.location || '',
                notes: associate.notes || ''
            }), 0);
        } else if (isOpen) {
            setTimeout(() => setFormData({ name: '', role: '', email: '', phone: '', location: '', notes: '' }), 0);
        }
    }, [isOpen, associate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Associate name is required');
            return;
        }
        if (!formData.role.trim()) {
            alert('Role is required');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Associate' : 'Add New Associate'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Associate name"
                        className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        autoFocus
                    />
                </div>

                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Role *</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                    >
                        <option value="">Select a role</option>
                        {roleOptions.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1`}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1`}>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, State"
                        className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                    />
                </div>

                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Any notes about this associate..."
                        className={`w-full px-3 py-2 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 resize-none`}
                    />
                </div>

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
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-lg bg-purple-600 ${theme.text.inverse} hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <Icons.Loader className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icons.Save className="w-4 h-4" />
                                {isEditing ? 'Save Changes' : 'Add Associate'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssociateModal;
