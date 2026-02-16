import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import api from '../../api/axios';
import { toast } from 'sonner';

const FinanceSection = ({ role }) => {
    const { theme } = useTheme();
    const { config, refreshConfig } = useAgencyConfig();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Edit States
    const [editingCategory, setEditingCategory] = useState(null); // { id, name, type }
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    // Subcategory Edit States
    const [editingSubcategory, setEditingSubcategory] = useState(null); // { parentId, id, name }
    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [addingSubcategoryTo, setAddingSubcategoryTo] = useState(null); // parentId

    useEffect(() => {
        if (config?.finance_categories) {
            setCategories(JSON.parse(JSON.stringify(config.finance_categories)));
        } else {
            // Fetch if not in context yet (should be handled by context update)
            api.get('/settings/finance/categories')
                .then(res => setCategories(res.data.categories))
                .catch(err => console.error(err));
        }
    }, [config]);

    const toggleExpand = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const saveCategories = async (updatedCategories) => {
        setLoading(true);
        try {
            await api.patch('/settings/finance/categories', { categories: updatedCategories });
            toast.success('Categories updated');
            refreshConfig();
            setCategories(updatedCategories);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update categories');
        } finally {
            setLoading(false);
        }
    };

    // --- Category Actions ---

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const newCat = {
            id: newCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
            name: newCategoryName,
            type: newCategoryType,
            subcategories: []
        };
        const updated = [...categories, newCat];
        await saveCategories(updated);
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Area you sure? This will affect existing transactions report filtering.')) return;
        const updated = categories.filter(c => c.id !== id);
        await saveCategories(updated);
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return;
        const updated = categories.map(c => c.id === editingCategory.id ? { ...c, name: editingCategory.name } : c);
        await saveCategories(updated);
        setEditingCategory(null);
    };

    // --- Subcategory Actions ---

    const handleAddSubcategory = async (parentId) => {
        if (!newSubcategoryName.trim()) return;
        const updated = categories.map(c => {
            if (c.id === parentId) {
                const newSub = {
                    id: newSubcategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
                    name: newSubcategoryName
                };
                return { ...c, subcategories: [...(c.subcategories || []), newSub] };
            }
            return c;
        });
        await saveCategories(updated);
        setNewSubcategoryName('');
        setAddingSubcategoryTo(null);
        setExpandedCategories(prev => ({ ...prev, [parentId]: true }));
    };

    const handleDeleteSubcategory = async (parentId, subId) => {
        const updated = categories.map(c => {
            if (c.id === parentId) {
                return { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) };
            }
            return c;
        });
        await saveCategories(updated);
    };

    const handleUpdateSubcategory = async () => {
        if (!editingSubcategory || !editingSubcategory.name.trim()) return;
        const updated = categories.map(c => {
            if (c.id === editingSubcategory.parentId) {
                return {
                    ...c,
                    subcategories: c.subcategories.map(s => s.id === editingSubcategory.id ? { ...s, name: editingSubcategory.name } : s)
                };
            }
            return c;
        });
        await saveCategories(updated);
        setEditingSubcategory(null);
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const CategoryList = ({ title, list, typeColor }) => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className={`text-lg font-bold ${theme.text.primary}`}>{title}</h3>
            </div>

            <div className="space-y-3">
                {list.map(cat => (
                    <div key={cat.id} className={`rounded-xl border ${theme.canvas.border} ${theme.canvas.card} overflow-hidden`}>
                        {/* Category Header */}
                        <div className={`p-4 flex items-center justify-between ${theme.canvas.hover} transition-colors`}>
                            <div className="flex items-center gap-3">
                                <button onClick={() => toggleExpand(cat.id)} className={`${theme.text.secondary} hover:${theme.text.primary}`}>
                                    {expandedCategories[cat.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>

                                {editingCategory?.id === cat.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            value={editingCategory.name}
                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                            className={`px-2 py-1 text-sm rounded bg-transparent border ${theme.canvas.border}`}
                                        />
                                        <button onClick={handleUpdateCategory} className="text-green-500"><Save size={16} /></button>
                                        <button onClick={() => setEditingCategory(null)} className="text-red-500"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <span className="font-medium text-sm">{cat.name}</span>
                                )}
                                <span className="text-xs text-gray-400">({cat.subcategories?.length || 0})</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAddingSubcategoryTo(cat.id)}
                                    className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${theme.text.secondary}`}
                                    title="Add Subcategory"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                                    className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${theme.text.secondary}`}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Subcategories */}
                        {(expandedCategories[cat.id] || addingSubcategoryTo === cat.id) && (
                            <div className={`px-4 pb-3 pl-12 space-y-2 border-t ${theme.canvas.border} bg-gray-50/50 dark:bg-gray-900/20`}>
                                {cat.subcategories?.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between py-2 border-b border-dashed border-gray-200 dark:border-gray-800 last:border-0">
                                        {editingSubcategory?.id === sub.id && editingSubcategory?.parentId === cat.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    value={editingSubcategory.name}
                                                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                                                    className={`px-2 py-1 text-xs rounded bg-transparent border ${theme.canvas.border}`}
                                                />
                                                <button onClick={handleUpdateSubcategory} className="text-green-500"><Save size={14} /></button>
                                                <button onClick={() => setEditingSubcategory(null)} className="text-red-500"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <span className={`text-sm ${theme.text.secondary}`}>{sub.name}</span>
                                        )}

                                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                                            <button
                                                onClick={() => setEditingSubcategory({ parentId: cat.id, id: sub.id, name: sub.name })}
                                                className="p-1 hover:text-blue-500"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                                className="p-1 hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Subcategory Input */}
                                {addingSubcategoryTo === cat.id && (
                                    <div className="flex items-center gap-2 py-2">
                                        <input
                                            autoFocus
                                            placeholder="New Subcategory Name"
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                                            className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${theme.canvas.border} bg-white dark:bg-gray-800`}
                                        />
                                        <button
                                            onClick={() => handleAddSubcategory(cat.id)}
                                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setAddingSubcategoryTo(null)}
                                            className="p-1.5 text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={() => {
                        setNewCategoryType(typeColor === 'green' ? 'income' : 'expense');
                        setIsAddingCategory(true);
                    }}
                    className={`w-full py-3 border border-dashed ${theme.canvas.border} rounded-xl text-sm ${theme.text.secondary} hover:${theme.text.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2 group`}
                >
                    <Plus size={16} className={`group-hover:text-${typeColor}-500 transition-colors`} />
                    Add {title} Category
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Finance Categories</h2>
                <p className={`${theme.text.secondary} mt-1`}>Manage income and expense categories for reporting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CategoryList title="Income" list={incomeCategories} typeColor="green" />
                <CategoryList title="Expense" list={expenseCategories} typeColor="red" />
            </div>

            {/* Add Category Modal/Overlay could be here, but using inline for now */}
            {isAddingCategory && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md ${theme.canvas.card} rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200`}>
                        <h3 className="text-lg font-bold mb-4">Add New Category</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Type</label>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setNewCategoryType('income')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newCategoryType === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Income
                                    </button>
                                    <button
                                        onClick={() => setNewCategoryType('expense')}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${newCategoryType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Expense
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Category Name</label>
                                <input
                                    autoFocus
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-lg border ${theme.canvas.border} ${theme.canvas.bg}`}
                                    placeholder="e.g. Consulting, Rent"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleAddCategory}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Create Category
                                </button>
                                <button
                                    onClick={() => setIsAddingCategory(false)}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceSection;
