import React, { useState, useEffect, useCallback } from 'react';
import { getTransactions, createInvoice, getInvoices, updateInvoice } from '../../api/finance';
import { getAssociates } from '../../api/associates';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Wallet, Edit2, Save, X, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { toast } from 'sonner';
import api from '../../api/axios';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES } from '../../constants';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', theme, isEditable, onEdit }) => {
    const colorMap = {
        green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400',
    };
    return (
        <div className={`p-3 sm:p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm relative`}>
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <p className={`text-[10px] sm:text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>{title}</p>
                    <h3 className={`text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 flex items-center gap-0.5 ${color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-500' : theme.text.primary}`}>
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        {fmt(value)}
                    </h3>
                    {subtitle && <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${theme.text.secondary}`}>{subtitle}</p>}
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${colorMap[color] || colorMap.blue}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
};

const PAYMENT_TYPE_COLORS = {
    'Advance':    'bg-violet-500',
    'Partial':    'bg-blue-500',
    'Settlement': 'bg-emerald-500',
    'Bonus':      'bg-amber-500',
};
const PAYMENT_TYPE_TEXT = {
    'Advance':    'text-violet-400',
    'Partial':    'text-blue-400',
    'Settlement': 'text-emerald-400',
    'Bonus':      'text-amber-400',
};

const ProjectFinance = ({ projectId, projectData, onUpdateProject }) => {
    const { theme } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quoteAmount, setQuoteAmount] = useState(0);

    const [isEditingQuote, setIsEditingQuote] = useState(false);
    const [tempQuote, setTempQuote] = useState('');
    const [createQuoteRecord, setCreateQuoteRecord] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [txs, invoices, ascRes] = await Promise.all([
                getTransactions({ project_id: projectId }),
                getInvoices({ project_id: projectId }),
                getAssociates()
            ]);
            setTransactions(txs);
            if (ascRes.data) setAssociates(ascRes.data);
            else if (Array.isArray(ascRes)) setAssociates(ascRes);

            const quotes = invoices.filter(inv => inv.invoice_no?.includes('-QT-'));
            if (quotes.length > 0) {
                setQuoteAmount(quotes[0].total_amount);
            } else {
                setQuoteAmount(parseFloat(projectData?.metadata?.quote_amount || 0));
            }
        } catch (error) {
            console.error("Failed to load project finance data", error);
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    }, [projectId, projectData]);

    useEffect(() => {
        if (projectId) loadData();
    }, [projectId, projectData, loadData]);

    const handleSaveQuote = async () => {
        try {
            const amount = parseFloat(tempQuote);
            if (isNaN(amount)) return;

            const updatedMetadata = { ...projectData.metadata, quote_amount: amount };
            await api.patch(`/projects/${projectId}`, { metadata: updatedMetadata });

            const invoices = await getInvoices({ project_id: projectId });
            const quotes = invoices.filter(inv => inv.invoice_no?.includes('-QT-'));

            if (quotes.length > 0) {
                const latestQuote = quotes[0];
                await updateInvoice(latestQuote.id, {
                    ...latestQuote,
                    total_amount: amount,
                    line_items: [{ title: `Project Quote: ${projectData.code || 'Project'}`, quantity: 1, price: amount, total: amount }]
                });
                toast.success("Quote updated");
            } else if (createQuoteRecord) {
                await createInvoice({
                    invoice_no: `GEN-QT-${Math.floor(100000 + Math.random() * 900000)}`,
                    client_id: projectData.client_id,
                    project_id: projectId,
                    date: new Date().toISOString().split('T')[0],
                    line_items: [{ title: `Project Quote: ${projectData.code || 'Project'}`, quantity: 1, price: amount, total: amount }],
                    total_amount: amount,
                    status: 'draft'
                });
                toast.success("Quote created");
            } else {
                toast.success("Quote saved");
            }

            setQuoteAmount(amount);
            setIsEditingQuote(false);
            if (onUpdateProject) onUpdateProject();
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update quote");
        }
    };

    const getAssociateName = (id) => associates.find(a => a.id === id || a._id === id)?.name || 'Unknown';
    const getAssociateRole = (associateId) => {
        if (!projectData?.events) return null;
        for (const evt of projectData.events) {
            const assignment = evt.assignments?.find(a => a.associate_id === associateId);
            if (assignment) return assignment.role;
        }
        return null;
    };

    if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

    // ─── Calculations ─────────────────────────────────────────────
    const incomeTxs = transactions.filter(t => t.type === TRANSACTION_TYPES.INCOME);
    const expenseTxs = transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

    const totalReceived = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
    const balanceDue = Math.max(0, quoteAmount - totalReceived);
    const netProfit = totalReceived - totalExpenses;
    const collectionPct = quoteAmount > 0 ? Math.min((totalReceived / quoteAmount) * 100, 100) : 0;
    const profitMargin = totalReceived > 0 ? (netProfit / totalReceived) * 100 : 0;

    // Group project payment income by subcategory
    const paymentBreakdown = {};
    incomeTxs
        .filter(t => t.category === FINANCE_CATEGORIES.PROJECT_PAYMENT)
        .forEach(t => {
            const key = t.subcategory || 'Other';
            paymentBreakdown[key] = (paymentBreakdown[key] || 0) + t.amount;
        });

    return (
        <div className="space-y-5">
            {/* ── Stats Grid ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Quote */}
                {isEditingQuote ? (
                    <div className={`p-3 sm:p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm`}>
                        <label className={`text-[10px] sm:text-xs font-medium ${theme.text.secondary} uppercase tracking-wider block mb-2`}>
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
                                <input type="checkbox" id="createQuote" checked={createQuoteRecord} onChange={(e) => setCreateQuoteRecord(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="createQuote" className={`text-[10px] sm:text-xs ${theme.text.secondary} cursor-pointer select-none`}>Generate Quote Record</label>
                            </div>
                        </div>
                    </div>
                ) : quoteAmount === 0 ? (
                    <button
                        onClick={() => { setTempQuote(''); setCreateQuoteRecord(true); setIsEditingQuote(true); }}
                        className={`p-3 sm:p-4 rounded-xl border-2 border-dashed ${theme.canvas.border} hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex flex-col items-center justify-center text-center group`}
                    >
                        <div className="p-1.5 sm:p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-1 sm:mb-2 group-hover:scale-110 transition-transform">
                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className={`text-sm font-bold ${theme.text.primary}`}>Set Quote</span>
                        <span className={`text-[10px] sm:text-xs ${theme.text.secondary}`}>Add contract value</span>
                    </button>
                ) : (
                    <StatCard title="Contract Value" value={quoteAmount} icon={Wallet} color="blue" theme={theme} isEditable onEdit={() => { setTempQuote(quoteAmount); setCreateQuoteRecord(false); setIsEditingQuote(true); }} />
                )}

                <StatCard
                    title="Collected"
                    value={totalReceived}
                    subtitle={quoteAmount > 0 ? `${Math.round(collectionPct)}% of contract` : `${incomeTxs.length} payment${incomeTxs.length !== 1 ? 's' : ''}`}
                    icon={ArrowUpRight}
                    color="green"
                    theme={theme}
                />

                <StatCard
                    title="Balance Due"
                    value={balanceDue}
                    subtitle={balanceDue === 0 && quoteAmount > 0 ? 'Fully collected ✓' : quoteAmount > 0 ? `${Math.round(100 - collectionPct)}% pending` : undefined}
                    icon={balanceDue > 0 ? AlertCircle : ArrowUpRight}
                    color={balanceDue > 0 ? 'amber' : 'green'}
                    theme={theme}
                />

                <StatCard
                    title="Net Profit"
                    value={netProfit}
                    subtitle={totalReceived > 0 ? `${Math.round(profitMargin)}% margin` : `Expenses: ₹${fmt(totalExpenses)}`}
                    icon={TrendingUp}
                    color={netProfit >= 0 ? 'green' : 'red'}
                    theme={theme}
                />
            </div>

            {/* ── Collection Progress ───────────────────────────── */}
            {quoteAmount > 0 && (
                <div className={`p-3 sm:p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border}`}>
                    <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className={theme.text.secondary}>Collection Progress</span>
                        <span className={collectionPct >= 100 ? 'text-emerald-500' : collectionPct >= 60 ? 'text-blue-400' : 'text-amber-400'}>
                            ₹{fmt(totalReceived)} / ₹{fmt(quoteAmount)}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${collectionPct >= 100 ? 'bg-emerald-500' : collectionPct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${collectionPct}%` }}
                        />
                    </div>

                    {/* Payment type breakdown */}
                    {Object.keys(paymentBreakdown).length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            {Object.entries(paymentBreakdown).map(([type, amount]) => (
                                <div key={type} className="flex items-center gap-1.5 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${PAYMENT_TYPE_COLORS[type] || 'bg-gray-400'}`} />
                                    <span className={`font-medium ${PAYMENT_TYPE_TEXT[type] || theme.text.secondary}`}>{type}</span>
                                    <span className={theme.text.secondary}>₹{fmt(amount)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Expense Bar ───────────────────────────────────── */}
            {quoteAmount > 0 && totalExpenses > 0 && (
                <div className={`p-3 sm:p-4 rounded-xl border ${theme.canvas.card} ${theme.canvas.border}`}>
                    <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className={theme.text.secondary}>Expenses vs Profit</span>
                        <span className={profitMargin >= 30 ? 'text-emerald-500' : 'text-amber-500'}>
                            {Math.round(profitMargin)}% margin on received
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-red-400" style={{ width: `${Math.min((totalExpenses / (totalReceived || 1)) * 100, 100)}%` }} title={`Expenses`} />
                        <div className="h-full bg-emerald-400" style={{ width: `${Math.max(0, 100 - (totalExpenses / (totalReceived || 1)) * 100)}%` }} title="Profit" />
                    </div>
                    <div className="flex gap-4 mt-2 text-[10px] sm:text-xs text-gray-500">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Expenses ₹{fmt(totalExpenses)}</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Profit ₹{fmt(netProfit)}</div>
                    </div>
                </div>
            )}

            {/* ── Transaction List ──────────────────────────────── */}
            <div>
                <h3 className={`text-base font-bold ${theme.text.primary} mb-3`}>Transactions</h3>
                <div className="space-y-2">
                    {transactions.map(tx => {
                        const isIncome = tx.type === TRANSACTION_TYPES.INCOME;
                        const isPayout = tx.category === FINANCE_CATEGORIES.ASSOCIATE_PAYOUT;
                        const isProjectPayment = tx.category === FINANCE_CATEGORIES.PROJECT_PAYMENT;
                        const displayTitle = isPayout
                            ? (tx.associate_id ? getAssociateName(tx.associate_id) : tx.category)
                            : isProjectPayment
                                ? (tx.subcategory || 'Project Payment')
                                : tx.category;
                        const displaySubtitle = isPayout
                            ? (tx.associate_id ? getAssociateRole(tx.associate_id) : null)
                            : isProjectPayment
                                ? null
                                : tx.subcategory;

                        return (
                            <div key={tx.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${theme.canvas.border} ${theme.canvas.card}`}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-1.5 rounded-full shrink-0 ${isIncome ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                        {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-medium text-sm ${theme.text.primary} flex items-center gap-1.5`}>
                                            {displayTitle}
                                            {isProjectPayment && tx.subcategory && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PAYMENT_TYPE_COLORS[tx.subcategory] || 'bg-gray-500'} bg-opacity-20 ${PAYMENT_TYPE_TEXT[tx.subcategory] || theme.text.secondary}`}>
                                                    {tx.subcategory}
                                                </span>
                                            )}
                                            {displaySubtitle && !isProjectPayment && (
                                                <span className={`text-[10px] ${theme.text.secondary}`}>({displaySubtitle})</span>
                                            )}
                                        </p>
                                        <p className={`text-[10px] ${theme.text.secondary}`}>
                                            {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {tx.notes ? ` • ${tx.notes}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <p className={`font-bold text-sm shrink-0 ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                    {isIncome ? '+' : '−'} ₹{fmt(tx.amount)}
                                </p>
                            </div>
                        );
                    })}
                    {transactions.length === 0 && (
                        <p className={`text-center py-8 text-sm ${theme.text.secondary} border-2 border-dashed rounded-xl ${theme.canvas.border}`}>
                            No transactions yet. Record your first payment above.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectFinance;
