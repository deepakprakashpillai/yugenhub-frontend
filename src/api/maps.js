import api from './axios';

export const resolveMapsUrl = async (url) => {
    const response = await api.post('/maps/resolve', { url });
    return response.data;
};

export const getPublicConfig = async () => {
    const response = await api.get('/config/public');
    return response.data;
};
