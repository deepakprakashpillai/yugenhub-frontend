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
