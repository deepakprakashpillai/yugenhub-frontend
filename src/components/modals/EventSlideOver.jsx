import { useState, useEffect } from 'react';
import SlideOver from './SlideOver';
import { Icons } from '../Icons';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { toast } from 'sonner';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        'Pending': { bg: 'bg-zinc-700', text: 'text-zinc-300' },
        'In Progress': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
        'Completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
        'Delivered': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    };
    const config = statusConfig[status] || statusConfig['Pending'];
    return (
        <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", config.bg, config.text)}>
            {status}
        </span>
    );
};

// Inline Editable Deliverable Row
const DeliverableRow = ({ deliverable, onUpdate, onDelete }) => {
    const { config } = useAgencyConfig();
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(deliverable);

    const handleSave = () => {
        onUpdate(data);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={data.type}
                        onChange={(e) => setData({ ...data, type: e.target.value })}
                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                        {(config?.deliverableTypes || []).map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={data.quantity}
                        onChange={(e) => setData({ ...data, quantity: parseInt(e.target.value) || 1 })}
                        placeholder="Qty"
                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={data.status}
                        onChange={(e) => setData({ ...data, status: e.target.value })}
                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Delivered">Delivered</option>
                    </select>
                    <DatePicker
                        value={data.due_date?.slice(0, 10) || ''}
                        onChange={(val) => setData({ ...data, due_date: val })}
                        placeholder="Due date"
                        className="w-full"
                    />
                </div>
                <input
                    type="text"
                    value={data.notes || ''}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    placeholder="Notes (optional)"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium">
                        Save
                    </button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg group hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
                    <Icons.Package className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                    <p className="text-white text-sm font-medium">{deliverable.type}</p>
                    <p className="text-zinc-500 text-xs">Qty: {deliverable.quantity}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={deliverable.status} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-zinc-700 text-zinc-400">
                        <Icons.Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400">
                        <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Inline Editable Team Member Row
const TeamMemberRow = ({ member, onUpdate, onDelete }) => {
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(member);

    const handleSave = () => {
        onUpdate(data);
        setEditing(false);
    };

    const name = member.associate_name || member.name || 'Unknown';

    if (editing) {
        return (
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2">
                <input
                    type="text"
                    value={data.associate_name || data.name || ''}
                    onChange={(e) => setData({ ...data, associate_name: e.target.value, name: e.target.value })}
                    placeholder="Name"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
                <input
                    type="text"
                    value={data.role || ''}
                    onChange={(e) => setData({ ...data, role: e.target.value })}
                    placeholder="Role (e.g., Photographer)"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium">
                        Save
                    </button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg group hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                    {name.charAt(0)}
                </div>
                <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    <p className="text-zinc-500 text-xs">{member.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">{member.role}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-zinc-700 text-zinc-400">
                        <Icons.Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400">
                        <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Event Slide-Over Component
const EventSlideOver = ({
    isOpen,
    onClose,
    event,
    onSave,
    onDelete,
    loading = false
}) => {
    const isEditing = !!event?.id;
    const { config } = useAgencyConfig();

    const [formData, setFormData] = useState({
        type: '',
        venue_name: '',
        venue_location: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        notes: ''
    });

    const [deliverables, setDeliverables] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showAddDeliverable, setShowAddDeliverable] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({ type: '', quantity: 1, status: 'Pending', due_date: '', notes: '' });
    const [newMember, setNewMember] = useState({ name: '', role: '' });

    // Helper to parse datetime string into date and time parts
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return { date: '', time: '' };
        const dt = new Date(dateTimeStr);
        if (isNaN(dt.getTime())) return { date: '', time: '' };

        const date = dt.toISOString().slice(0, 10);
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        const time = (hours !== '00' || minutes !== '00') ? `${hours}:${minutes}` : '';

        return { date, time };
    };

    // Helper to combine date and time into ISO string
    const combineDateTime = (date, time) => {
        if (!date) return null;
        if (time) {
            return `${date}T${time}:00`;
        }
        return `${date}T00:00:00`;
    };

    useEffect(() => {
        if (isOpen && event) {
            setTimeout(() => {
                const start = parseDateTime(event.start_date);
                const end = parseDateTime(event.end_date);
                setFormData({
                    type: event.type || '',
                    venue_name: event.venue_name || '',
                    venue_location: event.venue_location || '',
                    start_date: start.date,
                    start_time: start.time,
                    end_date: end.date,
                    end_time: end.time,
                    notes: event.notes || ''
                });
                setDeliverables(event.deliverables || []);
                setAssignments(event.assignments || []);
            }, 0);
        } else if (isOpen) {
            setTimeout(() => {
                setFormData({ type: '', venue_name: '', venue_location: '', start_date: '', start_time: '', end_date: '', end_time: '', notes: '' });
                setDeliverables([]);
                setAssignments([]);
            }, 0);
        }
    }, [isOpen, event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.type.trim()) {
            toast.error('Event type is required');
            return;
        }

        // Combine date and time for API
        const start_date = combineDateTime(formData.start_date, formData.start_time);
        const end_date = combineDateTime(formData.end_date, formData.end_time);

        onSave({
            type: formData.type,
            venue_name: formData.venue_name,
            venue_location: formData.venue_location,
            start_date,
            end_date,
            notes: formData.notes,
            deliverables,
            assignments
        });
    };

    // Deliverable handlers
    const addDeliverable = () => {
        if (!newDeliverable.type.trim()) return;
        setDeliverables([...deliverables, { id: uuidv4(), ...newDeliverable }]);
        setNewDeliverable({ type: '', quantity: 1, status: 'Pending', due_date: '', notes: '' });
        setShowAddDeliverable(false);
    };

    const updateDeliverable = (id, data) => {
        setDeliverables(deliverables.map(d => d.id === id ? { ...d, ...data } : d));
    };

    const deleteDeliverable = (id) => {
        setDeliverables(deliverables.filter(d => d.id !== id));
    };

    // Team member handlers
    const addMember = () => {
        if (!newMember.name.trim()) return;
        setAssignments([...assignments, { id: uuidv4(), associate_name: newMember.name, ...newMember }]);
        setNewMember({ name: '', role: '' });
        setShowAddMember(false);
    };

    const updateMember = (id, data) => {
        setAssignments(assignments.map(a => a.id === id ? { ...a, ...data } : a));
    };

    const deleteMember = (id) => {
        setAssignments(assignments.filter(a => a.id !== id));
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Event' : 'Add New Event'}
            subtitle={isEditing ? formData.type : 'Create a new event for this project'}
            width="max-w-lg"
        >
            <div className="p-5 space-y-6">
                {/* Event Details Section */}
                <div>
                    <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium mb-3 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4" />
                        Event Details
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Event Type *</label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                placeholder="e.g., Wedding Ceremony, Reception"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Venue Name</label>
                                <input
                                    type="text"
                                    name="venue_name"
                                    value={formData.venue_name}
                                    onChange={handleChange}
                                    placeholder="Venue name"
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="venue_location"
                                    value={formData.venue_location}
                                    onChange={handleChange}
                                    placeholder="City, Address"
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        {/* Start Date/Time */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                            <div className="grid grid-cols-2 gap-4">
                                <DatePicker
                                    value={formData.start_date}
                                    onChange={(val) => setFormData(prev => ({ ...prev, start_date: val }))}
                                    placeholder="Start date"
                                    className="w-full"
                                />
                                <TimePicker
                                    value={formData.start_time}
                                    onChange={(val) => setFormData(prev => ({ ...prev, start_time: val }))}
                                    placeholder="Time (optional)"
                                    className="w-full"
                                    inputClassName="bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
                                />
                            </div>
                        </div>

                        {/* End Date/Time (Optional) */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">End Date <span className="text-zinc-600">(optional)</span></label>
                            <div className="grid grid-cols-2 gap-4">
                                <DatePicker
                                    value={formData.end_date}
                                    onChange={(val) => setFormData(prev => ({ ...prev, end_date: val }))}
                                    placeholder="End date"
                                    className="w-full"
                                />
                                <TimePicker
                                    value={formData.end_time}
                                    onChange={(val) => setFormData(prev => ({ ...prev, end_time: val }))}
                                    placeholder="Time (optional)"
                                    className="w-full"
                                    inputClassName="bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Any additional notes..."
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Deliverables Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium flex items-center gap-2">
                            <Icons.Package className="w-4 h-4" />
                            Deliverables ({deliverables.length})
                        </h3>
                        <button
                            onClick={() => setShowAddDeliverable(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                        >
                            + Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {showAddDeliverable && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg border border-purple-500/30 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={newDeliverable.type}
                                        onChange={(e) => setNewDeliverable({ ...newDeliverable, type: e.target.value })}
                                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                                    >
                                        <option value="">Select Type</option>
                                        {(config?.deliverableTypes || []).map(dt => (
                                            <option key={dt} value={dt}>{dt}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={newDeliverable.quantity}
                                        onChange={(e) => setNewDeliverable({ ...newDeliverable, quantity: parseInt(e.target.value) || 1 })}
                                        placeholder="Qty"
                                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={addDeliverable} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium">
                                        Add Deliverable
                                    </button>
                                    <button onClick={() => setShowAddDeliverable(false)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {deliverables.map(del => (
                            <DeliverableRow
                                key={del.id}
                                deliverable={del}
                                onUpdate={(data) => updateDeliverable(del.id, data)}
                                onDelete={() => deleteDeliverable(del.id)}
                            />
                        ))}

                        {deliverables.length === 0 && !showAddDeliverable && (
                            <p className="text-zinc-600 text-sm italic p-3 bg-zinc-800/30 rounded-lg text-center">
                                No deliverables yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Team Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium flex items-center gap-2">
                            <Icons.Users className="w-4 h-4" />
                            Team ({assignments.length})
                        </h3>
                        <button
                            onClick={() => setShowAddMember(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                        >
                            + Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {showAddMember && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg border border-purple-500/30 space-y-2">
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    placeholder="Name"
                                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                                />
                                <input
                                    type="text"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    placeholder="Role (e.g., Photographer)"
                                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                                />
                                <div className="flex gap-2">
                                    <button onClick={addMember} className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium">
                                        Add Member
                                    </button>
                                    <button onClick={() => setShowAddMember(false)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {assignments.map(member => (
                            <TeamMemberRow
                                key={member.id}
                                member={member}
                                onUpdate={(data) => updateMember(member.id, data)}
                                onDelete={() => deleteMember(member.id)}
                            />
                        ))}

                        {assignments.length === 0 && !showAddMember && (
                            <p className="text-zinc-600 text-sm italic p-3 bg-zinc-800/30 rounded-lg text-center">
                                No team members yet
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    {isEditing && onDelete && (
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                            <Icons.Trash className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
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
                                {isEditing ? 'Save Changes' : 'Create Event'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </SlideOver>
    );
};

export default EventSlideOver;
