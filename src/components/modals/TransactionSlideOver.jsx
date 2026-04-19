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
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import DatePicker from '../ui/DatePicker';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES, VERTICALS } from '../../constants';

const PROJECT_PAYMENT_CAT = FINANCE_CATEGORIES.PROJECT_PAYMENT;

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
        destination_account_id: '',
        category: '',
        subcategory: '',
        client_id: '',
        project_id: '',
        associate_id: '',
        notes: ''
    });

    const isTransfer = formData.type === TRANSACTION_TYPES.TRANSFER;
    const isProjectIncomeMode = !!(formData.project_id && formData.type === TRANSACTION_TYPES.INCOME);

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
                destination_account_id: initialData?.destination_account_id || '',
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

    // Hardcoded fallback subcategories for Project Payment (used when not yet in agency config)
    const PROJECT_PAYMENT_SUBCATEGORIES = [
        { id: 'advance', name: 'Advance' },
        { id: 'partial', name: 'Partial' },
        { id: 'settlement', name: 'Settlement' },
        { id: 'bonus', name: 'Bonus' },
    ];

    // Update available categories when type or config changes
    // Note: formData.category intentionally NOT in deps — clearing should only trigger on type change
    useEffect(() => {
        if (formData.type === TRANSACTION_TYPES.TRANSFER) {
            setFilteredCategories([]);
            return;
        }

        let relevantCats = [];
        if (config?.finance_categories) {
            relevantCats = config.finance_categories.filter(c => c.type === formData.type);
        }

        // Always inject Project Payment for income if not configured yet
        if (formData.type === TRANSACTION_TYPES.INCOME) {
            if (!relevantCats.find(c => c.name === PROJECT_PAYMENT_CAT)) {
                relevantCats = [{ id: 'project_payment', name: PROJECT_PAYMENT_CAT, subcategories: PROJECT_PAYMENT_SUBCATEGORIES }, ...relevantCats];
            }
        }

        // Always inject Associate Payout for expense
        if (formData.type === TRANSACTION_TYPES.EXPENSE) {
            if (!relevantCats.find(c => c.name === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT)) {
                relevantCats = [{ id: 'payout', name: FINANCE_CATEGORIES.ASSOCIATE_PAYOUT, subcategories: [] }, ...relevantCats];
            }
        }

        setFilteredCategories(relevantCats);

        // Clear category only on type change, and never when in project income mode
        setFormData(prev => {
            const isProjectMode = !!prev.project_id;
            const stillValid = relevantCats.find(c => c.name === prev.category);
            if (prev.category && !stillValid && !isProjectMode) {
                return { ...prev, category: '', subcategory: '', associate_id: '' };
            }
            return prev;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.type, config]);

    // Update subcategories when category changes
    useEffect(() => {
        // Project Payment: use config subcategories if available, else hardcoded fallback
        if (formData.category === PROJECT_PAYMENT_CAT) {
            const configCat = filteredCategories.find(c => c.name === PROJECT_PAYMENT_CAT);
            const subs = configCat?.subcategories?.length ? configCat.subcategories : PROJECT_PAYMENT_SUBCATEGORIES;
            setAvailableSubcategories(subs);
            return;
        }
        const selectedCat = filteredCategories.find(c => c.name === formData.category);
        setAvailableSubcategories(selectedCat ? (selectedCat.subcategories || []) : []);
    }, [formData.category, filteredCategories]);

    // Filter projects based on vertical
    useEffect(() => {
        if (selectedVertical && selectedVertical !== VERTICALS.GENERAL) {
            setFilteredProjects(projects.filter(p => p.vertical === selectedVertical));
        } else {
            setFilteredProjects([]);
        }
    }, [selectedVertical, projects]);

    // Auto-select vertical, client, and category when project is selected
    useEffect(() => {
        if (formData.project_id && projects.length > 0) {
            const project = projects.find(p => p._id === formData.project_id || p.id === formData.project_id);
            if (project) {
                if (project.vertical && project.vertical !== selectedVertical) {
                    setSelectedVertical(project.vertical);
                }
                setFormData(prev => {
                    const updates = {};
                    if (project.client_id) updates.client_id = project.client_id;
                    // Auto-switch to income + Project Payment category when a project is linked
                    if (prev.type !== TRANSACTION_TYPES.INCOME) updates.type = TRANSACTION_TYPES.INCOME;
                    if (prev.category !== PROJECT_PAYMENT_CAT) {
                        updates.category = PROJECT_PAYMENT_CAT;
                        updates.subcategory = '';
                    }
                    return { ...prev, ...updates };
                });
            }
        }
    }, [formData.project_id, projects, selectedVertical]);

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
            // Build clean payload — strip empty string values to avoid polluting DB
            const payload = { amount: parseFloat(formData.amount) };
            Object.entries(formData).forEach(([key, val]) => {
                if (key === 'amount') return; // already handled
                if (val !== '' && val !== null && val !== undefined) {
                    payload[key] = val;
                }
            });

            // Transfers: auto-set category, remove irrelevant fields
            if (isTransfer) {
                payload.category = 'Transfer';
                delete payload.subcategory;
                delete payload.associate_id;
            }

            await createTransaction(payload);
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
        const verticalConfig = config?.verticals?.find(v => v.id === p.vertical);
        const template = verticalConfig?.title_template;
        if (template) {
            const meta = p.metadata || {};
            let resolved = template.replace(/\{(\w+)\}/g, (_, fn) => {
                const val = meta[fn];
                return val && typeof val === 'string' ? val.split(' ').slice(0, 2).join(' ') : (val ? String(val) : '');
            }).trim().replace(/^[&\s]+|[&\s]+$/g, '');
            if (resolved && resolved !== '&') projectName = resolved;
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
                <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                    {[TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.TRANSFER].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, type })}
                            className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${formData.type === type
                                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* 2. Vertical Selection */}
                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Vertical</label>
                    <Select
                        value={selectedVertical}
                        onChange={(val) => {
                            setSelectedVertical(val);
                            setFormData(prev => ({ ...prev, project_id: '' }));
                        }}
                        options={[
                            { value: VERTICALS.GENERAL, label: 'General' },
                            ...(config?.verticals || []).map(v => ({ value: v.id, label: v.label }))
                        ]}
                        className="w-full"
                    />
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
                        <DatePicker
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
                            placeholder="Select date"
                            className="w-full"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">{isTransfer ? 'From Account' : 'Account'}</label>
                    <Select
                        value={formData.account_id}
                        onChange={(val) => setFormData({ ...formData, account_id: val })}
                        placeholder="Select Account"
                        options={accounts.map(acc => ({ value: acc.id, label: `${acc.name} (₹${acc.current_balance})` }))}
                        className="w-full"
                    />
                </div>

                {/* Destination Account (Transfer only) */}
                {isTransfer && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-medium mb-1 text-gray-500">To Account</label>
                        <Select
                            value={formData.destination_account_id}
                            onChange={(val) => setFormData({ ...formData, destination_account_id: val })}
                            placeholder="Select Destination"
                            options={accounts.filter(acc => acc.id !== formData.account_id).map(acc => ({ value: acc.id, label: `${acc.name} (₹${acc.current_balance})` }))}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Category / Subcategory (hidden for transfers) */}
                {!isTransfer && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-500">
                                Category {isProjectIncomeMode && <span className="text-indigo-400 ml-1">auto</span>}
                            </label>
                            <Select
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val, subcategory: '', associate_id: '' })}
                                placeholder="Select..."
                                disabled={isProjectIncomeMode}
                                options={filteredCategories.map(c => ({ value: c.name, label: c.name }))}
                                className="w-full"
                            />
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
                                <label className="block text-xs font-medium mb-1 text-gray-500">
                                    {isProjectIncomeMode ? 'Payment Type' : 'Subcategory'}
                                </label>
                                <Select
                                    value={formData.subcategory}
                                    onChange={(val) => setFormData({ ...formData, subcategory: val })}
                                    placeholder={availableSubcategories.length > 0 ? 'Select...' : 'None'}
                                    disabled={availableSubcategories.length === 0}
                                    options={availableSubcategories.map(s => ({ value: s.name, label: s.name }))}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Client Dropdown Removed users request */}

                <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Notes</label>
                    <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
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
