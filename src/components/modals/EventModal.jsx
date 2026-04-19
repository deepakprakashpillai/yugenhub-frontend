import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import { useTheme } from '../../context/ThemeContext';
import Textarea from '../ui/Textarea';

// Format a date string as a local YYYY-MM-DDTHH:MM value for datetime-local inputs.
// Uses local timezone throughout to avoid date-shifting on round-trips.
const toLocalDateTimeInput = (dateStr) => {
    if (!dateStr) return '';
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return '';
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventModal = ({ isOpen, onClose, onSave, event = null, loading = false }) => {
    const { theme } = useTheme();
    const isEditing = !!event;

    const [formData, setFormData] = useState({
        type: '',
        venue_name: '',
        venue_location: '',
        start_date: '',
        end_date: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen && event) {
            setFormData({
                type: event.type || '',
                venue_name: event.venue_name || '',
                venue_location: event.venue_location || '',
                start_date: toLocalDateTimeInput(event.start_date),
                end_date: toLocalDateTimeInput(event.end_date),
                notes: event.notes || ''
            });
        } else if (isOpen) {
            setFormData({ type: '', venue_name: '', venue_location: '', start_date: '', end_date: '', notes: '' });
        }
    }, [isOpen, event]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // datetime-local values without a timezone are parsed as local time by the browser,
        // so new Date(...).toISOString() correctly converts them to UTC.
        onSave({
            ...formData,
            start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
            end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Event' : 'Add New Event'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Event Type */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Event Type *</label>
                    <input
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        placeholder="e.g. Mehendi, Reception, Photo Shoot"
                        required
                        className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-purple-500`}
                    />
                </div>

                {/* Venue */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Venue Name</label>
                        <input
                            type="text"
                            name="venue_name"
                            value={formData.venue_name}
                            onChange={handleChange}
                            placeholder="e.g. Grand Palace"
                            className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Location</label>
                        <input
                            type="text"
                            name="venue_location"
                            value={formData.venue_location}
                            onChange={handleChange}
                            placeholder="e.g. Mumbai"
                            className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Start Date & Time</label>
                        <input
                            type="datetime-local"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>End Date & Time</label>
                        <input
                            type="datetime-local"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            className={`w-full px-3 py-2.5 ${theme.canvas.bg} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1.5`}>Notes</label>
                    <Textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special instructions..."
                        rows={3}
                    />
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
                        disabled={loading || !formData.type}
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
                                {isEditing ? 'Update Event' : 'Add Event'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EventModal;
