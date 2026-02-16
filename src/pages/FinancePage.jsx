import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import FinanceOverview from '../components/finance/FinanceOverview';
import FinanceAccounts from '../components/finance/FinanceAccounts';
import FinanceTransactions from '../components/finance/FinanceTransactions';
import FinanceInvoices from '../components/finance/FinanceInvoices';
import FinancePayouts from '../components/finance/FinancePayouts';
import FinanceProjects from '../components/finance/FinanceProjects'; // NEW
import MultiActionFAB from '../components/MultiActionFAB';
import { TransactionSlideOver, InvoiceSlideOver } from '../components/modals';
import { CreditCard, PieChart, Users, FileText, ArrowLeftRight, Briefcase } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

const FinancePage = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (user && user.role !== ROLES.ADMIN && user.role !== ROLES.OWNER) {
            navigate('/');
            // Optional: Show toast "Access Denied"
        }
    }, [user, navigate]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieChart },
        { id: 'projects', label: 'Projects', icon: Briefcase }, // NEW
        { id: 'accounts', label: 'Accounts', icon: CreditCard },
        { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
        { id: 'invoices', label: 'Quotes & Invoices', icon: FileText },
        { id: 'payouts', label: 'Associate Payouts', icon: Users },
    ];

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [transactionOpen, setTransactionOpen] = useState(false);
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null); // NEW
    const [initialTransactionData, setInitialTransactionData] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'new_transaction') {
            const type = searchParams.get('type') || 'expense';
            const vertical = searchParams.get('vertical') || 'general';

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInitialTransactionData({
                type,
                vertical: vertical // Pass vertical to let modal handle it
            });
            setTransactionOpen(true);

            // Clean up URL
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <FinanceOverview refreshTrigger={refreshTrigger} />;
            case 'accounts':
                return <FinanceAccounts refreshTrigger={refreshTrigger} />;
            case 'transactions':
                return <FinanceTransactions refreshTrigger={refreshTrigger} />;
            case 'projects':
                return <FinanceProjects />;
            case 'invoices':
                return <FinanceInvoices
                    refreshTrigger={refreshTrigger}
                    onNewInvoice={() => {
                        setSelectedInvoice(null);
                        setInvoiceOpen(true);
                    }}
                    onEditInvoice={(invoice) => {
                        setSelectedInvoice(invoice);
                        setInvoiceOpen(true);
                    }}
                />;
            case 'payouts':
                return <FinancePayouts refreshTrigger={refreshTrigger} />;
            default:
                return <FinanceOverview refreshTrigger={refreshTrigger} />;
        }
    };

    const fabActions = [
        {
            label: 'Transaction',
            icon: <ArrowLeftRight size={20} />,
            onClick: () => setTransactionOpen(true)
        },
        {
            label: 'Invoice',
            icon: <FileText size={20} />,
            onClick: () => setInvoiceOpen(true)
        }
    ];

    return (
        <div className={`h-full flex flex-col ${theme.canvas.bg}`}>
            {/* Header */}
            <div className={`p-6 border-b ${theme.canvas.border} flex justify-between items-center`}>
                <div>
                    <h1 className="text-2xl font-bold">Finance</h1>
                    <p className={`text-sm ${theme.text.secondary}`}>Manage your agency's finances</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={`px-6 pt-4 border-b ${theme.canvas.border} flex space-x-6 overflow-x-auto`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-4 flex items-center space-x-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                            ? `border-[var(--primary)] ${theme.text.primary}`
                            : `border-transparent ${theme.text.secondary} hover:${theme.text.primary}`
                            }`}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
            </div>

            <MultiActionFAB actions={fabActions} />

            <TransactionSlideOver
                isOpen={transactionOpen}
                onClose={() => {
                    setTransactionOpen(false);
                    setInitialTransactionData(null);
                }}
                onSuccess={handleRefresh}
                initialData={initialTransactionData}
            />

            <InvoiceSlideOver
                isOpen={invoiceOpen}
                onClose={() => {
                    setInvoiceOpen(false);
                    setSelectedInvoice(null);
                }}
                onSuccess={handleRefresh}
                initialData={selectedInvoice}
            />
        </div>
    );
};

export default FinancePage;
