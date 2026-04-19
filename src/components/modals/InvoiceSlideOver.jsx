import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SlideOver from './SlideOver';
import { createInvoice, updateInvoice, getInvoices } from '../../api/finance';
import { getClients } from '../../api/clients';
import { getProjects, getProject } from '../../api/projects'; // IMPORT getProject
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext'; // IMPORT config context
import { toast } from 'sonner';
import { Plus, Trash, RefreshCw } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';

const InvoiceSlideOver = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const [loading, setLoading] = useState(false);
    const [selectedVertical, setSelectedVertical] = useState('');

    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);

    const [formData, setFormData] = useState({
        invoice_no: '',
        client_id: '',
        project_id: '',
        line_items: [{ id: uuidv4(), title: '', quantity: 1, price: 0, total: 0 }],
        date: new Date().toISOString().split('T')[0]
    });

    const [docType, setDocType] = useState('invoice'); // 'invoice' or 'quote'

    // Generate Number based on Project and Type
    const fetchNextNumber = async (type, projectId, projectCode) => {
        if (!projectId) return;


        setFormData(prev => ({ ...prev, invoice_no: 'Generating...' }));

        try {
            const prefix = type === 'quote' ? 'QT' : 'INV';
            const pCode = projectCode || 'GEN';

            // Fetch existing invoices for this project to determine sequence

            const existingDocs = await getInvoices({ project_id: projectId });


            // Filter by type (Quote vs Invoice)
            // Note: This relies on the invoice_no convention or a separate type field if added.
            // Currently differentiating by prefix in invoice_no: 'QT' vs 'INV'
            const typeDocs = existingDocs.filter(d => {
                if (type === 'quote') return d.invoice_no.includes('-QT-');
                return d.invoice_no.includes('-INV-');
            });


            // Find max sequence
            let maxSeq = 0;
            typeDocs.forEach(d => {
                const parts = d.invoice_no.split('-');
                const seq = parseInt(parts[parts.length - 1]);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            });


            const nextSeq = String(maxSeq + 1).padStart(3, '0');
            const newNumber = `${pCode}-${prefix}-${nextSeq}`;


            setFormData(prev => ({ ...prev, invoice_no: newNumber }));
        } catch (error) {
            console.error("Failed to generate sequence number", error);
            setFormData(prev => ({ ...prev, invoice_no: 'ERROR-GEN' }));
        }
    };

    // ...

    useEffect(() => {
        if (isOpen) {
            const fetchClients = async () => {
                try {
                    const res = await getClients();
                    setClients(Array.isArray(res) ? res : res.data || []);
                } catch (err) {
                    console.error("Failed to fetch clients", err);
                }
            };
            if (clients.length === 0) fetchClients();

            const initializeForm = async () => {
                if (initialData) {
                    // Populate Form for Edit
                    const isQuote = initialData.invoice_no?.includes('QT') || initialData.invoice_no?.startsWith('QT');
                    setDocType(isQuote ? 'quote' : 'invoice');

                    // Set Form Data
                    setFormData({
                        invoice_no: initialData.invoice_no,
                        client_id: initialData.client_id || '',
                        project_id: initialData.project_id || '',
                        line_items: initialData.line_items?.map(item => ({
                            id: item.id || uuidv4(),
                            title: item.title,
                            quantity: item.quantity || 1,
                            price: item.price || 0,
                            total: item.total || 0
                        })) || [],
                        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });

                    // Resolve Vertical to load project list
                    if (initialData.project_id) {
                        try {
                            // We need to fetch the project to know its vertical
                            // This ensures the project dropdown loads the correct list
                            const project = await getProject(initialData.project_id);
                            if (project && project.vertical) {
                                setSelectedVertical(project.vertical);
                            }
                        } catch (error) {
                            console.error("Failed to load project for edit", error);
                        }
                    }

                } else {
                    // Creating New
                    setDocType('invoice');
                    setSelectedVertical('');
                    setProjects([]);
                    setFormData({
                        invoice_no: 'Select Project...',
                        client_id: '',
                        project_id: '',
                        line_items: [{ id: uuidv4(), title: '', quantity: 1, price: 0, total: 0 }],
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            };
            initializeForm();
        }
    }, [isOpen, initialData, clients.length]);

    // Load Projects
    useEffect(() => {
        const fetchProjects = async () => {
            if (!selectedVertical) {
                setProjects([]);
                return;
            }
            try {
                const projRes = await getProjects({
                    vertical: selectedVertical,
                    limit: 100
                }, true);
                const projData = Array.isArray(projRes) ? projRes : (projRes.data || []);
                setProjects(projData);
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };
        fetchProjects();
    }, [selectedVertical]);

    // Update number when type changes (Only for new records)
    useEffect(() => {
        if (isOpen && !initialData && formData.project_id) {
            const project = projects.find(p => p.id === formData.project_id || p._id === formData.project_id);
            if (project) {
                fetchNextNumber(docType, formData.project_id, project.code);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docType]);

    const handleLineItemChange = (index, field, value) => {
        const newItems = [...formData.line_items];
        newItems[index][field] = value;

        // Recalculate total for row
        // For quotes, quantity/total are hidden but logic remains valid (Qty default 1)
        const qty = docType === 'quote' ? 1 : (newItems[index].quantity || 0);
        const price = newItems[index].price || 0;

        newItems[index].quantity = qty; // Ensure 1 for quotes
        newItems[index].total = qty * price;

        setFormData({ ...formData, line_items: newItems });
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            line_items: [...formData.line_items, { id: uuidv4(), title: '', quantity: 1, price: 0, total: 0 }]
        });
    };

    const removeLineItem = (index) => {
        const newItems = formData.line_items.filter((_, i) => i !== index);
        setFormData({ ...formData, line_items: newItems });
    };

    const calculateTotal = () => {
        return formData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (docType === 'quote') {
                if (!formData.project_id) {
                    toast.error("Project is required for Quotes");
                    setLoading(false);
                    return;
                }
                if (!formData.client_id) {
                    toast.error("Selected Project does not have a valid Client");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                ...formData,
                total_amount: calculateTotal()
            };

            // Prevent submitting with placeholder or error invoice numbers
            if (!payload.invoice_no || payload.invoice_no === 'Select Project...' || payload.invoice_no === 'Generating...' || payload.invoice_no === 'ERROR-GEN') {
                toast.error('Please select a project to generate a valid number');
                setLoading(false);
                return;
            }



            if (initialData && initialData.id) {
                await updateInvoice(initialData.id, payload);
                toast.success("Updated successfully");
            } else {
                await createInvoice(payload);
                toast.success("Created successfully");
            }

            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error("Submit Error:", error);
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
            }
            const errorMessage = error.response?.data?.detail || "Failed to save";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerticalChange = (newVertical) => {
        setSelectedVertical(newVertical);
        setFormData(prev => ({
            ...prev,
            project_id: '',
            client_id: '',
            invoice_no: 'Select Project...'
        }));
    };

    const handleProjectChange = (projectId) => {
        const project = projects.find(p => p.id === projectId || p._id === projectId);


        if (!project?.client_id) {
            console.warn("Project has no client_id:", project);
        }

        setFormData(prev => ({
            ...prev,
            project_id: projectId,
            client_id: project?.client_id || '' // Force update, don't fallback to prev if project selected
        }));

        // Generate Sequence Number
        if (project) {
            fetchNextNumber(docType, projectId, project.code);
        }
    };

    // Prepare Options
    const projectOptions = projects.map(p => ({
        value: p.id || p._id,
        label: p.client_name ? `${p.code} - ${p.client_name}` : p.code
    }));

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={`${initialData ? 'Edit' : 'Create'} ${docType === 'quote' ? 'Quote' : 'Invoice'}`}
            subtitle={`${initialData ? 'Update' : 'Generate'} a ${docType} for a client`}
            width="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Type Selection */}
                <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => setDocType('invoice')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${docType === 'invoice'
                            ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Invoice
                    </button>
                    <button
                        type="button"
                        onClick={() => setDocType('quote')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${docType === 'quote'
                            ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Quote
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">
                            {docType === 'quote' ? 'Quote No' : 'Invoice No'} (Auto-generated)
                        </label>
                        <input
                            type="text"
                            required
                            readOnly
                            value={formData.invoice_no}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} bg-gray-100 dark:bg-gray-800 text-gray-500 focus:outline-none cursor-not-allowed`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Date</label>
                        <DatePicker
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
                            placeholder="Select date"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Vertical Selection */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Vertical</label>
                    <Select
                        value={selectedVertical}
                        onChange={handleVerticalChange}
                        placeholder="Select Vertical"
                        options={(config?.verticals || []).map(v => ({ value: v.id, label: v.label }))}
                        className="w-full"
                    />
                </div>

                {/* Project Selection (Auto-selects Client) */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">
                        Project {docType === 'quote' ? <span className="text-red-500">*</span> : '(Optional)'}
                    </label>
                    <SearchableSelect
                        options={projectOptions}
                        value={formData.project_id}
                        onChange={handleProjectChange}
                        disabled={!selectedVertical}
                        placeholder={!selectedVertical ? "Select Vertical first..." : (docType === 'quote' ? "Select Project (Required)" : "Select Project to auto-fill details...")}
                        className={docType === 'quote' && !formData.project_id ? "border-red-300" : ""}
                    />
                </div>

                {/* Client Selection (Only show for Invoices, hidden for Quotes) */}
                {docType !== 'quote' && (
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Client</label>
                        {formData.project_id ? (
                            <div className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} text-gray-500 bg-gray-50 dark:bg-gray-800`}>
                                {clients.find(c => c.id === formData.client_id || c._id === formData.client_id)?.name || 'Loading...'}
                            </div>
                        ) : (
                            <SearchableSelect
                                value={formData.client_id}
                                onChange={(val) => setFormData({ ...formData, client_id: val })}
                                placeholder="Select Client"
                                options={clients.map(c => ({ value: c.id || c._id, label: c.name }))}
                            />
                        )}
                    </div>
                )}

                {/* Quote Details (Simplified for Quotes) / Line Items (For Invoices) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-medium text-gray-500">
                            {docType === 'quote' ? 'Description & Amount' : 'Line Items'}
                        </label>
                        <button
                            type="button"
                            onClick={addLineItem}
                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center font-medium"
                        >
                            <Plus size={14} className="mr-1" /> Add {docType === 'quote' ? 'Row' : 'Item'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.line_items.map((item, index) => (
                            <div key={item.id} className={`p-3 rounded-lg border ${theme.canvas.border} bg-gray-50/50 dark:bg-zinc-800/30`}>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center">
                                    {/* Description */}
                                    <div className="flex-1 w-full">
                                        <label className={`text-[10px] text-gray-500 mb-0.5 ${index === 0 ? 'block' : 'block sm:hidden'}`}>Description</label>
                                        <input
                                            type="text"
                                            placeholder={docType === 'quote' ? "e.g. Wedding Photography Package" : "Item description"}
                                            value={item.title}
                                            onChange={(e) => handleLineItemChange(index, 'title', e.target.value)}
                                            className={`w-full px-2 py-1.5 text-sm rounded-md border ${theme.canvas.bg} ${theme.canvas.border}`}
                                            required
                                        />
                                    </div>

                                    {/* Math Group */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        {/* Quantity (Hidden for Quotes) */}
                                        {docType !== 'quote' && (
                                            <div className="w-16">
                                                <label className={`text-[10px] text-gray-500 mb-0.5 ${index === 0 ? 'block' : 'block sm:hidden'}`}>Qty</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                                                    className={`w-full px-2 py-1.5 text-sm rounded-md border ${theme.canvas.bg} ${theme.canvas.border}`}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Price / Amount */}
                                        <div className={docType === 'quote' ? "flex-1 sm:flex-none sm:w-32" : "flex-1 sm:flex-none sm:w-24"}>
                                            <label className={`text-[10px] text-gray-500 mb-0.5 ${index === 0 ? 'block' : 'block sm:hidden'}`}>{docType === 'quote' ? 'Amount' : 'Price'}</label>
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => handleLineItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                className={`w-full px-2 py-1.5 text-sm rounded-md border ${theme.canvas.bg} ${theme.canvas.border}`}
                                                required
                                            />
                                        </div>

                                        {/* Total (Hidden for Quotes) */}
                                        {docType !== 'quote' && (
                                            <div className="w-20 text-right">
                                                <label className={`text-[10px] text-gray-500 mb-0.5 text-right ${index === 0 ? 'block' : 'block sm:hidden'}`}>Total</label>
                                                <span className="text-sm font-semibold block py-1.5">₹ {item.total?.toLocaleString('en-IN') || 0}</span>
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <div className={index === 0 ? "pt-5 sm:pt-5 ml-auto sm:ml-0" : "pt-4 sm:pt-0 ml-auto sm:ml-0"}>
                                            <button
                                                type="button"
                                                onClick={() => removeLineItem(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                disabled={formData.line_items.length === 1}
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-dashed">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount</span>
                        <span>₹ {calculateTotal().toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-lg shadow-indigo-500/30 transition-all"
                    >
                        {loading ? 'Saving...' : `${initialData ? 'Update' : 'Create'} ${docType === 'quote' ? 'Quote' : 'Invoice'}`}
                    </button>
                </div>
            </form>
        </SlideOver>
    );
};

export default InvoiceSlideOver;
