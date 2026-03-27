import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, adjustAccountBalance } from '../../api/finance';
import { useTheme } from '../../context/ThemeContext';
import { Plus, CreditCard, Wallet, Banknote, Building2, SlidersHorizontal, Check, X } from 'lucide-react';
import { IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const ACCOUNT_ICONS = {
    bank: Building2,
    cash: Banknote,
    card: CreditCard,
    wallet: Wallet,
    loan: Wallet,
};

const AccountCard = ({ account, theme, onAdjusted }) => {
    const Icon = ACCOUNT_ICONS[account.type] || Wallet;
    const [adjusting, setAdjusting] = useState(false);
    const [targetBalance, setTargetBalance] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const diff = targetBalance !== '' ? parseFloat(targetBalance) - account.current_balance : 0;

    const handleAdjust = async () => {
        const target = parseFloat(targetBalance);
        if (isNaN(target)) return;
        setSaving(true);
        try {
            await adjustAccountBalance(account.id, target, note || undefined);
            toast.success(`Balance adjusted to ₹${target.toLocaleString('en-IN')}`);
            setAdjusting(false);
            setTargetBalance('');
            setNote('');
            onAdjusted();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Failed to adjust balance');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`rounded-xl border ${theme.canvas.card} ${theme.canvas.border} overflow-hidden`}>
            <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <Icon size={18} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${theme.text.primary}`}>{account.name}</h3>
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${theme.text.secondary}`}>{account.type}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setAdjusting(v => !v); setTargetBalance(''); setNote(''); }}
                        className={`p-1.5 rounded-lg transition-colors ${adjusting ? 'bg-amber-500/10 text-amber-400' : `${theme.canvas.hover} ${theme.text.secondary}`}`}
                        title="Adjust Balance"
                    >
                        <SlidersHorizontal size={14} />
                    </button>
                </div>

                <div className="flex items-end gap-1">
                    <IndianRupee className={`w-4 h-4 mb-0.5 ${account.current_balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-2xl font-black ${account.current_balance >= 0 ? theme.text.primary : 'text-red-400'}`}>
                        {Math.abs(account.current_balance).toLocaleString('en-IN')}
                    </span>
                    {account.current_balance < 0 && <span className="text-xs text-red-400 mb-1">overdrawn</span>}
                </div>
                {account.opening_balance !== 0 && (
                    <p className={`text-[10px] ${theme.text.secondary} mt-1`}>
                        Opening: ₹{account.opening_balance.toLocaleString('en-IN')}
                    </p>
                )}
            </div>

            {/* Adjust Balance Panel */}
            {adjusting && (
                <div className={`border-t ${theme.canvas.border} p-4 space-y-3 bg-amber-500/5`}>
                    <p className={`text-xs font-semibold text-amber-400`}>Set Correct Balance</p>
                    <p className={`text-[11px] ${theme.text.secondary}`}>
                        Enter the actual current balance. The difference will be recorded as an income or expense adjustment so your P&L stays accurate.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg border ${theme.canvas.border} ${theme.canvas.bg}`}>
                            <IndianRupee size={13} className={theme.text.secondary} />
                            <input
                                type="number"
                                autoFocus
                                value={targetBalance}
                                onChange={(e) => setTargetBalance(e.target.value)}
                                placeholder={account.current_balance.toString()}
                                className={`w-full bg-transparent text-sm font-semibold ${theme.text.primary} outline-none`}
                            />
                        </div>
                        {targetBalance !== '' && !isNaN(parseFloat(targetBalance)) && Math.abs(diff) >= 0.01 && (
                            <span className={`text-xs font-bold shrink-0 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {diff > 0 ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Note (optional)"
                        className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.border} ${theme.canvas.bg} text-xs ${theme.text.primary} outline-none`}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdjust}
                            disabled={saving || targetBalance === '' || isNaN(parseFloat(targetBalance)) || Math.abs(diff) < 0.01}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                        >
                            <Check size={12} />
                            {saving ? 'Saving…' : 'Apply Adjustment'}
                        </button>
                        <button
                            onClick={() => { setAdjusting(false); setTargetBalance(''); setNote(''); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${theme.canvas.hover} ${theme.text.secondary}`}
                        >
                            <X size={12} />Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FinanceAccounts = ({ refreshTrigger, onRefresh }) => {
    const { theme } = useTheme();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', opening_balance: 0 });

    const loadAccounts = async () => {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAccounts(); }, [refreshTrigger]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAccount(newAccount);
            toast.success('Account created');
            setNewAccount({ name: '', type: 'bank', opening_balance: 0 });
            setShowForm(false);
            loadAccounts();
            onRefresh?.();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Failed to create account');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className={`text-lg font-bold ${theme.text.primary}`}>Accounts</h2>
                    <p className={`text-xs ${theme.text.secondary} mt-0.5`}>Track balances across cash, bank, and wallet accounts</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                    <Plus size={14} />Add Account
                </button>
            </div>

            {showForm && (
                <div className={`p-5 rounded-xl border ${theme.canvas.card} ${theme.canvas.border} animate-in fade-in slide-in-from-top-2`}>
                    <h3 className={`text-sm font-bold ${theme.text.primary} mb-4`}>New Account</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${theme.text.secondary}`}>Account Name</label>
                            <input
                                type="text"
                                required
                                value={newAccount.name}
                                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} text-sm ${theme.text.primary} outline-none`}
                                placeholder="e.g. HDFC Bank"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${theme.text.secondary}`}>Type</label>
                            <select
                                value={newAccount.type}
                                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} text-sm ${theme.text.primary} outline-none`}
                            >
                                <option value="bank">Bank</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="wallet">Wallet</option>
                                <option value="loan">Loan</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${theme.text.secondary}`}>Opening Balance</label>
                            <input
                                type="number"
                                value={newAccount.opening_balance}
                                onChange={(e) => setNewAccount({ ...newAccount, opening_balance: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-3 py-2 rounded-lg border ${theme.canvas.bg} ${theme.canvas.border} text-sm ${theme.text.primary} outline-none`}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-4 py-2 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/20 transition-colors">Save</button>
                            <button type="button" onClick={() => setShowForm(false)} className={`px-4 py-2 text-xs font-bold rounded-lg ${theme.canvas.hover} ${theme.text.secondary} transition-colors`}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map(i => <div key={i} className={`h-28 rounded-xl animate-pulse ${theme.canvas.card} border ${theme.canvas.border}`} />)}
                </div>
            ) : accounts.length === 0 ? (
                <div className={`text-center py-12 ${theme.text.secondary}`}>
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No accounts yet. Add one to start tracking.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map(account => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            theme={theme}
                            onAdjusted={() => { loadAccounts(); onRefresh?.(); }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FinanceAccounts;
