import React, { useEffect, useState } from 'react';
import { getFinanceOverview, getTransactions } from '../../api/finance';
import { getAssociates } from '../../api/associates';
import { getProjects } from '../../api/projects';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Wallet } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import TransactionItem from './TransactionItem';

// eslint-disable-next-line
const StatCard = ({ title, value, icon: Icon, trend, type, theme }) => (
    <div className={`p-6 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm`}>
        <div className="flex justify-between items-start">
            <div>
                <p className={`text-sm font-medium ${theme.text.secondary}`}>{title}</p>
                <h3 className="text-2xl font-bold mt-2 flex items-center">
                    <IndianRupee size={20} className="mr-1" />
                    {value?.toLocaleString('en-IN') || '0'}
                </h3>
            </div>
            <div className={`p-2 rounded-lg ${type === 'positive' ? 'bg-green-100 text-green-600' : type === 'negative' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <Icon size={20} />
            </div>
        </div>
    </div>
);

const FinanceOverview = ({ refreshTrigger }) => {
    const { theme } = useTheme();
    const [data, setData] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [associates, setAssociates] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Parallel fetch
                const [overviewRes, recentRes, ascRes, projRes] = await Promise.all([
                    getFinanceOverview(),
                    getTransactions({ limit: 5 }),
                    getAssociates(),
                    getProjects()
                ]);
                setData(overviewRes);
                setRecentTransactions(recentRes);

                // Handle varied API responses
                if (ascRes.data) setAssociates(ascRes.data);
                else if (Array.isArray(ascRes)) setAssociates(ascRes);

                if (projRes.data) setProjects(projRes.data);
                else if (Array.isArray(projRes)) setProjects(projRes);

            } catch (error) {
                console.error("Failed to load finance overview", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [refreshTrigger]);

    if (loading) {
        return <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Income"
                    value={data?.income}
                    icon={ArrowUpRight}
                    type="positive"
                    theme={theme}
                />
                <StatCard
                    title="Total Expenses"
                    value={data?.expenses}
                    icon={ArrowDownRight}
                    type="negative"
                    theme={theme}
                />
                <StatCard
                    title="Net Profit"
                    value={data?.net_profit}
                    icon={Wallet}
                    type={data?.net_profit >= 0 ? "positive" : "negative"}
                    theme={theme}
                />
                <StatCard
                    title="Outstanding Receivables"
                    value={data?.outstanding_receivables}
                    icon={Wallet}
                    type="neutral"
                    theme={theme}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className={`col-span-2 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} p-6`}>
                    <h3 className={`text-lg font-bold ${theme.text.primary} mb-4`}>Recent Transactions</h3>
                    <div className="space-y-3">
                        {recentTransactions.map(tx => (
                            <TransactionItem
                                key={tx.id}
                                transaction={tx}
                                theme={theme}
                                associates={associates}
                                projects={projects}
                            />
                        ))}
                        {recentTransactions.length === 0 && (
                            <p className={`text-center py-4 ${theme.text.secondary}`}>No recent transactions</p>
                        )}
                    </div>
                </div>

                {/* Financial Health Chart Placeholder */}
                <div className={`rounded-xl border ${theme.canvas.card} ${theme.canvas.border} p-6 flex flex-col justify-center items-center text-center`}>
                    <div className="p-4 bg-blue-500/10 rounded-full mb-3">
                        <Wallet className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className={`font-medium ${theme.text.primary}`}>Financial Health</h4>
                    <p className={`text-sm ${theme.text.secondary} mt-2`}>
                        {data?.income > data?.expenses ? "You're profitable! Keep it up." : "Expenses exceed income. Review spending."}
                    </p>
                    <div className="mt-6 w-full">
                        <div className="flex justify-between text-xs mb-1">
                            <span>Income vs Expense</span>
                            <span>{Math.round((data?.expenses / (data?.income || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-zinc-700">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(((data?.expenses || 0) / (data?.income || 1)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceOverview;
