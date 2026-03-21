import api from './axios';

export const getProjects = async (params, fullResponse = false) => {
    const response = await api.get('/projects', { params });
    if (fullResponse) return response.data;

    // Handle pagination wrapper if present
    if (response.data && response.data.data) {
        return response.data.data;
    }
    return response.data;
};

export const getProject = async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
};

export const updateProject = async (id, projectData) => {
    const response = await api.patch(`/projects/${id}`, projectData);
    return response.data;
};

export const deleteProject = async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
};

// Portal Deliverables
export const getUploadUrl = async (projectId, fileName, contentType) => {
    const response = await api.post(`/projects/${projectId}/deliverables/upload-url`, {
        file_name: fileName,
        content_type: contentType,
    });
    return response.data;
};

export const getDeliverables = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/deliverables`);
    return response.data;
};

export const updateDeliverable = async (projectId, deliverableId, data) => {
    const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}`, data);
    return response.data;
};

export const deleteDeliverable = async (projectId, deliverableId) => {
    const response = await api.delete(`/projects/${projectId}/deliverables/${deliverableId}`);
    return response.data;
};

export const addFileToDeliverable = async (projectId, deliverableId, fileData) => {
    const response = await api.post(`/projects/${projectId}/deliverables/${deliverableId}/files`, fileData);
    return response.data;
};

export const deleteFileFromDeliverable = async (projectId, deliverableId, fileId) => {
    const response = await api.delete(`/projects/${projectId}/deliverables/${deliverableId}/files/${fileId}`);
    return response.data;
};

export const addTeamFeedback = async (projectId, deliverableId, message, fileId) => {
    const body = { message };
    if (fileId) body.file_id = fileId;
    const response = await api.post(`/projects/${projectId}/deliverables/${deliverableId}/feedback`, body);
    return response.data;
};

export const generatePortalToken = async (projectId) => {
    const response = await api.post(`/projects/${projectId}/portal-token`);
    return response.data;
};

// Portal Settings
export const updatePortalSettings = async (projectId, settings) => {
    const response = await api.patch(`/projects/${projectId}/portal-settings`, settings);
    return response.data;
};

// Download Limits
export const setDownloadSettings = async (projectId, deliverableId, settings) => {
    const response = await api.patch(`/projects/${projectId}/deliverables/${deliverableId}/download-settings`, settings);
    return response.data;
};

export const resetDownloads = async (projectId, deliverableId) => {
    const response = await api.post(`/projects/${projectId}/deliverables/${deliverableId}/reset-downloads`);
    return response.data;
};

// File Versioning
export const replaceFile = async (projectId, deliverableId, fileId, fileData) => {
    const response = await api.post(`/projects/${projectId}/deliverables/${deliverableId}/files/${fileId}/replace`, fileData);
    return response.data;
};

export const getFileVersions = async (projectId, deliverableId, fileId) => {
    const response = await api.get(`/projects/${projectId}/deliverables/${deliverableId}/files/${fileId}/versions`);
    return response.data;
};

// Portal Analytics
export const getPortalAnalytics = async (projectId, days = 30) => {
    const response = await api.get(`/projects/${projectId}/portal-analytics`, { params: { days } });
    return response.data;
};

// Per-file watermark toggle
export const toggleFileWatermark = async (projectId, deliverableId, fileId, enabled, watermarkText) => {
    const body = { enabled };
    if (watermarkText !== undefined) body.watermark_text = watermarkText;
    const response = await api.post(
        `/projects/${projectId}/deliverables/${deliverableId}/files/${fileId}/watermark`,
        body
    );
    return response.data;
};
