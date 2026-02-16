import React, { useState, useEffect } from 'react';
import { getTransactions, createInvoice, getInvoices, updateInvoice } from '../../api/finance';
import { getAssociates } from '../../api/associates'; // Import getAssociates
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Wallet, Edit2, Save, X } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { toast } from 'sonner';
import api from '../../api/axios';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES } from '../../constants';

const FinanceStatCard = ({ title, value, subtitle, icon: Icon, type, theme, onEdit, isEditable }) => (
    <div className={`p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm relative group`}>
        <div className="flex justify-between items-start">
            <div>
                <p className={`text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>{title}</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center">
                    <IndianRupee size={18} className="mr-0.5" />
                    {value?.toLocaleString('en-IN') || '0'}
                </h3>
                {subtitle && <p className={`text-xs mt-1 ${theme.text.secondary}`}>{subtitle}</p>}
            </div>
            <div className={`p-2 rounded-lg ${type === 'positive' ? 'bg-green-50 text-green-600' : type === 'negative' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                <Icon size={18} />
            </div>
        </div>
        {isEditable && (
            <button
                onClick={onEdit}
                className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit Quote"
            >
                <Edit2 size={14} />
            </button>
        )}
    </div>
);

const ProjectFinance = ({ projectId, projectData, onUpdateProject }) => {
    const { theme } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]); // Store associates
    const [loading, setLoading] = useState(true);
    const [quoteAmount, setQuoteAmount] = useState(0);

    // Edit Quote State
    const [isEditingQuote, setIsEditingQuote] = useState(false);
    const [tempQuote, setTempQuote] = useState('');
    const [createQuoteRecord, setCreateQuoteRecord] = useState(false); // New state



    const loadData = async () => {
        try {
            setLoading(true);

            // Parallel fetch: Transactions, Invoices, Associates
            const [txs, invoices, ascRes] = await Promise.all([
                getTransactions({ project_id: projectId }),
                getInvoices({ project_id: projectId }),
                getAssociates()
            ]);

            setTransactions(txs);

            if (ascRes.data) setAssociates(ascRes.data);
            else if (Array.isArray(ascRes)) setAssociates(ascRes);

            // Find latest Quote
            const quotes = invoices.filter(inv => inv.invoice_no?.includes('-QT-'));
            if (quotes.length > 0) {
                // Assuming sorted by created_at desc from backend
                const latestQuote = quotes[0];
                setQuoteAmount(latestQuote.total_amount);
            } else {
                // Fallback to metadata
                setQuoteAmount(parseFloat(projectData?.metadata?.quote_amount || 0));
            }

        } catch (error) {
            console.error("Failed to load project finance data", error);
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadData();
        }
    }, [projectId, projectData]);

    const handleSaveQuote = async () => {
        try {
            const amount = parseFloat(tempQuote);
            if (isNaN(amount)) return;

            // 1. Update project metadata (Always - for backup/fast read)
            const updatedMetadata = {
                ...projectData.metadata,
                quote_amount: amount
            };
            await api.patch(`/projects/${projectId}`, { metadata: updatedMetadata });

            // 2. Sync with Invoice Record
            // Check if we already have a quote invoice
            // We can re-fetch or use state. unique ID or invoice_no is needed.
            // Let's refetch to be safe/sure of latest
            const invoices = await getInvoices({ project_id: projectId });
            const quotes = invoices.filter(inv => inv.invoice_no?.includes('-QT-'));

            if (quotes.length > 0) {
                // Update existing latest quote
                const latestQuote = quotes[0]; // Assumes backend sorts by date desc
                const updatedLineItems = [{
                    title: `Project Quote: ${projectData.code || 'Project'}`,
                    quantity: 1,
                    price: amount,
                    total: amount
                }];

                await updateInvoice(latestQuote.id, {
                    ...latestQuote,
                    total_amount: amount,
                    line_items: updatedLineItems
                });
                toast.success("Project Quote & Invoice updated");
            } else {
                // Create new if strictly requested (checkbox) OR if user thinks they are "setting" a quote for first time and wants a record
                if (createQuoteRecord) {
                    // Better: Use the new fetchNextNumber logic if we could, but here we might just auto-generate random for now
                    // OR better, let's just stick to the random fallback as in original code, 
                    // since we can't easily access the slide-over logic here without refactoring.
                    // Actually, let's use a placeholder sequence or random to avoid collision if possible, 
                    // but the user's issue is UPDATING. 

                    await createInvoice({
                        invoice_no: `GEN-QT-${Math.floor(100000 + Math.random() * 900000)}`, // Fallback
                        client_id: projectData.client_id,
                        project_id: projectId,
                        date: new Date().toISOString().split('T')[0],
                        line_items: [{
                            title: `Project Quote: ${projectData.code || 'Project'}`,
                            quantity: 1,
                            price: amount,
                            total: amount
                        }],
                        total_amount: amount,
                        status: 'draft'
                    });
                    toast.success("New Quote Record Created");
                } else {
                    toast.success("Quote Metadata Updated (No Invoice)");
                }
            }

            setQuoteAmount(amount);
            setIsEditingQuote(false);
            if (onUpdateProject) onUpdateProject(); // Refresh parent
            loadData(); // Reload to reflect changes
        } catch (error) {
            console.error(error);
            toast.error("Failed to update quote");
        }
    };

    const getAssociateName = (id) => {
        const assoc = associates.find(a => a.id === id || a._id === id);
        return assoc ? assoc.name : 'Unknown';
    };

    const getAssociateRole = (associateId) => {
        if (!projectData?.events) return null;
        for (const evt of projectData.events) {
            if (evt.assignments) {
                const assignment = evt.assignments.find(a => a.associate_id === associateId);
                if (assignment) return assignment.role;
            }
        }
        return null;
    };


    if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

    // Calculations
    const totalReceived = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const projectedProfit = quoteAmount - totalExpenses;
    const profitMargin = quoteAmount > 0 ? (projectedProfit / quoteAmount) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isEditingQuote ? (
                    <div className={`p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm`}>
                        <label className={`text-xs font-medium ${theme.text.secondary} uppercase tracking-wider block mb-2`}>
                            Update Quote
                        </label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={tempQuote}
                                    onChange={(e) => setTempQuote(e.target.value)}
                                    className={`w-full px-2 py-1 rounded border ${theme.canvas.bg} ${theme.canvas.border}`}
                                    autoFocus
                                />
                                <button onClick={handleSaveQuote} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"><Save size={16} /></button>
                                <button onClick={() => setIsEditingQuote(false)} className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600"><X size={16} /></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="createQuote"
                                    checked={createQuoteRecord}
                                    onChange={(e) => setCreateQuoteRecord(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="createQuote" className={`text-xs ${theme.text.secondary} cursor-pointer select-none`}>Generate Quote Record</label>
                            </div>
                        </div>
                    </div>
                ) : (
                    quoteAmount === 0 ? (
                        <button
                            onClick={() => {
                                setTempQuote('');
                                setCreateQuoteRecord(true); // Default check on first create
                                setIsEditingQuote(true);
                            }}
                            className={`p-4 rounded-xl border-2 border-dashed ${theme.canvas.border} hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex flex-col items-center justify-center text-center group`}
                        >
                            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                                <Wallet size={20} />
                            </div>
                            <span className={`text-sm font-bold ${theme.text.primary}`}>Set Project Quote</span>
                            <span className={`text-xs ${theme.text.secondary}`}>Add budget to track profit</span>
                        </button>
                    ) : (
                        <FinanceStatCard
                            title="Project Quote"
                            value={quoteAmount}
                            icon={Wallet}
                            type="neutral"
                            theme={theme}
                            isEditable={true}
                            onEdit={() => {
                                setTempQuote(quoteAmount);
                                setCreateQuoteRecord(false); // Default unchecked for updates
                                setIsEditingQuote(true);
                            }}
                        />
                    )
                )}

                <FinanceStatCard
                    title="Total Received"
                    value={totalReceived}
                    subtitle={`${Math.round((totalReceived / (quoteAmount || 1)) * 100)}% of Quote`}
                    icon={ArrowUpRight}
                    type="positive"
                    theme={theme}
                />

                <FinanceStatCard
                    title="Total Expenses"
                    value={totalExpenses}
                    icon={ArrowDownRight}
                    type="negative"
                    theme={theme}
                />

                <FinanceStatCard
                    title="Projected Profit"
                    value={projectedProfit}
                    subtitle={`Margin: ${Math.round(profitMargin)}%`}
                    icon={Wallet}
                    type={projectedProfit >= 0 ? "positive" : "negative"}
                    theme={theme}
                />
            </div>

            {/* Profit Bar */}
            <div className={`p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border}`}>
                <div className="flex justify-between text-xs mb-2 font-medium">
                    <span>Financial Overview</span>
                    <span className={profitMargin >= 30 ? "text-green-500" : "text-amber-500"}>
                        {Math.round(profitMargin)}% Margin
                    </span>
                </div>
                {quoteAmount > 0 && (
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex dark:bg-zinc-800">
                        {/* Expenses */}
                        <div
                            className="h-full bg-red-400"
                            style={{ width: `${Math.min((totalExpenses / quoteAmount) * 100, 100)}%` }}
                            title={`Expenses: ${Math.round((totalExpenses / quoteAmount) * 100)}%`}
                        />
                        {/* Profit (Remaining) */}
                        <div
                            className="h-full bg-green-400"
                            style={{ width: `${Math.max(0, 100 - ((totalExpenses / quoteAmount) * 100))}%` }}
                            title="Projected Profit"
                        />
                    </div>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Expenses</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div> Profit</div>
                </div>
            </div>

            {/* Transaction List */}
            <div>
                <h3 className={`text-lg font-bold ${theme.text.primary} mb-4`}>Transactions</h3>
                <div className="space-y-3">
                    {transactions.map(tx => {
                        const isIncome = tx.type === TRANSACTION_TYPES.INCOME;
                        const isPayout = tx.category === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT;
                        const displayTitle = isPayout
                            ? (tx.associate_id ? getAssociateName(tx.associate_id) : tx.category)
                            : tx.category;
                        const displaySubtitle = isPayout
                            ? (tx.associate_id ? getAssociateRole(tx.associate_id) : null)
                            : tx.subcategory;

                        return (
                            <div key={tx.id} className={`flex items-center justify-between p-3 rounded-lg border ${theme.canvas.border} ${theme.canvas.hover || "bg-zinc-800/50"}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${theme.text.primary}`}>{displayTitle} {displaySubtitle && <span className="text-gray-500 text-xs">({displaySubtitle})</span>}</p>
                                        <p className={`text-xs ${theme.text.secondary}`}>
                                            {new Date(tx.date).toLocaleDateString()} • {tx.notes || 'No notes'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                        {isIncome ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <p className={`text-center py-8 ${theme.text.secondary} border-2 border-dashed rounded-xl ${theme.canvas.border}`}>
                            No transactions recorded for this project yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectFinance;
