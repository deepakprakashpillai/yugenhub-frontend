import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';

const ClientModal = ({ isOpen, onClose, onSave, client = null, loading = false }) => {
    const isEditing = !!client;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen && client) {
            setFormData({
                name: client.name || '',
                email: client.email || '',
                phone: client.phone || '',
                location: client.location || '',
                notes: client.notes || ''
            });
        } else if (isOpen) {
            setFormData({ name: '', email: '', phone: '', location: '', notes: '' });
        }
    }, [isOpen, client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Client name is required');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Client' : 'Add New Client'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Client name"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, State"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        placeholder="Any notes about this client..."
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
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
                                {isEditing ? 'Save Changes' : 'Add Client'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ClientModal;
