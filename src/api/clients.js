import api from './axios';

export const getClients = async () => {
    const response = await api.get('/clients');
    return response.data;
};

export const createClient = async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
};

export const updateClient = async (clientId, clientData) => {
    const response = await api.put(`/clients/${clientId}`, clientData);
    return response.data;
};

export const deleteClient = async (clientId) => {
    const response = await api.delete(`/clients/${clientId}`);
    return response.data;
};
