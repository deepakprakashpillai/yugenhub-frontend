import { useState, useEffect, useRef } from 'react';
import SlideOver from './SlideOver';
import { Icons } from '../Icons';
import api from '../../api/axios';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';
import { TemplateModal } from './TemplateModal';

const ProjectSlideOver = ({
    isOpen,
    onClose,
    onSave,
    onAddClient,
    vertical,
    loading = false
}) => {
    const { config } = useAgencyConfig();
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        status: 'enquiry',
        lead_source: 'Youtube',
        notes: ''
    });

    // Vertical-specific metadata
    const [metadata, setMetadata] = useState({});

    // Events State
    const [events, setEvents] = useState([]);
    const [showAddEvent, setShowAddEvent] = useState(false);

    // Client search state
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const clientDropdownRef = useRef(null);

    // Associates for Team Selection
    const [associates, setAssociates] = useState([]);

    // Template Import State
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // Collapsible Sections State
    const [isWeddingDetailsOpen, setIsWeddingDetailsOpen] = useState(false);

    // Fetch clients and associates
    useEffect(() => {
        const fetchResources = async () => {
            setLoadingClients(true);
            try {
                const [clientsRes, associatesRes] = await Promise.all([
                    api.get('/clients', { params: { limit: 100 } }),
                    api.get('/associates', { params: { limit: 100 } })
                ]);

                setClients(clientsRes.data.data || clientsRes.data || []);
                setAssociates(associatesRes.data.data || associatesRes.data || []);
            } catch (err) {
                console.error('Failed to fetch resources:', err);
            } finally {
                setLoadingClients(false);
            }
        };

        if (isOpen) {
            fetchResources();
        }
    }, [isOpen]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                client_id: '',
                client_name: '',
                status: 'enquiry',
                lead_source: 'Youtube',
                notes: ''
            });
            setMetadata({});
            setEvents([]);
            setClientSearch('');
            setShowTemplateModal(false);
        }
    }, [isOpen]);

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

    // Filter clients based on search
    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const handleSelectClient = (client) => {
        setFormData(prev => ({
            ...prev,
            client_id: client._id,
            client_name: client.name
        }));
        setClientSearch(client.name);
        setShowClientDropdown(false);
    };

    const handleAddNewClient = () => {
        setShowClientDropdown(false);
        onAddClient && onAddClient((newClient) => {
            // Callback when new client is created
            setClients(prev => [...prev, newClient]);
            handleSelectClient(newClient);
        });
    };

    const handleImportTemplate = (template) => {
        if (events.length > 0) {
            if (!confirm("Importing a template will replace existing events. Continue?")) return;
        }

        // Map template events to new instances with new IDs
        const newEvents = (template.events || []).map(evt => ({
            ...evt,
            id: uuidv4(),
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            venue_name: '',
            venue_location: '',
            notes: evt.notes || '',
            assignments: [], // Clear assignments as they are project specific usually
            deliverables: (evt.deliverables || []).map(d => ({
                ...d,
                id: uuidv4(),
                status: 'Pending',
                due_date: ''
            }))
        }));

        setEvents(newEvents);
        toast.success(`Imported template: ${template.name}`);
    };

    // --- Event Handlers ---
    const handleAddEvent = () => {
        setEvents(prev => [...prev, {
            id: uuidv4(),
            type: '',
            venue_name: '',
            venue_location: '',
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            notes: '',
            deliverables: [],
            assignments: []
        }]);
    };

    const handleEventChange = (index, field, value) => {
        setEvents(prev => {
            const newEvents = [...prev];
            newEvents[index] = { ...newEvents[index], [field]: value };
            return newEvents;
        });
    };

    const handleRemoveEvent = (index) => {
        setEvents(prev => prev.filter((_, i) => i !== index));
    };

    // --- Deliverable Handlers ---
    const handleAddDeliverable = (eventIndex) => {
        setEvents(prev => {
            const newEvents = [...prev];
            newEvents[eventIndex].deliverables.push({
                id: uuidv4(),
                type: '', // User selects from config
                quantity: 1,
                status: 'Pending',
                due_date: '',
                notes: ''
            });
            return newEvents;
        });
    };

    const handleDeliverableChange = (eventIndex, deliverableIndex, field, value) => {
        setEvents(prev => {
            const newEvents = [...prev];
            const newDeliverables = [...newEvents[eventIndex].deliverables];
            newDeliverables[deliverableIndex] = { ...newDeliverables[deliverableIndex], [field]: value };
            newEvents[eventIndex].deliverables = newDeliverables;
            return newEvents;
        });
    };

    const handleRemoveDeliverable = (eventIndex, deliverableIndex) => {
        setEvents(prev => {
            const newEvents = [...prev];
            const newDeliverables = newEvents[eventIndex].deliverables.filter((_, i) => i !== deliverableIndex);
            newEvents[eventIndex].deliverables = newDeliverables;
            return newEvents;
        });
    };

    // --- Assignment Handlers ---
    const handleAddAssignment = (eventIndex) => {
        setEvents(prev => {
            const newEvents = [...prev];
            newEvents[eventIndex].assignments.push({
                id: uuidv4(),
                associate_id: '',
                role: '',
                name: '' // For display
            });
            return newEvents;
        });
    };

    const handleAssignmentChange = (eventIndex, assignmentIndex, field, value) => {
        setEvents(prev => {
            const newEvents = [...prev];
            const newAssignments = [...newEvents[eventIndex].assignments];
            newAssignments[assignmentIndex] = { ...newAssignments[assignmentIndex], [field]: value };

            // If changing associate_id, update name too
            if (field === 'associate_id') {
                const assoc = associates.find(a => a._id === value);
                if (assoc) {
                    newAssignments[assignmentIndex].name = assoc.name;
                    // Auto-fill role if empty and associate has a role
                    if (!newAssignments[assignmentIndex].role && assoc.role) {
                        newAssignments[assignmentIndex].role = assoc.role;
                    }
                }
            }

            newEvents[eventIndex].assignments = newAssignments;
            return newEvents;
        });
    };

    const handleRemoveAssignment = (eventIndex, assignmentIndex) => {
        setEvents(prev => {
            const newEvents = [...prev];
            const newAssignments = newEvents[eventIndex].assignments.filter((_, i) => i !== assignmentIndex);
            newEvents[eventIndex].assignments = newAssignments;
            return newEvents;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMetadataChange = (e) => {
        let { name, value, type } = e.target;

        // Convert number inputs to actual numbers
        if (type === 'number') {
            value = value === '' ? null : Number(value);
        }

        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.client_id) {
            toast.warning('Please select a client');
            return;
        }

        const projectData = {
            ...formData,
            vertical,
            metadata,
            events // Pass events up
        };

        console.log('Submitting Project Data:', projectData);

        onSave(projectData);
    };

    // System Fields Configuration
    const SYSTEM_FIELDS = {
        wedding: [
            'client_side', 'religion', 'groom_name', 'groom_number', 'bride_name',
            'bride_number', 'groom_age', 'bride_age', 'wedding_style',
            'groom_location', 'bride_location'
        ],
        children: [
            'child_name', 'child_age', 'occasion_type', 'mother_name',
            'father_name', 'address'
        ]
    };

    // Helper to render dynamic custom fields
    const renderCustomFields = (fields, type) => {
        if (!fields || fields.length === 0) return null;

        // Filter out system fields to avoid duplicates
        const systemFields = SYSTEM_FIELDS[type] || [];
        const filteredFields = fields.filter(f => !systemFields.includes(f.name));

        if (filteredFields.length === 0) return null;

        return (
            <div className="space-y-3 mt-4">
                {filteredFields.map(field => (
                    <div key={field.name}>
                        <label className={`block text-xs ${theme.text.secondary} mb-1`}>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                name={field.name}
                                value={metadata[field.name] || ''}
                                onChange={handleMetadataChange}
                                className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            >
                                <option value="">Select {field.label}</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type === 'number' ? 'number' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                                name={field.name}
                                value={metadata[field.name] || ''}
                                onChange={handleMetadataChange}
                                placeholder={field.label}
                                className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Vertical-specific fields
    const renderVerticalFields = () => {
        const vId = vertical?.toLowerCase();
        // Find config for this vertical
        const configVertical = config?.verticals?.find(v => v.id === vId);

        // Determine type with fallback for migration
        let verticalType = configVertical?.type;
        if (!verticalType) {
            if (vId === 'knots') verticalType = 'wedding';
            else if (vId === 'pluto') verticalType = 'children';
            else verticalType = 'general';
        }

        const customFields = configVertical?.fields || [];

        if (verticalType === 'wedding') {
            return (
                <>
                    <button
                        type="button"
                        onClick={() => setIsWeddingDetailsOpen(!isWeddingDetailsOpen)}
                        className={`w-full flex items-center justify-between text-sm uppercase tracking-widest ${theme.text.secondary} font-medium mt-6 mb-3 hover:${theme.text.primary} transition-colors`}
                    >
                        <span className="flex items-center gap-2">
                            <Icons.Heart className="w-4 h-4" />
                            Wedding Details
                        </span>
                        {isWeddingDetailsOpen ? <Icons.ChevronUp className="w-4 h-4" /> : <Icons.ChevronDown className="w-4 h-4" />}
                    </button>

                    {isWeddingDetailsOpen && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="mb-3">
                                <label className={`block text-xs ${theme.text.secondary} mb-1`}>Side</label>
                                <select
                                    name="side"
                                    value={metadata.side || 'both'}
                                    onChange={handleMetadataChange}
                                    className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                >
                                    <option value="groom">Groom</option>
                                    <option value="bride">Bride</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className={`block text-xs ${theme.text.secondary} mb-1`}>Religion</label>
                                <select
                                    name="religion"
                                    value={metadata.religion || 'Hindu'}
                                    onChange={handleMetadataChange}
                                    className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                >
                                    <option value="Hindu">Hindu</option>
                                    <option value="Christian">Christian</option>
                                    <option value="Muslim">Muslim</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Groom Name</label>
                                    <input
                                        type="text"
                                        name="groom_name"
                                        value={metadata.groom_name || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Groom's name"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Groom Number</label>
                                    <input
                                        type="tel"
                                        name="groom_number"
                                        value={metadata.groom_number || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Phone number"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Bride Name</label>
                                    <input
                                        type="text"
                                        name="bride_name"
                                        value={metadata.bride_name || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Bride's name"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Bride Number</label>
                                    <input
                                        type="tel"
                                        name="bride_number"
                                        value={metadata.bride_number || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Phone number"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                            </div >


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Groom Age</label>
                                    <input
                                        type="number"
                                        name="groom_age"
                                        value={metadata.groom_age || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Age"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Bride Age</label>
                                    <input
                                        type="number"
                                        name="bride_age"
                                        value={metadata.bride_age || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="Age"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                            </div >

                            <div className="mb-3">
                                <label className={`block text-xs ${theme.text.secondary} mb-1`}>Wedding Style</label>
                                <input
                                    type="text"
                                    name="wedding_style"
                                    value={metadata.wedding_style || ''}
                                    onChange={handleMetadataChange}
                                    placeholder="e.g. Traditional, Modern, Destination"
                                    className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Groom Location</label>
                                    <input
                                        type="text"
                                        name="groom_location"
                                        value={metadata.groom_location || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="City/Address"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs ${theme.text.secondary} mb-1`}>Bride Location</label>
                                    <input
                                        type="text"
                                        name="bride_location"
                                        value={metadata.bride_location || ''}
                                        onChange={handleMetadataChange}
                                        placeholder="City/Address"
                                        className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                                    />
                                </div>
                            </div>
                        </div >
                    )}

                    {/* Render Custom Fields defined in Config */}
                    {renderCustomFields(customFields, verticalType)}
                </>
            );
        }

        if (verticalType === 'children') {
            return (
                <>
                    <h4 className={`text-sm uppercase tracking-widest ${theme.text.secondary} font-medium mt-6 mb-3 flex items-center gap-2`}>
                        <Icons.Star className="w-4 h-4" />
                        Event Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className={`block text-xs ${theme.text.secondary} mb-1`}>Child's Name</label>
                            <input
                                type="text"
                                name="child_name"
                                value={metadata.child_name || ''}
                                onChange={handleMetadataChange}
                                placeholder="Child's name"
                                className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs ${theme.text.secondary} mb-1`}>Age</label>
                            <input
                                type="number"
                                name="child_age"
                                value={metadata.child_age || ''}
                                onChange={handleMetadataChange}
                                placeholder="Age"
                                className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className={`block text-xs ${theme.text.secondary} mb-1`}>Occasion</label>
                        <select
                            name="occasion_type"
                            value={metadata.occasion_type || 'birthday'}
                            onChange={handleMetadataChange}
                            className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                        >
                            <option value="birthday">Birthday</option>
                            <option value="baptism">Baptism</option>
                            <option value="newborn">Newborn</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className={`block text-xs ${theme.text.secondary} mb-1`}>Mother's Name</label>
                            <input
                                type="text"
                                name="mother_name"
                                value={metadata.mother_name || ''}
                                onChange={handleMetadataChange}
                                placeholder="Mother's name"
                                className={`w-full px-3 py-2 ${theme.canvas.input || 'bg-zinc-800'} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs ${theme.text.secondary} mb-1`}>Father's Name</label>
                            <input
                                type="text"
                                name="father_name"
                                value={metadata.father_name || ''}
                                onChange={handleMetadataChange}
                                placeholder="Father's name"
                                className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs ${theme.text.secondary} mb-1`}>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={metadata.address || ''}
                            onChange={handleMetadataChange}
                            placeholder="Residential Address"
                            className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                        />
                    </div>

                    {/* Render Custom Fields defined in Config */}
                    {renderCustomFields(customFields, verticalType)}
                </>
            );
        }

        // General / Other
        return (
            <>
                <h4 className={`text-sm uppercase tracking-widest ${theme.text.secondary} font-medium mt-6 mb-3 flex items-center gap-2`}>
                    <Icons.Briefcase className="w-4 h-4" />
                    Project Details
                </h4>

                {/* Render Custom Fields defined in Config */}
                {renderCustomFields(customFields, verticalType)}

                {(!customFields || customFields.length === 0) && (
                    <div>
                        <label className={`block text-xs ${theme.text.secondary} mb-1`}>Project Type</label>
                        <input
                            type="text"
                            name="project_type"
                            value={metadata.project_type || ''}
                            onChange={handleMetadataChange}
                            placeholder="e.g., Corporate Video, Product Shoot"
                            className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} text-sm focus:outline-none focus:border-purple-500`}
                        />
                    </div>
                )}
            </>
        );
    };

    const renderEventsSection = () => (
        <div className={`mt-8 pt-6 border-t ${theme.canvas.border}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className={`text-sm uppercase tracking-widest ${theme.text.secondary} font-semibold flex items-center gap-2`}>
                        <Icons.Calendar className="w-4 h-4 text-purple-400" />
                        Events & Deliverables
                    </h4>
                    <p className={`text-xs ${theme.text.secondary} mt-1 ml-6`}>Manage project events and their deliverables</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 ${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary} rounded-lg text-xs font-medium transition-all hover:${theme.canvas.hover}`}
                    >
                        <Icons.Download className="w-3.5 h-3.5" />
                        Import Template
                    </button>
                    <button
                        onClick={handleAddEvent}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-lg text-xs font-medium transition-all border border-purple-500/20 hover:border-purple-500/30"
                    >
                        <Icons.Plus className="w-3.5 h-3.5" />
                        Add Event
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {events.length === 0 && (
                    <div className={`text-center py-8 border-2 border-dashed ${theme.canvas.border} rounded-xl ${theme.canvas.bg}`}>
                        <Icons.Calendar className={`w-8 h-8 ${theme.text.secondary} mx-auto mb-3`} />
                        <p className={`text-sm ${theme.text.secondary}`}>No events added yet</p>
                        <button
                            onClick={handleAddEvent}
                            className="text-xs text-purple-400 hover:text-purple-300 mt-2 font-medium"
                        >
                            + Add your first event
                        </button>
                    </div>
                )}

                {events.map((event, index) => (
                    <div key={event.id} className={`${theme.canvas.card} border ${theme.canvas.border} rounded-xl overflow-hidden shadow-sm hover:border-zinc-500 transition-colors group`}>
                        {/* Event Header */}
                        <div className={`p-4 ${theme.canvas.bg} border-b ${theme.canvas.border} flex flex-col gap-4`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <label className={`text-[10px] uppercase ${theme.text.secondary} font-semibold mb-1.5 block tracking-wider`}>Event Type</label>
                                    <input
                                        type="text"
                                        value={event.type}
                                        onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                                        placeholder="e.g. Wedding Reception"
                                        className={`w-full bg-transparent border-0 border-b ${theme.canvas.border} focus:border-purple-500 text-base font-medium ${theme.text.primary} p-0 pb-1 focus:ring-0 placeholder-zinc-500 transition-colors`}
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveEvent(index)}
                                    className={`p-1.5 ${theme.text.secondary} hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
                                    title="Remove Event"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Date & Time */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-2 ${theme.text.secondary} text-xs font-medium`}>
                                        <Icons.Clock className="w-3.5 h-3.5" />
                                        Timing
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={`text-[10px] ${theme.text.secondary} mb-1 block`}>Start</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="date"
                                                    value={event.start_date}
                                                    onChange={(e) => handleEventChange(index, 'start_date', e.target.value)}
                                                    className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                                />
                                                <input
                                                    type="time"
                                                    value={event.start_time}
                                                    onChange={(e) => handleEventChange(index, 'start_time', e.target.value)}
                                                    className={`w-20 ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`text-[10px] ${theme.text.secondary} mb-1 block`}>End</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="date"
                                                    value={event.end_date}
                                                    onChange={(e) => handleEventChange(index, 'end_date', e.target.value)}
                                                    className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                                />
                                                <input
                                                    type="time"
                                                    value={event.end_time}
                                                    onChange={(e) => handleEventChange(index, 'end_time', e.target.value)}
                                                    className={`w-20 ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Venue */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-2 ${theme.text.secondary} text-xs font-medium`}>
                                        <Icons.MapPin className="w-3.5 h-3.5" />
                                        Venue
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={`text-[10px] ${theme.text.secondary} mb-1 block`}>Name</label>
                                            <input
                                                type="text"
                                                value={event.venue_name}
                                                onChange={(e) => handleEventChange(index, 'venue_name', e.target.value)}
                                                placeholder="Venue Name"
                                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs ${theme.text.primary} placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`text-[10px] ${theme.text.secondary} mb-1 block`}>Location</label>
                                            <input
                                                type="text"
                                                value={event.venue_location}
                                                onChange={(e) => handleEventChange(index, 'venue_location', e.target.value)}
                                                placeholder="Address/City"
                                                className={`w-full ${theme.canvas.bg} border ${theme.canvas.border} rounded px-2 py-1.5 text-xs ${theme.text.primary} placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`flex flex-col gap-px ${theme.canvas.bg} bg-opacity-50`}>
                            {/* Deliverables Section */}
                            <div className={`p-5 ${theme.canvas.bg} bg-opacity-30`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`flex items-center gap-2 text-sm font-medium ${theme.text.secondary}`}>
                                        <Icons.Package className="w-4 h-4" />
                                        Deliverables
                                        <span className={`px-2 py-0.5 rounded-full ${theme.canvas.card} text-xs ${theme.text.secondary} font-medium border ${theme.canvas.border}`}>{event.deliverables.length}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddDeliverable(index)}
                                        className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium px-2.5 py-1.5 hover:bg-purple-500/10 rounded-lg transition-colors"
                                    >
                                        <Icons.Plus className="w-3.5 h-3.5" />
                                        Add Item
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {event.deliverables.map((del, dIndex) => (
                                        <div key={del.id} className={`flex items-center gap-3 ${theme.canvas.card} p-2.5 rounded-lg border ${theme.canvas.border} group/item hover:border-zinc-500 transition-colors`}>
                                            <select
                                                value={del.type}
                                                onChange={(e) => handleDeliverableChange(index, dIndex, 'type', e.target.value)}
                                                className={`flex-1 bg-transparent border-0 text-sm ${theme.text.primary} focus:ring-0 p-0 cursor-pointer`}
                                            >
                                                <option value="" disabled>Select Type</option>
                                                {(config?.deliverableTypes || []).map(dt => (
                                                    <option key={dt} value={dt}>{dt}</option>
                                                ))}
                                            </select>
                                            <div className={`w-px h-6 ${theme.canvas.border}`}></div>
                                            <input
                                                type="number"
                                                value={del.quantity}
                                                onChange={(e) => handleDeliverableChange(index, dIndex, 'quantity', parseInt(e.target.value) || 1)}
                                                className={`w-12 bg-transparent border-0 text-sm ${theme.text.secondary} focus:${theme.text.primary} focus:ring-0 p-0 text-center font-medium`}
                                                min="1"
                                            />
                                            <button
                                                onClick={() => handleRemoveDeliverable(index, dIndex)}
                                                className={`${theme.text.secondary} hover:text-red-400 p-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-md hover:${theme.canvas.hover}`}
                                            >
                                                <Icons.X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {event.deliverables.length === 0 && (
                                        <div className={`text-center py-6 border border-dashed ${theme.canvas.border} rounded-lg ${theme.canvas.bg}`}>
                                            <p className={`text-xs ${theme.text.secondary} italic`}>No deliverables added yet</p>
                                            <button
                                                onClick={() => handleAddDeliverable(index)}
                                                className="text-xs text-purple-400 hover:text-purple-300 mt-1.5"
                                            >
                                                + Add one
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Section */}
                            <div className={`p-5 ${theme.canvas.bg} bg-opacity-30 border-t ${theme.canvas.border}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`flex items-center gap-2 text-sm font-medium ${theme.text.secondary}`}>
                                        <Icons.Users className="w-4 h-4" />
                                        Team Assignments
                                        <span className={`px-2 py-0.5 rounded-full ${theme.canvas.card} text-xs ${theme.text.secondary} font-medium border ${theme.canvas.border}`}>{event.assignments.length}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddAssignment(index)}
                                        className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium px-2.5 py-1.5 hover:bg-purple-500/10 rounded-lg transition-colors"
                                    >
                                        <Icons.Plus className="w-3.5 h-3.5" />
                                        Add Member
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {event.assignments.map((assign, aIndex) => (
                                        <div key={assign.id} className={`grid grid-cols-[1fr,1fr,auto] gap-3 items-center ${theme.canvas.card} p-2.5 rounded-lg border ${theme.canvas.border} group/item hover:border-zinc-500 transition-colors`}>
                                            <div className="min-w-0">
                                                <select
                                                    value={assign.associate_id}
                                                    onChange={(e) => handleAssignmentChange(index, aIndex, 'associate_id', e.target.value)}
                                                    className={`w-full bg-transparent border-0 text-sm ${theme.text.primary} focus:ring-0 p-0 cursor-pointer`}
                                                >
                                                    <option value="" disabled>Select Member</option>
                                                    {associates.map(assoc => (
                                                        <option key={assoc._id} value={assoc._id}>{assoc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={`min-w-0 border-l ${theme.canvas.border} pl-3`}>
                                                <input
                                                    type="text"
                                                    value={assign.role}
                                                    onChange={(e) => handleAssignmentChange(index, aIndex, 'role', e.target.value)}
                                                    placeholder="Role (e.g. Lead)"
                                                    className={`w-full bg-transparent border-0 text-sm ${theme.text.secondary} focus:${theme.text.primary} focus:ring-0 p-0 placeholder-zinc-500`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemoveAssignment(index, aIndex)}
                                                className={`${theme.text.secondary} hover:text-red-400 p-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-md hover:${theme.canvas.hover}`}
                                            >
                                                <Icons.X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {event.assignments.length === 0 && (
                                        <div className={`text-center py-6 border border-dashed ${theme.canvas.border} rounded-lg ${theme.canvas.bg}`}>
                                            <p className={`text-xs ${theme.text.secondary} italic`}>No team members assigned</p>
                                            <button
                                                onClick={() => handleAddAssignment(index)}
                                                className="text-xs text-purple-400 hover:text-purple-300 mt-1.5"
                                            >
                                                + Assign someone
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Project"
            subtitle={`Create a new ${vertical} project`}
            width="max-w-4xl"
        >
            <div className="p-5 space-y-4">
                {/* Client Selection */}
                <div ref={clientDropdownRef} className="relative">
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Client *</label>
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
                            placeholder="Search or add client..."
                            className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 pr-10`}
                        />
                        <Icons.Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.text.secondary}`} />
                    </div>

                    {showClientDropdown && (
                        <div className={`absolute z-50 w-full mt-1 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg shadow-xl max-h-64 overflow-y-auto`}>
                            {/* Add New Client Option */}
                            <button
                                onClick={handleAddNewClient}
                                className={`w-full px-3 py-2.5 flex items-center gap-2 text-purple-400 hover:bg-purple-500/10 border-b ${theme.canvas.border} text-sm font-medium`}
                            >
                                <Icons.Plus className="w-4 h-4" />
                                Add New Client
                            </button>

                            {loadingClients ? (
                                <div className={`px-3 py-4 text-center ${theme.text.secondary} text-sm`}>
                                    <Icons.Loader className="w-4 h-4 animate-spin mx-auto mb-1" />
                                    Loading clients...
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className={`px-3 py-4 text-center ${theme.text.secondary} text-sm`}>
                                    No clients found
                                </div>
                            ) : (
                                filteredClients.slice(0, 10).map(client => (
                                    <button
                                        key={client._id}
                                        onClick={() => handleSelectClient(client)}
                                        className={`w-full px-3 py-2 flex items-center gap-3 ${theme.canvas.hover} text-left`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                            {client.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={`${theme.text.primary} text-sm`}>{client.name}</p>
                                            {client.phone && (
                                                <p className={`${theme.text.secondary} text-xs`}>{client.phone}</p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                    >
                        {(config?.statusOptions || []).map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lead Source */}
                <div>
                    <label className={`block text-sm ${theme.text.secondary} mb-1`}>Lead Source</label>
                    <select
                        name="lead_source"
                        value={formData.lead_source}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500`}
                    >
                        {(config?.leadSources || []).map(source => (
                            <option key={source} value={source}>
                                {source}
                            </option>
                        ))}
                    </select>
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
                        className={`w-full px-3 py-2 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-lg ${theme.text.primary} focus:outline-none focus:border-purple-500 resize-none`}
                    />
                </div>

                {/* Vertical-specific fields */}
                {renderVerticalFields()}

                {/* Events Section */}
                {renderEventsSection()}

                {/* Actions */}
                <div className={`flex gap-3 pt-4 border-t ${theme.canvas.border} mt-6`}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-lg ${theme.canvas.card} ${theme.text.secondary} hover:${theme.canvas.hover} transition-colors disabled:opacity-50 border ${theme.canvas.border}`}
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
                                Creating...
                            </>
                        ) : (
                            <>
                                <Icons.Plus className="w-4 h-4" />
                                Create Project
                            </>
                        )}
                    </button>
                </div>
            </div>
            {/* Template Selection Modal */}
            <TemplateModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                onSelect={handleImportTemplate}
                mode="select"
                initialVertical={vertical}
            />
        </SlideOver>
    );
};

export default ProjectSlideOver;
