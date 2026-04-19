import React, { useState, useEffect } from 'react';
import { getTransactions, getAccounts } from '../../api/finance';
import { getAssociates } from '../../api/associates';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import TransactionItem from './TransactionItem';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { Skeleton } from '../ui/Skeleton';
import Select from '../ui/Select';

const TYPE_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'income', label: 'Income' },
    { id: 'expense', label: 'Expense' },
    { id: 'transfer', label: 'Transfer' },
];

const FinanceTransactions = ({ refreshTrigger }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [projects, setProjects] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');

    const loadData = async () => {
        try {
            setLoading(true);
            const [txs, ascRes, projRes, accRes] = await Promise.all([
                getTransactions({ limit: 500 }),
                getAssociates(),
                getProjects({}, true),
                getAccounts(),
            ]);
            setTransactions(Array.isArray(txs) ? txs : []);

            if (ascRes.data) setAssociates(ascRes.data);
            else if (Array.isArray(ascRes)) setAssociates(ascRes);

            const projData = projRes.data || projRes;
            setProjects(Array.isArray(projData) ? projData : []);
            setAccounts(Array.isArray(accRes) ? accRes : []);
        } catch (error) {
            console.error('Failed to load transactions', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [refreshTrigger]);

    const filtered = transactions.filter(tx => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (accountFilter !== 'all' && tx.account_id !== accountFilter) return false;
        return true;
    });

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-bold ${theme.text.primary}`}>Transactions</h2>
                <button
                    onClick={loadData}
                    className={`p-2 rounded-lg border ${theme.canvas.border} ${theme.canvas.hover} transition-colors`}
                    title="Refresh"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
                {/* Type pills */}
                <div className="flex gap-1">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setTypeFilter(f.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                typeFilter === f.id
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                    : `${theme.canvas.hover} ${theme.text.secondary} border border-transparent`
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Account filter */}
                {accounts.length > 1 && (
                    <Select
                        value={accountFilter}
                        onChange={setAccountFilter}
                        options={[
                            { value: 'all', label: 'All Accounts' },
                            ...accounts.map(a => ({ value: a.id, label: a.name }))
                        ]}
                        className="min-w-[140px]"
                    />
                )}

                {filtered.length !== transactions.length && (
                    <span className={`text-xs ${theme.text.secondary} self-center ml-1`}>
                        {filtered.length} of {transactions.length}
                    </span>
                )}
            </div>

            {/* List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {loading ? (
                    [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                ) : filtered.length === 0 ? (
                    <p className={`text-center py-10 text-sm ${theme.text.secondary}`}>
                        {transactions.length === 0 ? 'No transactions yet' : 'No transactions match the current filter'}
                    </p>
                ) : (
                    filtered.map(tx => (
                        <TransactionItem
                            key={tx.id}
                            transaction={tx}
                            theme={theme}
                            associates={associates}
                            projects={projects}
                            config={config}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default FinanceTransactions;
