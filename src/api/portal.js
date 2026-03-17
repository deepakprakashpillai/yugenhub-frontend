import axios from 'axios';

// Separate axios instance — no auth token, no 401 redirect
const portalApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getPortalData = async (token) => {
  const response = await portalApi.get(`/portal/${token}`);
  return response.data;
};

export const approveDeliverable = async (token, deliverableId) => {
  const response = await portalApi.post(`/portal/${token}/deliverables/${deliverableId}/approve`);
  return response.data;
};

export const submitFeedback = async (token, deliverableId, message, authorName, fileId) => {
  const body = { message, author_name: authorName };
  if (fileId) body.file_id = fileId;
  const response = await portalApi.post(`/portal/${token}/deliverables/${deliverableId}/feedback`, body);
  return response.data;
};

export const getDownloadUrl = (token, deliverableId, fileId) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  return `${baseUrl}/portal/${token}/deliverables/${deliverableId}/files/${fileId}/download`;
};

export const trackPortalEvent = async (token, eventType, deliverableId) => {
  try {
    const body = { event_type: eventType };
    if (deliverableId) body.deliverable_id = deliverableId;
    await portalApi.post(`/portal/${token}/track`, body);
  } catch {
    // Silently fail — analytics should never block UX
  }
};
