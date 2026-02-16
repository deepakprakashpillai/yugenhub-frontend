import React, { useState, useEffect } from 'react';
import SlideOver from './SlideOver';
import { createTransaction, getAccounts } from '../../api/finance';
import { getClients } from '../../api/clients';
import { getProjects } from '../../api/projects';
import { getAssociates } from '../../api/associates';
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { toast } from 'sonner';
import SearchableSelect from '../ui/SearchableSelect';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES, VERTICALS } from '../../constants';

const TransactionSlideOver = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const [loading, setLoading] = useState(false);

    // Data for dropdowns
    const [accounts, setAccounts] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [associates, setAssociates] = useState([]);

    const [formData, setFormData] = useState({
        type: TRANSACTION_TYPES.EXPENSE,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        category: '',
        subcategory: '',
        client_id: '',
        project_id: '',
        associate_id: '',
        notes: ''
    });

    const [filteredCategories, setFilteredCategories] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);

    // Vertical Filter State: Default to 'general'
    const [selectedVertical, setSelectedVertical] = useState('general');
    const [filteredProjects, setFilteredProjects] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Load resources
            const fetchResources = async () => {
                try {
                    const [accRes, cliRes, projRes, assocRes] = await Promise.all([
                        getAccounts(),
                        getClients(),
                        getProjects({ limit: 100 }),
                        getAssociates({ limit: 100 })
                    ]);
                    setAccounts(accRes);
                    setClients(cliRes.data || cliRes);

                    // Projects might return array directly or wrapped in data
                    const projData = Array.isArray(projRes) ? projRes : (projRes.data || []);
                    setProjects(projData);

                    // Associates might return array directly or wrapped in data
                    const assocData = Array.isArray(assocRes) ? assocRes : (assocRes.data || []);
                    setAssociates(assocData);

                } catch (err) {
                    console.error("Failed to load resources", err);
                }
            };
            fetchResources();

            // Reset form
            setFormData({
                type: initialData?.type || TRANSACTION_TYPES.EXPENSE,
                amount: initialData?.amount || '',
                date: initialData?.date || new Date().toISOString().split('T')[0],
                account_id: initialData?.account_id || '',
                category: initialData?.category || '',
                subcategory: initialData?.subcategory || '',
                client_id: initialData?.client_id || '',
                project_id: initialData?.project_id || '',
                associate_id: initialData?.associate_id || '',
                notes: initialData?.notes || ''
            });
            setSelectedVertical(initialData?.vertical || VERTICALS.GENERAL);
        }
    }, [isOpen, initialData]);

    // Update available categories when type changes
    useEffect(() => {
        let relevantCats = [];

        if (config?.finance_categories) {
            relevantCats = config.finance_categories.filter(c => c.type === formData.type);
        }

        // Special Case: Associate Payout for Expense
        // Always add this option for expenses, regardless of config
        if (formData.type === TRANSACTION_TYPES.EXPENSE) {
            if (!relevantCats.find(c => c.name === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT)) {
                relevantCats = [{ id: 'payout', name: FINANCE_CATEGORIES.ASSOCIATE_PAYOUT, subcategories: [] }, ...relevantCats];
            }
        }

        setFilteredCategories(relevantCats);

        // Clear selections if type changes (and current cat is invalid)
        // Only clear if we actually have categories to check against, otherwise we might clear prematurely
        if (relevantCats.length > 0 && formData.category && !relevantCats.find(c => c.name === formData.category)) {
            setFormData(prev => ({ ...prev, category: '', subcategory: '', associate_id: '' }));
        }
    }, [formData.type, config]);

    // Update subcategories when category changes
    useEffect(() => {
        const selectedCat = filteredCategories.find(c => c.name === formData.category);
        if (selectedCat) {
            setAvailableSubcategories(selectedCat.subcategories || []);
        } else {
            setAvailableSubcategories([]);
        }
    }, [formData.category, filteredCategories]);

    // Filter projects based on vertical
    useEffect(() => {
        if (selectedVertical && selectedVertical !== VERTICALS.GENERAL) {
            setFilteredProjects(projects.filter(p => p.vertical === selectedVertical));
        } else {
            setFilteredProjects([]);
        }
    }, [selectedVertical, projects]);

    // Auto-select vertical if project is selected (reverse lookup)
    useEffect(() => {
        if (formData.project_id && projects.length > 0) {
            const project = projects.find(p => p._id === formData.project_id || p.id === formData.project_id);
            if (project) {
                if (project.vertical && project.vertical !== selectedVertical) {
                    setSelectedVertical(project.vertical);
                }
                if (project.client_id) {
                    setFormData(prev => ({ ...prev, client_id: project.client_id }));
                }
            }
        }
    }, [formData.project_id, projects]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation: Associate Payout requires a Project
        if (formData.category === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT && !formData.project_id) {
            toast.error("Please select a project for Associate Payouts");
            setLoading(false);
            return;
        }

        try {
            await createTransaction({
                ...formData,
                amount: parseFloat(formData.amount)
            });
            toast.success("Transaction recorded successfully");
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to record transaction");
        } finally {
            setLoading(false);
        }
    };

    // Prepare Options for SearchableSelect
    const projectOptions = filteredProjects.map(p => {
        // Helper to derive display name
        let clientName = p.client_name || p.metadata?.client_name;
        if (!clientName && p.client_id) {
            const client = clients.find(c => c._id === p.client_id || c.id === p.client_id);
            if (client) clientName = client.name;
        }

        let projectName = p.metadata?.project_type || 'Project';
        if (p.vertical === 'knots') {
            const groom = p.metadata?.groom_name || '';
            const bride = p.metadata?.bride_name || '';
            projectName = (groom || bride) ? `${groom} & ${bride}` : 'Wedding';
        } else if (p.vertical === 'pluto' && p.metadata?.child_name) {
            projectName = p.metadata.child_name;
        }

        const label = clientName ? `${projectName} - ${clientName}` : `${projectName} (${p.code})`;

        return { value: p.id || p._id, label };
    });



    // Logic to prioritize associates assigned to the selected project
    const getSortedAssociateOptions = () => {
        let options = associates.map(a => ({
            value: a.id || a._id,
            label: a.name,
            role: null,
            isAssigned: false
        }));

        if (formData.project_id) {
            const project = projects.find(p => p._id === formData.project_id || p.id === formData.project_id);
            if (project && project.events) {
                const assignedMap = new Map(); // associate_id -> role
                project.events.forEach(evt => {
                    if (evt.assignments) {
                        evt.assignments.forEach(asn => {
                            // If user has multiple roles, join them or pick first. joining is better.
                            if (assignedMap.has(asn.associate_id)) {
                                const current = assignedMap.get(asn.associate_id);
                                if (!current.includes(asn.role)) {
                                    assignedMap.set(asn.associate_id, `${current}, ${asn.role}`);
                                }
                            } else {
                                assignedMap.set(asn.associate_id, asn.role);
                            }
                        });
                    }
                });

                options = options.map(opt => {
                    const role = assignedMap.get(opt.value);
                    return {
                        ...opt,
                        isAssigned: !!role,
                        role: role,
                        label: role ? `★ ${opt.label} (${role})` : opt.label
                    };
                });

                // Sort: Assigned first, then alphabetical
                options.sort((a, b) => {
                    if (a.isAssigned && !b.isAssigned) return -1;
                    if (!a.isAssigned && b.isAssigned) return 1;
                    return a.label.localeCompare(b.label);
                });
            }
        }

        return options;
    };

    const associateOptions = getSortedAssociateOptions();

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="New Transaction"
            subtitle="Record an income or expense"
            width="max-w-md"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* 1. Type Selection (Top) */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    {[TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.TRANSFER].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${formData.type === type
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* 2. Vertical Selection */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Vertical</label>
                    <select
                        value={selectedVertical}
                        onChange={(e) => {
                            setSelectedVertical(e.target.value);
                            setFormData(prev => ({ ...prev, project_id: '' }));
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                    >
                        <option value={VERTICALS.GENERAL}>General</option>
                        {config?.verticals?.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Project Selection (Conditional) */}
                {selectedVertical !== VERTICALS.GENERAL && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-medium mb-1 text-gray-500">Project</label>
                        <SearchableSelect
                            options={projectOptions || []}
                            value={formData.project_id}
                            onChange={(val) => setFormData({ ...formData, project_id: val })}
                            placeholder="Select Project..."
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className={`w-full pl-7 pr-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Account</label>
                    <select
                        required
                        value={formData.account_id}
                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                    >
                        <option value="" disabled>Select Account</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.current_balance})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1 text-gray-500">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '', associate_id: '' })}
                            className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                        >
                            <option value="">Select...</option>
                            {filteredCategories.map(c => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory OR Associate Payout */}
                    {formData.category === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT ? (
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-500">Pay To</label>
                            <SearchableSelect
                                options={associateOptions}
                                value={formData.associate_id}
                                onChange={(val) => setFormData({ ...formData, associate_id: val })}
                                placeholder="Select Associate..."
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-500">Subcategory</label>
                            <select
                                value={formData.subcategory}
                                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                                disabled={availableSubcategories.length === 0}
                            >
                                <option value="">{availableSubcategories.length > 0 ? 'Select...' : 'None'}</option>
                                {availableSubcategories.map(s => (
                                    <option key={s.id || s.name} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Client Dropdown Removed users request */}

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} focus:border-indigo-500 focus:outline-none`}
                        rows="3"
                        placeholder="Add details..."
                    />
                </div>

                <div className="pt-4 border-t border-dashed">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-lg shadow-indigo-500/30 transition-all"
                    >
                        {loading ? 'Saving...' : 'Save Transaction'}
                    </button>
                </div>
            </form>
        </SlideOver>
    );
};

export default TransactionSlideOver;
