import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../api/finance';
import { getAssociates } from '../../api/associates';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import TransactionSlideOver from '../modals/TransactionSlideOver';
import TransactionItem from './TransactionItem';
import { FINANCE_CATEGORIES, TRANSACTION_TYPES, VERTICALS } from '../../constants';

const FinancePayouts = ({ refreshTrigger }) => {
    const { theme } = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTransactionSlideOver, setShowTransactionSlideOver] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [txRes, ascRes, projRes] = await Promise.all([
                getTransactions({ category: FINANCE_CATEGORIES.ASSOCIATE_PAYOUT }),
                getAssociates(),
                getProjects()
            ]);
            setTransactions(txRes);

            if (ascRes.data) setAssociates(ascRes.data);
            else if (Array.isArray(ascRes)) setAssociates(ascRes);

            if (projRes.data) setProjects(projRes.data);
            else if (Array.isArray(projRes)) setProjects(projRes);

        } catch (error) {
            console.error("Failed to load payouts", error);
            toast.error("Failed to load payouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    return (
        <div className="h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Associate Payouts</h2>
                <button
                    onClick={() => setShowTransactionSlideOver(true)}
                    className="flex items-center space-x-1 sm:space-x-2 px-3 py-1.5 sm:px-3 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-sm">New Payout</span>
                </button>
            </div>

            {/* List */}
            <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                {transactions.map(tx => (
                    <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        theme={theme}
                        associates={associates}
                        projects={projects}
                    />
                ))}
                {transactions.length === 0 && !loading && (
                    <p className={`text-center py-10 ${theme.text.secondary}`}>No payouts found</p>
                )}
            </div>

            {/* Transaction SlideOver reused for Payouts */}
            <TransactionSlideOver
                isOpen={showTransactionSlideOver}
                onClose={() => setShowTransactionSlideOver(false)}
                onSuccess={loadData}
                initialData={{
                    type: TRANSACTION_TYPES.EXPENSE,
                    category: FINANCE_CATEGORIES.ASSOCIATE_PAYOUT,
                    vertical: VERTICALS.GENERAL
                }}
            />
        </div>
    );
};

export default FinancePayouts;
