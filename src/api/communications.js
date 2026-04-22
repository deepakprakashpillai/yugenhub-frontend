import api from './axios';

export const getAssociates = async () => {
    const response = await api.get('/associates');
    return response.data;
};

export const getAlertTypes = async () => {
    const response = await api.get('/communications/alert-types');
    return response.data;
};

export const listMessages = async (filters = {}) => {
    const params = {};
    if (filters.alert_type) params.alert_type = filters.alert_type;
    if (filters.recipient_id) params.recipient_id = filters.recipient_id;
    if (filters.status) params.status = filters.status;
    if (filters.send_channel) params.send_channel = filters.send_channel;
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

export const getTemplates = async () => {
    const response = await api.get('/communications/templates');
    return response.data;
};

export const saveTemplate = async (alertType, bodyTemplate) => {
    const response = await api.put(`/communications/templates/${alertType}`, { body_template: bodyTemplate });
    return response.data;
};

export const resetTemplate = async (alertType) => {
    await api.delete(`/communications/templates/${alertType}`);
};

export const getSchedulerConfig = async () => {
    const response = await api.get('/communications/scheduler-config');
    return response.data;
};

export const updateSchedulerConfig = async (payload) => {
    const response = await api.patch('/communications/scheduler-config', payload);
    return response.data;
};

export const runSchedulerNow = async (jobName) => {
    const response = await api.post(`/communications/scheduler/run-now/${jobName}`);
    return response.data;
};

export const blastPreview = async (alertType) => {
    const response = await api.post('/communications/blast/preview', { alert_type: alertType });
    return response.data;
};

export const blastSend = async (alertType, items) => {
    const response = await api.post('/communications/blast/send', { alert_type: alertType, items });
    return response.data;
};
