import React, { useEffect, useState } from 'react';
import { getFinanceOverview, getTransactions, getAccounts } from '../../api/finance';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Banknote, TrendingUp } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import TransactionItem from './TransactionItem';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const StatCard = ({ title, value, icon: Icon, accent, theme }) => (
    <div className={`p-4 sm:p-5 rounded-xl border ${theme.canvas.card} ${theme.canvas.border}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${theme.text.secondary}`}>{title}</p>
        <div className="flex items-end justify-between mt-2">
            <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-0.5 ${theme.text.primary}`}>
                <IndianRupee className="w-4 h-4" />
                {fmt(value)}
            </h3>
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accent}22` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
        </div>
    </div>
);

const SectionCard = ({ title, children, theme, action, className = '' }) => (
    <div className={`rounded-xl border ${theme.canvas.card} ${theme.canvas.border} p-4 sm:p-5 ${className}`}>
        <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${theme.text.primary}`}>{title}</h3>
            {action}
        </div>
        {children}
    </div>
);

const FinanceOverview = ({ refreshTrigger }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const [overview, setOverview] = useState(null);
    const [allTransactions, setAllTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [overviewRes, txRes, projRes, accRes] = await Promise.all([
                    getFinanceOverview(),
                    getTransactions({ limit: 1000 }),
                    getProjects({}, true),
                    getAccounts(),
                ]);
                setOverview(overviewRes);
                setAllTransactions(Array.isArray(txRes) ? txRes : []);
                const projData = projRes?.data || projRes;
                setProjects(Array.isArray(projData) ? projData : []);
                setAccounts(Array.isArray(accRes) ? accRes : []);
            } catch (err) {
                console.error('Failed to load finance overview', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [refreshTrigger]);

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Skeleton className="xl:col-span-2 h-64 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Skeleton className="xl:col-span-2 h-56 w-full rounded-xl" />
                    <Skeleton className="h-56 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const income = overview?.income || 0;
    const expenses = overview?.expenses || 0;
    const netProfit = overview?.net_profit ?? (income - expenses);
    const outstanding = overview?.outstanding_receivables || 0;

    // --- Pending Collections: projects with quote_amount, excluding enquiry/cancelled ---
    const SKIP_STATUSES = ['enquiry', 'cancelled'];
    const now = new Date();

    // Group income transactions by project, also track subcategories used
    const projectTxMap = allTransactions
        .filter(t => t.type === 'income' && t.project_id)
        .reduce((acc, t) => {
            if (!acc[t.project_id]) acc[t.project_id] = { total: 0, subcategories: new Set() };
            acc[t.project_id].total += t.amount;
            if (t.subcategory) acc[t.project_id].subcategories.add(t.subcategory);
            return acc;
        }, {});

    function getCollectionAction(project, txData, balanceDue) {
        const status = project.status;
        const subs = txData?.subcategories || new Set();
        const hasAdvance = subs.has('Advance');
        const hasPartial = subs.has('Partial');
        const hasSettlement = subs.has('Settlement');

        // Count events that have already passed
        const pastEvents = (project.events || []).filter(e => {
            const d = e.date ? new Date(e.date) : null;
            return d && d < now;
        });

        if (status === 'completed' && balanceDue > 0 && !hasSettlement) {
            return { label: 'Settlement due', color: '#ef4444', priority: 1 };
        }
        if (status === 'completed' && balanceDue > 0) {
            return { label: 'Balance pending', color: '#f97316', priority: 2 };
        }
        if (status === 'booked' && !hasAdvance) {
            return { label: 'Advance pending', color: '#f59e0b', priority: 3 };
        }
        if (status === 'ongoing' && pastEvents.length >= 1 && !hasPartial) {
            return { label: 'Partial due', color: '#f97316', priority: 4 };
        }
        if (status === 'ongoing') {
            return { label: 'Ongoing', color: '#8b5cf6', priority: 5 };
        }
        if (status === 'booked') {
            return { label: 'Booked', color: '#3b82f6', priority: 6 };
        }
        return { label: status, color: '#6b7280', priority: 7 };
    }

    const pendingCollections = projects
        .filter(p =>
            !SKIP_STATUSES.includes(p.status) &&
            parseFloat(p.metadata?.quote_amount || 0) > 0
        )
        .map(p => {
            const quote = parseFloat(p.metadata.quote_amount);
            const txData = projectTxMap[p.id];
            const collected = txData?.total || 0;
            const balanceDue = Math.max(0, quote - collected);
            const pct = Math.min((collected / quote) * 100, 100);
            const action = getCollectionAction(p, txData, balanceDue);
            return { id: p.id, name: p.name, code: p.code, quote, collected, balanceDue, pct, action };
        })
        .filter(p => p.balanceDue > 0 || p.action.priority <= 3) // show only if balance due or high-priority action
        .sort((a, b) => a.action.priority - b.action.priority || b.balanceDue - a.balanceDue);

    // --- Expense breakdown by category ---
    const expenseByCategory = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const cat = t.category || 'Uncategorised';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {});
    const expenseCategories = Object.entries(expenseByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);
    const maxExpense = expenseCategories[0]?.[1] || 1;

    // --- Income breakdown by subcategory (Project Payment types + others) ---
    const incomeByType = allTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            const key = t.category === 'Project Payment' && t.subcategory
                ? t.subcategory
                : (t.category || 'Other');
            acc[key] = (acc[key] || 0) + t.amount;
            return acc;
        }, {});
    const incomeTypes = Object.entries(incomeByType).sort(([, a], [, b]) => b - a);

    const INCOME_COLORS = {
        'Advance': '#3b82f6',
        'Partial': '#8b5cf6',
        'Settlement': '#22c55e',
        'Bonus': '#f59e0b',
    };
    const getIncomeColor = (key) => INCOME_COLORS[key] || '#6b7280';

    // Recent transactions (last 8)
    const recentTxs = allTransactions.slice(0, 8);

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* --- Stat Cards --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Total Income" value={income} icon={ArrowUpRight} accent="#22c55e" theme={theme} />
                <StatCard title="Total Expenses" value={expenses} icon={ArrowDownRight} accent="#ef4444" theme={theme} />
                <StatCard title="Net Profit" value={netProfit} icon={TrendingUp} accent={netProfit >= 0 ? '#22c55e' : '#ef4444'} theme={theme} />
                <StatCard title="Outstanding" value={outstanding} icon={Banknote} accent="#f59e0b" theme={theme} />
            </div>

            {/* --- Row 2: Pending Collections + Accounts --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Pending Collections */}
                <SectionCard
                    title={`Pending Collections${pendingCollections.length > 0 ? ` (${pendingCollections.length})` : ''}`}
                    theme={theme}
                    className="xl:col-span-2"
                >
                    {pendingCollections.length === 0 ? (
                        <div className={`text-center py-6 ${theme.text.secondary}`}>
                            <p className="text-sm">No pending collections — all booked projects are settled</p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {pendingCollections.slice(0, 6).map(p => (
                                <div key={p.id}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.text.secondary} shrink-0`} style={{ borderColor: `${theme.canvas.border}` }}>
                                                {p.code || '—'}
                                            </span>
                                            <span className={`text-xs font-semibold ${theme.text.primary} truncate`}>{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            {/* Action badge */}
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                                style={{ backgroundColor: `${p.action.color}20`, color: p.action.color }}
                                            >
                                                {p.action.label}
                                            </span>
                                            {p.balanceDue > 0 && (
                                                <span className="text-xs font-bold flex items-center gap-0.5" style={{ color: p.action.color }}>
                                                    <IndianRupee className="w-3 h-3" />{fmt(p.balanceDue)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${p.action.color}18` }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${p.pct}%`,
                                                backgroundColor: p.pct >= 100 ? '#22c55e' : p.action.color,
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className={`text-[10px] ${theme.text.secondary}`}>
                                            <IndianRupee className="inline w-2.5 h-2.5" />{fmt(p.collected)} collected
                                        </span>
                                        <span className={`text-[10px] ${theme.text.secondary}`}>
                                            of <IndianRupee className="inline w-2.5 h-2.5" />{fmt(p.quote)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {pendingCollections.length > 6 && (
                                <p className={`text-xs text-center ${theme.text.secondary} pt-1`}>
                                    +{pendingCollections.length - 6} more projects
                                </p>
                            )}
                        </div>
                    )}
                </SectionCard>

                {/* Accounts + Income Breakdown stacked */}
                <div className="space-y-4">
                    {/* Account Balances */}
                    <SectionCard title="Account Balances" theme={theme}>
                        {accounts.length === 0 ? (
                            <p className={`text-sm text-center py-3 ${theme.text.secondary}`}>No accounts yet</p>
                        ) : (
                            <div className="space-y-2">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                            <span className={`text-xs font-medium ${theme.text.primary} truncate max-w-[120px]`}>{acc.name}</span>
                                        </div>
                                        <span className={`text-xs font-bold ${acc.current_balance >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center gap-0.5`}>
                                            <IndianRupee className="w-3 h-3" />{fmt(acc.current_balance)}
                                        </span>
                                    </div>
                                ))}
                                <div className={`border-t ${theme.canvas.border} pt-2 mt-1 flex items-center justify-between`}>
                                    <span className={`text-xs font-semibold ${theme.text.secondary}`}>Total</span>
                                    <span className={`text-xs font-black ${theme.text.primary} flex items-center gap-0.5`}>
                                        <IndianRupee className="w-3 h-3" />
                                        {fmt(accounts.reduce((s, a) => s + (a.current_balance || 0), 0))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* Income Breakdown */}
                    {incomeTypes.length > 0 && (
                        <SectionCard title="Income Breakdown" theme={theme}>
                            <div className="flex flex-wrap gap-1.5">
                                {incomeTypes.map(([key, val]) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold"
                                        style={{ backgroundColor: `${getIncomeColor(key)}18`, color: getIncomeColor(key) }}
                                    >
                                        <span>{key}</span>
                                        <span className="opacity-70">
                                            <IndianRupee className="inline w-2.5 h-2.5" />{fmt(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {income > 0 && (
                                <div className="mt-3 h-2 rounded-full overflow-hidden flex gap-px">
                                    {incomeTypes.map(([key, val]) => (
                                        <div
                                            key={key}
                                            style={{
                                                width: `${(val / income) * 100}%`,
                                                backgroundColor: getIncomeColor(key),
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>
            </div>

            {/* --- Row 3: Recent Transactions + Expense Breakdown --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Recent Transactions */}
                <SectionCard title="Recent Transactions" theme={theme} className="xl:col-span-2 col-span-1">
                    <div className="space-y-2">
                        {recentTxs.length === 0 ? (
                            <p className={`text-center py-4 text-sm ${theme.text.secondary}`}>No transactions yet</p>
                        ) : (
                            recentTxs.map(tx => (
                                <TransactionItem
                                    key={tx.id}
                                    transaction={tx}
                                    theme={theme}
                                    associates={[]}
                                    projects={projects}
                                    config={config}
                                />
                            ))
                        )}
                    </div>
                </SectionCard>

                {/* Expense Breakdown */}
                <SectionCard title="Expense by Category" theme={theme}>
                    {expenseCategories.length === 0 ? (
                        <p className={`text-sm text-center py-4 ${theme.text.secondary}`}>No expenses recorded</p>
                    ) : (
                        <div className="space-y-3">
                            {expenseCategories.map(([cat, total]) => (
                                <div key={cat}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-medium ${theme.text.primary} truncate max-w-[140px]`}>{cat}</span>
                                        <span className={`text-xs font-bold ${theme.text.primary} flex items-center gap-0.5 shrink-0 ml-2`}>
                                            <IndianRupee className="w-2.5 h-2.5" />{fmt(total)}
                                        </span>
                                    </div>
                                    <div className={`h-1.5 w-full rounded-full`} style={{ backgroundColor: `${theme.canvas.border}55` }}>
                                        <div
                                            className="h-full rounded-full bg-red-400/70"
                                            style={{ width: `${(total / maxExpense) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {expenses > 0 && (
                                <div className={`border-t ${theme.canvas.border} pt-2 mt-1 flex justify-between`}>
                                    <span className={`text-xs ${theme.text.secondary}`}>Total</span>
                                    <span className={`text-xs font-black text-red-400 flex items-center gap-0.5`}>
                                        <IndianRupee className="w-2.5 h-2.5" />{fmt(expenses)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
};

export default FinanceOverview;
