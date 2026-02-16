import api from './axios';

export const getFinanceOverview = async () => {
    const response = await api.get('/finance/overview');
    return response.data;
};

export const getAccounts = async () => {
    const response = await api.get('/finance/accounts');
    return response.data;
};

export const createAccount = async (accountData) => {
    const response = await api.post('/finance/accounts', accountData);
    return response.data;
};

export const getTransactions = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/finance/transactions?${params}`);
    return response.data;
};

export const createTransaction = async (transactionData) => {
    const response = await api.post('/finance/transactions', transactionData);
    return response.data;
};

export const getInvoices = async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/finance/invoices?${params}`);
    return response.data;
};

export const createInvoice = async (invoiceData) => {
    const response = await api.post('/finance/invoices', invoiceData);
    return response.data;
};
export const updateInvoice = async (invoiceId, invoiceData) => {
    const response = await api.put(`/finance/invoices/${invoiceId}`, invoiceData);
    return response.data;
};

export const updateInvoiceStatus = async (invoiceId, status) => {
    const response = await api.post(`/finance/invoices/${invoiceId}/status?status=${status}`);
    return response.data;
};

export const getClientLedger = async (clientId) => {
    const response = await api.get(`/finance/client-ledger/${clientId}`);
    return response.data;
};

export const getPayouts = async () => {
    const response = await api.get('/finance/payouts');
    return response.data;
};

export const createPayout = async (payoutData) => {
    const response = await api.post('/finance/payouts', payoutData);
    return response.data;
};
