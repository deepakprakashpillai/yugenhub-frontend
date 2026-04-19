import { useState, useEffect } from 'react';
import SlideOver from './SlideOver';
import Modal from './Modal';
import { Icons } from '../Icons';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { toast } from 'sonner';
import LocationPicker from '../location/LocationPicker';
import LocationCard from '../location/LocationCard';
import { FieldInput, getEmptyValue } from '../../config/fieldTypes';

// Inline Editable Deliverable Row
const DeliverableRow = ({ deliverable, onUpdate, onDelete }) => {
    const { config } = useAgencyConfig();
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(deliverable);

    useEffect(() => {
        setData(deliverable);
    }, [deliverable]);

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
                        {data.type && !(config?.deliverableTypes || []).includes(data.type) && (
                            <option key={data.type} value={data.type}>{data.type}</option>
                        )}
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
                    <input
                        type="text"
                        value={data.name || ''}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        placeholder="Display name (optional)"
                        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
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
                    <p className="text-white text-sm font-medium">{deliverable.name || deliverable.type}</p>
                    <p className="text-zinc-500 text-xs">{deliverable.name ? deliverable.type : null}{deliverable.name ? ' · ' : ''}Qty: {deliverable.quantity}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
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
const TeamMemberRow = ({ member, onUpdate, onDelete, assignmentTags }) => {
    const [editing, setEditing] = useState(false);
    const [data, setData] = useState(member);

    useEffect(() => {
        setData(member);
    }, [member]);

    const handleSave = () => {
        onUpdate(data);
        setEditing(false);
    };

    const toggleTag = (tag) => {
        const current = data.tags || [];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        setData({ ...data, tags: updated });
    };

    const name = member.associate_name || member.name || 'Unknown';
    const memberTags = member.tags || [];

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
                {assignmentTags.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                            {assignmentTags.map(tag => {
                                const selected = (data.tags || []).includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                                            selected
                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
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
        <div
            className="p-3 bg-zinc-800/30 rounded-lg group hover:bg-zinc-800/50 transition-colors cursor-pointer"
            onClick={() => setEditing(true)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-white text-sm font-medium">{name}</p>
                        <p className="text-zinc-500 text-xs">{member.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">{member.role}</span>
                    <button
                        onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                        <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            {memberTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 ml-11">
                    {memberTags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
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
    loading = false,
    verticalId
}) => {
    const isEditing = !!event?.id;
    const { config } = useAgencyConfig();

    const verticalConfig = config?.verticals?.find(v => v.id === verticalId);
    const assignmentTags = verticalConfig?.assignment_tags || [];
    const verticalTeamRequirements = verticalConfig?.team_requirements || [];
    const customEventFields = verticalConfig?.event_fields || [];

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

    // Structured map location for main venue
    const [venueMap, setVenueMap] = useState(null);
    // Named additional locations
    const [linkedLocations, setLinkedLocations] = useState([]);
    // Add/edit location modal
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState(null);
    const [locationDraft, setLocationDraft] = useState({ name: '', map: null });
    // Custom event field values
    const [eventFieldValues, setEventFieldValues] = useState({});

    const [deliverables, setDeliverables] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [teamRequirements, setTeamRequirements] = useState([]);
    const [showAddDeliverable, setShowAddDeliverable] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newDeliverable, setNewDeliverable] = useState({ type: '', name: '', quantity: 1, due_date: '', notes: '' });
    const [newMember, setNewMember] = useState({ name: '', role: '', tags: [] });

    // Helper to parse datetime string into date and time parts.
    // Uses local timezone consistently (both date and time extracted from local representation)
    // to avoid date-shifting on round-trips for users in positive UTC offset timezones.
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return { date: '', time: '' };
        const dt = new Date(dateTimeStr);
        if (isNaN(dt.getTime())) return { date: '', time: '' };

        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
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
            const start = parseDateTime(event.start_date);
            const end = parseDateTime(event.end_date);
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
            setVenueMap(event.venue_map || null);
            setLinkedLocations(event.linked_locations || []);
            setDeliverables(event.deliverables || []);
            setAssignments(event.assignments || []);
            setTeamRequirements(event.team_requirements || []);
            // Hydrate custom event field values
            const fields = verticalConfig?.event_fields || [];
            const initial = {};
            fields.forEach(f => {
                initial[f.name] = event[f.name] ?? getEmptyValue(f.type);
            });
            setEventFieldValues(initial);
        } else if (isOpen) {
            setFormData({ type: '', venue_name: '', venue_location: '', start_date: '', start_time: '', end_date: '', end_time: '', notes: '' });
            setVenueMap(null);
            setLinkedLocations([]);
            setDeliverables([]);
            setAssignments([]);
            setTeamRequirements([]);
            const fields = verticalConfig?.event_fields || [];
            const initial = {};
            fields.forEach(f => { initial[f.name] = getEmptyValue(f.type); });
            setEventFieldValues(initial);
        }
    }, [isOpen, event, verticalConfig]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.type.trim()) {
            toast.error('Event type is required');
            return;
        }

        if (!formData.start_date) {
            toast.error('Start date is required');
            return;
        }

        // Combine date and time for API
        const start_date = combineDateTime(formData.start_date, formData.start_time);
        const end_date = combineDateTime(formData.end_date, formData.end_time);

        if (formData.end_date) {
            if (formData.end_date < formData.start_date) {
                toast.error('End date cannot be before start date');
                return;
            }
            // Same day: only compare times if both are set
            if (formData.end_date === formData.start_date && formData.end_time && formData.start_time) {
                if (formData.end_time <= formData.start_time) {
                    toast.error('End time must be after start time');
                    return;
                }
            }
        }

        // Derive venue_name / venue_location from venue_map when text fields are empty
        let venueName = formData.venue_name;
        let venueLocation = formData.venue_location;
        if (venueMap?.formatted_address) {
            if (!venueName) venueName = venueMap.formatted_address.split(',')[0].trim();
            if (!venueLocation) venueLocation = venueMap.formatted_address;
        }

        onSave({
            type: formData.type,
            venue_name: venueName,
            venue_location: venueLocation,
            venue_map: venueMap || null,
            linked_locations: linkedLocations,
            start_date,
            end_date,
            notes: formData.notes,
            deliverables: deliverables.map(d => ({ ...d, due_date: d.due_date || null })),
            assignments,
            team_requirements: teamRequirements,
            ...eventFieldValues,
        });
    };

    // Deliverable handlers
    const addDeliverable = () => {
        if (!newDeliverable.type.trim()) return;
        setDeliverables([...deliverables, { id: uuidv4(), ...newDeliverable }]);
        setNewDeliverable({ type: '', name: '', quantity: 1, due_date: '', notes: '' });
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

        // Prevent duplicate names
        const isDuplicate = assignments.some(a =>
            (a.associate_name || '').toLowerCase() === newMember.name.trim().toLowerCase() ||
            (a.name || '').toLowerCase() === newMember.name.trim().toLowerCase()
        );
        if (isDuplicate) {
            toast.error('This team member is already added');
            return;
        }

        setAssignments([...assignments, { id: uuidv4(), associate_name: newMember.name, ...newMember }]);
        setNewMember({ name: '', role: '', tags: [] });
        setShowAddMember(false);
    };

    const updateMember = (id, data) => {
        setAssignments(assignments.map(a => a.id === id ? { ...a, ...data } : a));
    };

    const deleteMember = (id) => {
        setAssignments(assignments.filter(a => a.id !== id));
    };

    // Compute assigned count per role
    const assignedCountByRole = assignments.reduce((acc, a) => {
        if (a.role) acc[a.role] = (acc[a.role] || 0) + 1;
        return acc;
    }, {});

    // Team requirements handlers
    const addTeamRequirement = () => {
        const existingRoles = teamRequirements.map(r => r.role);
        const firstUnused = (config?.associateRoles || []).find(r => !existingRoles.includes(r));
        if (!firstUnused) return;
        setTeamRequirements([...teamRequirements, { role: firstUnused, count: 1 }]);
    };

    const updateTeamRequirement = (index, field, value) => {
        setTeamRequirements(teamRequirements.map((req, i) =>
            i === index ? { ...req, [field]: value } : req
        ));
    };

    const removeTeamRequirement = (index) => {
        setTeamRequirements(teamRequirements.filter((_, i) => i !== index));
    };

    const loadVerticalDefaults = () => {
        if (verticalTeamRequirements.length === 0) return;
        setTeamRequirements(verticalTeamRequirements.map(r => ({ role: r.role, count: r.count })));
    };

    const toggleNewMemberTag = (tag) => {
        const current = newMember.tags || [];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        setNewMember({ ...newMember, tags: updated });
    };

    // Linked location handlers
    const openAddLocation = () => {
        setEditingLocationId(null);
        setLocationDraft({ name: '', map: null });
        setShowLocationModal(true);
    };

    const openEditLocation = (loc) => {
        setEditingLocationId(loc.id);
        setLocationDraft({ name: loc.name, map: loc.map });
        setShowLocationModal(true);
    };

    const saveLocationDraft = () => {
        if (!locationDraft.map) { toast.error('Pick a location first'); return; }
        if (!locationDraft.name.trim()) { toast.error('Give this location a name'); return; }
        if (editingLocationId) {
            setLinkedLocations(prev => prev.map(l => l.id === editingLocationId ? { ...l, name: locationDraft.name, map: locationDraft.map } : l));
        } else {
            setLinkedLocations(prev => [...prev, { id: uuidv4(), name: locationDraft.name, map: locationDraft.map }]);
        }
        setShowLocationModal(false);
    };

    const deleteLinkedLocation = (id) => {
        setLinkedLocations(prev => prev.filter(l => l.id !== id));
    };

    return (
        <>
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
                        {/* Venue Name (optional text override) */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Venue Name <span className="text-zinc-600">(optional — auto-filled from map)</span></label>
                            <input
                                type="text"
                                name="venue_name"
                                value={formData.venue_name}
                                onChange={handleChange}
                                placeholder="e.g. Grand Palace"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        {/* Map Location Picker */}
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Venue Location (Map)</label>
                            <LocationPicker
                                value={venueMap}
                                onChange={(loc) => {
                                    setVenueMap(loc);
                                    // Sync legacy text fields when empty
                                    if (loc?.formatted_address) {
                                        if (!formData.venue_location) {
                                            setFormData(p => ({ ...p, venue_location: loc.formatted_address }));
                                        }
                                        if (!formData.venue_name) {
                                            setFormData(p => ({ ...p, venue_name: loc.formatted_address.split(',')[0].trim() }));
                                        }
                                    } else if (!loc) {
                                        // Cleared
                                    }
                                }}
                                placeholder="Search venue or paste Maps link"
                            />
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
                                <input
                                    type="text"
                                    value={newDeliverable.name}
                                    onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                                    placeholder="Display name (optional)"
                                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                                />
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

                {/* Team Requirements Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium flex items-center gap-2">
                            <Icons.CheckSquare className="w-4 h-4" />
                            Team Requirements
                        </h3>
                        <div className="flex items-center gap-2">
                            {verticalTeamRequirements.length > 0 && (
                                <button
                                    onClick={loadVerticalDefaults}
                                    className="text-xs text-zinc-500 hover:text-zinc-300 font-medium"
                                >
                                    Load defaults
                                </button>
                            )}
                            <button
                                onClick={addTeamRequirement}
                                disabled={(teamRequirements.length >= (config?.associateRoles || []).length)}
                                className="text-xs text-purple-400 hover:text-purple-300 font-medium disabled:opacity-30"
                            >
                                + Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {teamRequirements.length === 0 ? (
                            <p className="text-zinc-600 text-sm italic p-3 bg-zinc-800/30 rounded-lg text-center">
                                No requirements set{verticalTeamRequirements.length > 0 ? ' — load defaults or add manually' : ''}
                            </p>
                        ) : (
                            teamRequirements.map((req, i) => {
                                const assigned = assignedCountByRole[req.role] || 0;
                                const isFulfilled = assigned >= req.count;
                                return (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-zinc-800/30 rounded-lg group">
                                        <select
                                            value={req.role}
                                            onChange={e => updateTeamRequirement(i, 'role', e.target.value)}
                                            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer"
                                        >
                                            {(config?.associateRoles || []).map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className={isFulfilled ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                                                {assigned}
                                            </span>
                                            <span className="text-zinc-600">/</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={req.count}
                                                onChange={e => updateTeamRequirement(i, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                                                className="w-10 text-center bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-white text-xs focus:outline-none"
                                            />
                                            <span className={`text-base leading-none ${isFulfilled ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {isFulfilled ? '✓' : '!'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeTeamRequirement(i)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                                        >
                                            <Icons.X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })
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
                                {assignmentTags.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {assignmentTags.map(tag => {
                                                const selected = (newMember.tags || []).includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => toggleNewMemberTag(tag)}
                                                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                                                            selected
                                                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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
                                assignmentTags={assignmentTags}
                            />
                        ))}

                        {assignments.length === 0 && !showAddMember && (
                            <div className="p-3 bg-zinc-800/30 rounded-lg text-center">
                                <p className="text-zinc-600 text-sm italic">No team members yet</p>
                                {teamRequirements.length > 0 && (
                                    <p className="text-amber-500/70 text-xs mt-1">
                                        {teamRequirements.reduce((s, r) => s + r.count, 0)} people needed across {teamRequirements.length} role{teamRequirements.length > 1 ? 's' : ''} — none assigned
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Linked Locations Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium flex items-center gap-2">
                            <Icons.MapPin className="w-4 h-4" />
                            Linked Locations ({1 + linkedLocations.length})
                        </h3>
                        <button
                            type="button"
                            onClick={openAddLocation}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                        >
                            + Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {/* Primary venue — auto-derived, read-only in this list */}
                        {venueMap ? (
                            <LocationCard
                                location={venueMap}
                                name={formData.venue_name || 'Main Venue'}
                            />
                        ) : (
                            <div className="px-3 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-600 text-xs text-center">
                                Set a venue location above to see it here
                            </div>
                        )}
                        {/* Additional named locations */}
                        {linkedLocations.map(loc => (
                            <LocationCard
                                key={loc.id}
                                location={loc.map}
                                name={loc.name}
                                onEdit={() => openEditLocation(loc)}
                                onDelete={() => deleteLinkedLocation(loc.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Event Fields */}
                {customEventFields.length > 0 && (
                    <div>
                        <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium mb-3 flex items-center gap-2">
                            <Icons.Settings className="w-4 h-4" />
                            Additional Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {customEventFields.map(field => (
                                <div key={field.name} className={field.type === 'location' ? 'col-span-2' : ''}>
                                    <label className="block text-xs text-zinc-400 mb-1">{field.label}</label>
                                    <FieldInput
                                        field={field}
                                        value={eventFieldValues[field.name] ?? getEmptyValue(field.type)}
                                        onChange={(val) => setEventFieldValues(prev => ({ ...prev, [field.name]: val }))}
                                        inputClassName="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

        {/* Add / Edit Location Modal */}
        <Modal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            title={editingLocationId ? 'Edit Location' : 'Add Location'}
            size="md"
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-zinc-400 mb-1">Location Name *</label>
                    <input
                        type="text"
                        value={locationDraft.name}
                        onChange={(e) => setLocationDraft(d => ({ ...d, name: e.target.value }))}
                        placeholder="e.g. Getting Ready Suite, Reception Hall"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-zinc-400 mb-1">Location *</label>
                    <LocationPicker
                        value={locationDraft.map}
                        onChange={(loc) => setLocationDraft(d => ({ ...d, map: loc }))}
                        placeholder="Search place or paste Maps link"
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setShowLocationModal(false)}
                        className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={saveLocationDraft}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium"
                    >
                        {editingLocationId ? 'Save Changes' : 'Add Location'}
                    </button>
                </div>
            </div>
        </Modal>
        </>
    );
};

export default EventSlideOver;
