import api from './axios';

export const getAlertTypes = async () => {
    const response = await api.get('/communications/alert-types');
    return response.data;
};

export const listMessages = async (filters = {}) => {
    const params = {};
    if (filters.alert_type) params.alert_type = filters.alert_type;
    if (filters.recipient_id) params.recipient_id = filters.recipient_id;
    if (filters.status) params.status = filters.status;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.order) params.order = filters.order;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    const response = await api.get('/communications/messages', { params });
    return response.data;
};

export const createMessage = async (payload) => {
    const response = await api.post('/communications/messages', payload);
    return response.data;
};

export const editMessage = async (messageId, messageBody) => {
    const response = await api.patch(`/communications/messages/${messageId}`, { message_body: messageBody });
    return response.data;
};

export const deleteMessage = async (messageId) => {
    await api.delete(`/communications/messages/${messageId}`);
};

export const prepareSend = async (messageId) => {
    const response = await api.post(`/communications/messages/${messageId}/prepare-send`);
    return response.data;
};

export const resendMessage = async (messageId) => {
    const response = await api.post(`/communications/messages/${messageId}/resend`);
    return response.data;
};

export const getSettings = async () => {
    const response = await api.get('/communications/settings');
    return response.data;
};

export const updateSettings = async (payload) => {
    const response = await api.put('/communications/settings', payload);
    return response.data;
};
