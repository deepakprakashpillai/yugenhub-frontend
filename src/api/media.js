import api from './axios';

export const getFolderTree = async () => {
    const response = await api.get('/media/folders');
    return response.data;
};

export const createFolder = async (name, parentId = null) => {
    const response = await api.post('/media/folders', { name, parent_id: parentId });
    return response.data;
};

export const renameFolder = async (folderId, name) => {
    const response = await api.patch(`/media/folders/${folderId}`, { name });
    return response.data;
};

export const deleteFolder = async (folderId) => {
    const response = await api.delete(`/media/folders/${folderId}`);
    return response.data;
};

export const getFolderItems = async (folderId, page = 1, limit = 50) => {
    const response = await api.get(`/media/folders/${folderId}/items`, { params: { page, limit } });
    return response.data;
};

export const getUploadUrl = async (fileName, contentType, folderId) => {
    const response = await api.post('/media/upload-url', {
        file_name: fileName,
        content_type: contentType,
        folder_id: folderId,
    });
    return response.data;
};

export const registerFile = async (mediaItemId, sizeBytes) => {
    const response = await api.post('/media/items', {
        media_item_id: mediaItemId,
        size_bytes: sizeBytes,
    });
    return response.data;
};

export const renameFile = async (itemId, name) => {
    const response = await api.patch(`/media/items/${itemId}`, { name });
    return response.data;
};

export const moveFile = async (itemId, folderId) => {
    const response = await api.patch(`/media/items/${itemId}`, { folder_id: folderId });
    return response.data;
};

export const deleteFile = async (itemId) => {
    const response = await api.delete(`/media/items/${itemId}`);
    return response.data;
};

export const getDownloadUrl = async (itemId) => {
    const response = await api.get(`/media/items/${itemId}/download`);
    return response.data;
};

export const shareFile = async (itemId, expiresInDays = null) => {
    const body = expiresInDays ? { expires_in_days: expiresInDays } : {};
    const response = await api.post(`/media/items/${itemId}/share`, body);
    return response.data;
};

export const revokeShare = async (itemId) => {
    const response = await api.delete(`/media/items/${itemId}/share`);
    return response.data;
};

export const searchFiles = async (q) => {
    const response = await api.get('/media/search', { params: { q } });
    return response.data;
};

export const getUsageStats = async () => {
    const response = await api.get('/media/usage');
    return response.data;
};

export const refreshUsageStats = async () => {
    const response = await api.post('/media/usage/refresh');
    return response.data;
};
