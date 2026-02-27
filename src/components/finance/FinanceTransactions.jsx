import React, { useState, useEffect } from 'react';

// eslint-disable-next-line no-unused-vars
import { getTransactions, createTransaction, getAccounts } from '../../api/finance';
import { getAssociates } from '../../api/associates';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import TransactionItem from './TransactionItem';
import { useAgencyConfig } from '../../context/AgencyConfigContext';

const FinanceTransactions = ({ refreshTrigger }) => {
    const { theme } = useTheme();
    const { config } = useAgencyConfig();
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const [txs, ascRes, projRes] = await Promise.all([
                getTransactions(),
                getAssociates(),
                getProjects()
            ]);
            setTransactions(txs);

            // Handle varied API responses (array vs data object)
            if (ascRes.data) setAssociates(ascRes.data);
            else if (Array.isArray(ascRes)) setAssociates(ascRes);

            if (projRes.data) setProjects(projRes.data);
            else if (Array.isArray(projRes)) setProjects(projRes);

        } catch (error) {
            console.error("Failed to load transactions", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    return (
        <div className="h-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Transactions</h2>
                <div className="flex gap-2">
                    <button className={`p-2 rounded-lg border ${theme.canvas.border} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={loadData}
                        className={`p-2 rounded-lg border ${theme.canvas.border} hover:bg-gray-100 dark:hover:bg-gray-800`}
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
                {transactions.map(tx => (
                    <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        theme={theme}
                        associates={associates}
                        projects={projects}
                        config={config}
                    />
                ))}
                {transactions.length === 0 && !loading && (
                    <p className={`text-center py-10 ${theme.text.secondary}`}>No transactions found</p>
                )}
            </div>
        </div>
    );
};

export default FinanceTransactions;
