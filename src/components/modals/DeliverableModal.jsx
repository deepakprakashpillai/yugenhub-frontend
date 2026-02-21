import { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icons } from '../Icons';
import clsx from 'clsx';
import DatePicker from '../ui/DatePicker';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

/**
 * DeliverableModal - Specialized for managing Event Deliverables.
 * This is a distinct UX from general Tasks.
 */
const DeliverableModal = ({
    isOpen,
    onClose,
    onSave,
    deliverable = null,
    users = [],
    loading = false
}) => {
    // State to toggle between View and Edit modes
    const [viewMode, setViewMode] = useState(false);
    const { config } = useAgencyConfig();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setViewMode(!!deliverable), 0);
        }
    }, [isOpen, deliverable]);

    const isEditing = !!deliverable;

    const [formData, setFormData] = useState({
        title: '',
        quantity: 1,
        description: '',
        status: 'Pending',
        assigned_to: '',
        due_date: '',
    });

    useEffect(() => {
        if (isOpen && deliverable) {
            setTimeout(() => setFormData({
                title: deliverable.title || '',
                quantity: deliverable.quantity || 1,
                description: deliverable.description || '',
                status: deliverable.status || 'Pending',
                assigned_to: deliverable.assigned_to || '',
                due_date: deliverable.due_date ? deliverable.due_date.split('T')[0] : '',
            }), 0);
        } else if (isOpen) {
            // Reset for new deliverable
            setTimeout(() => setFormData({
                title: '',
                quantity: 1,
                description: '',
                status: 'Pending',
                assigned_to: '',
                due_date: '',
            }), 0);
        }
    }, [isOpen, deliverable]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('Deliverable Name is required');
            return;
        }

        const payload = {
            ...formData,
            quantity: parseInt(formData.quantity, 10) || 1,
            due_date: formData.due_date || null,
            assigned_to: formData.assigned_to || null,
            category: 'deliverable', // Auto-set
        };

        onSave(payload);
    };

    const statusOptions = [
        { value: 'Pending', label: 'Pending', icon: Icons.Clock, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
        { value: 'In Progress', label: 'In Progress', icon: Icons.Loader, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { value: 'Completed', label: 'Completed', icon: Icons.CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
        { value: 'Delivered', label: 'Delivered', icon: Icons.Package, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    ];

    const assignedUser = users.find(u => u.id === formData.assigned_to);

    // --- VIEW MODE RENDER ---
    const renderViewMode = () => {
        const statusConfig = statusOptions.find(o => o.value === formData.status) || statusOptions[0];
        const StatusIcon = statusConfig.icon;

        return (
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800">
                                <span className="text-xl font-black text-amber-500 leading-none">{formData.quantity}</span>
                                <span className="text-[9px] uppercase font-bold text-zinc-600 leading-none">QTY</span>
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight">{formData.title}</h2>
                        </div>
                        <div className={clsx("px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-2", statusConfig.color)}>
                            <StatusIcon className="w-4 h-4" />
                            {formData.status}
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div>
                            <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Assignee</div>
                            <div className="text-sm text-zinc-300 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                                    {assignedUser ? assignedUser.name.charAt(0) : '?'}
                                </div>
                                {assignedUser ? assignedUser.name : 'Unassigned'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Due Date</div>
                            <div className="text-sm text-zinc-300 flex items-center gap-2">
                                <Icons.Calendar className="w-4 h-4 text-zinc-500" />
                                {formData.due_date ? new Date(formData.due_date).toLocaleDateString() : 'None'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-xs uppercase text-zinc-500 font-bold mb-2">Notes & Instructions</h3>
                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                        {formData.description || <span className="text-zinc-600 italic">No notes provided.</span>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors font-bold"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => setViewMode(false)}
                        className="flex-1 px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors font-bold flex items-center justify-center gap-2"
                    >
                        <Icons.Edit className="w-4 h-4" /> Edit Deliverable
                    </button>
                </div>
            </div>
        );
    };

    // --- EDIT MODE RENDER ---
    const renderEditMode = () => (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Quantity */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-1.5">
                        Deliverable Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        autoFocus
                    >
                        <option value="">Select Type</option>
                        {(config?.deliverableTypes || []).map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                        ))}
                    </select>
                </div>
                <div className="w-24">
                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-1.5">Qty</label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-center"
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-xs uppercase text-zinc-500 font-bold mb-1.5">Notes</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any special instructions..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
            </div>

            {/* Status (Visual Toggle) */}
            <div>
                <label className="block text-xs uppercase text-zinc-500 font-bold mb-2">Status</label>
                <div className="grid grid-cols-4 gap-2">
                    {statusOptions.map(opt => {
                        const Icon = opt.icon;
                        const isActive = formData.status === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData(p => ({ ...p, status: opt.value }))}
                                className={clsx(
                                    "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all",
                                    isActive
                                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Due Date & Assignee */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-1.5">Due Date</label>
                    <DatePicker
                        value={formData.due_date}
                        onChange={(val) => setFormData(p => ({ ...p, due_date: val }))}
                        placeholder="Select date"
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-1.5">Assignee</label>
                    <select
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                    type="button"
                    onClick={() => {
                        if (deliverable) {
                            setViewMode(true);
                        } else {
                            onClose();
                        }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors font-medium"
                >
                    {deliverable ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                    {loading && <Icons.Loader className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Add Deliverable'}
                </button>
            </div>
        </form>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={viewMode ? 'Deliverable Details' : (isEditing ? 'Edit Deliverable' : 'New Deliverable')}>
            {viewMode ? renderViewMode() : renderEditMode()}
        </Modal>
    );
};

export default DeliverableModal;
