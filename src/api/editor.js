import axios from 'axios';

// Separate axios instance — no auth token, no 401 redirect. Mirror api/portal.js exactly.
const editorApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getEditorData = async (token) =>
  (await editorApi.get(`/editor/${token}`)).data;

export const identifyEditor = async (token, credential) =>
  (await editorApi.post(`/editor/${token}/identify`, { credential })).data;

export const postEditorComment = async (token, deliverableId, body) =>
  (await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/comment`, body)).data;

export const initUpload = async (token, deliverableId, body) =>
  (await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/upload/init`, body)).data;

export const getPartUrl = async (token, params) =>
  (await editorApi.get(`/editor/${token}/upload/part-url`, { params })).data;

export const completeUpload = async (token, deliverableId, body) =>
  (await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/upload/complete`, body)).data;

export const abortUpload = async (token, deliverableId, body) => {
  await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/upload/abort`, body);
};

export const initVersionUpload = async (token, deliverableId, fileId, body) =>
  (await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/files/${fileId}/version/init`, body)).data;

export const completeVersionUpload = async (token, deliverableId, fileId, body) =>
  (await editorApi.post(`/editor/${token}/deliverables/${deliverableId}/files/${fileId}/version/complete`, body)).data;

export const getVersionDownloadUrl = (token, deliverableId, fileId, versionNum) => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  return `${base}/editor/${token}/deliverables/${deliverableId}/files/${fileId}/versions/${versionNum}/download`;
};
