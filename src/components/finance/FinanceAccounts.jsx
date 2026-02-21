import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount } from '../../api/finance';
import { useTheme } from '../../context/ThemeContext';
import { Plus, CreditCard, Wallet, Banknote, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const AccountCard = ({ account, theme }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'bank': return <Building2 size={24} />;
            case 'cash': return <Banknote size={24} />;
            case 'card': return <CreditCard size={24} />;
            case 'wallet': return <Wallet size={24} />;
            default: return <Wallet size={24} />;
        }
    };

    return (
        <div className={`p-6 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-blue-50 text-blue-600`}>
                    {getIcon(account.type)}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${theme.canvas.bg} border ${theme.canvas.border}`}>
                    {account.type.toUpperCase()}
                </span>
            </div>
            <div>
                <h3 className="text-lg font-semibold">{account.name}</h3>
                <p className={`text-2xl font-bold mt-1`}>
                    ₹ {account.current_balance.toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    );
};

const FinanceAccounts = () => {
    const { theme } = useTheme();
    const [accounts, setAccounts] = useState([]);
     
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', opening_balance: 0 });

    const loadAccounts = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error("Failed to load accounts", error);
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAccount(newAccount);
            toast.success("Account created successfully");
            setNewAccount({ name: '', type: 'bank', opening_balance: 0 });
            setShowForm(false);
            loadAccounts();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create account");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Accounts</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={16} />
                    <span>Add Account</span>
                </button>
            </div>

            {showForm && (
                <div className={`p-6 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} shadow-sm animate-in fade-in slide-in-from-top-4`}>
                    <h3 className="font-semibold mb-4">New Account</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Account Name</label>
                            <input
                                type="text"
                                required
                                value={newAccount.name}
                                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border}`}
                                placeholder="e.g. HDFC Bank"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={newAccount.type}
                                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border}`}
                            >
                                <option value="bank">Bank</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="wallet">Wallet</option>
                                <option value="loan">Loan</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Opening Balance</label>
                            <input
                                type="number"
                                required
                                value={newAccount.opening_balance}
                                onChange={(e) => setNewAccount({ ...newAccount, opening_balance: parseFloat(e.target.value) })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border}`}
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(account => (
                    <AccountCard key={account.id} account={account} theme={theme} />
                ))}
            </div>
        </div>
    );
};

export default FinanceAccounts;
