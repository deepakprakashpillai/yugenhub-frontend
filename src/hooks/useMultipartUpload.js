import { useState, useRef, useCallback } from 'react';
import { initUpload, getPartUrl, completeUpload, abortUpload, initVersionUpload, completeVersionUpload } from '../api/editor';

const PART_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const CONCURRENCY = 4;

export function useMultipartUpload(token) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [error, setError] = useState(null);
  const abortRef = useRef(false);
  const uploadStateRef = useRef(null); // { key, upload_id, deliverableId } for cleanup on abort

  const abort = useCallback(async () => {
    abortRef.current = true;
    setStatus('idle');
    setProgress(0);
    const s = uploadStateRef.current;
    if (s) {
      try {
        await abortUpload(token, s.deliverableId, { key: s.key, upload_id: s.upload_id });
      } catch {
        // best-effort cleanup
      }
      uploadStateRef.current = null;
    }
  }, [token]);

  // fileId — when provided, calls version/init + version/complete instead of upload/init + upload/complete
  const upload = useCallback(async (file, deliverableId, editorIdentity, fileId = null, changeNotes = '') => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 5 GB limit');
      setStatus('error');
      return null;
    }

    abortRef.current = false;
    setError(null);
    setProgress(0);
    setStatus('uploading');

    let key = null;
    let upload_id = null;

    try {
      // 1. Init
      const initBody = { file_name: file.name, content_type: file.type || 'application/octet-stream', file_size: file.size };
      const init = fileId
        ? await initVersionUpload(token, deliverableId, fileId, initBody)
        : await initUpload(token, deliverableId, initBody);
      key = init.key;
      upload_id = init.upload_id;
      uploadStateRef.current = { key, upload_id, deliverableId };

      if (abortRef.current) return null;

      // 2. Upload parts with concurrency
      const partCount = Math.ceil(file.size / PART_SIZE);
      const parts = new Array(partCount).fill(null);
      let completedParts = 0;

      // Queue of part numbers to upload
      const queue = Array.from({ length: partCount }, (_, i) => i + 1);

      const uploadPart = async () => {
        while (queue.length > 0) {
          if (abortRef.current) return;
          const partNumber = queue.shift();
          if (partNumber === undefined) return;

          const start = (partNumber - 1) * PART_SIZE;
          const chunk = file.slice(start, start + PART_SIZE);

          const { url } = await getPartUrl(token, {
            key,
            upload_id,
            part_number: partNumber,
          });

          if (abortRef.current) return;

          const response = await fetch(url, { method: 'PUT', body: chunk });
          if (!response.ok) throw new Error(`Part ${partNumber} upload failed: ${response.status}`);

          // Strip surrounding quotes from ETag
          const etag = (response.headers.get('ETag') || '').replace(/"/g, '');
          parts[partNumber - 1] = { PartNumber: partNumber, ETag: etag };

          completedParts += 1;
          setProgress(Math.round((completedParts / partCount) * 95)); // reserve last 5% for complete call
        }
      };

      // Run CONCURRENCY workers in parallel
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, partCount) }, uploadPart));

      if (abortRef.current) return null;

      // 3. Complete
      setProgress(97);
      const completeBody = {
        key, upload_id, parts: parts.filter(Boolean),
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
        editor_email: editorIdentity.email,
        editor_name: editorIdentity.name,
        ...(fileId ? { change_notes: changeNotes } : {}),
      };
      const result = fileId
        ? await completeVersionUpload(token, deliverableId, fileId, completeBody)
        : await completeUpload(token, deliverableId, completeBody);

      uploadStateRef.current = null;
      setProgress(100);
      setStatus('done');
      return result.file;

    } catch (err) {
      if (abortRef.current) return null;
      setError(err.message || 'Upload failed');
      setStatus('error');
      // Attempt to clean up the partial upload
      if (key && upload_id) {
        try { await abortUpload(token, deliverableId, { key, upload_id }); } catch { /* best-effort */ }
      }
      uploadStateRef.current = null;
      return null;
    }
  }, [token]);

  const reset = useCallback(() => {
    abortRef.current = false;
    setProgress(0);
    setStatus('idle');
    setError(null);
    uploadStateRef.current = null;
  }, []);

  return { upload, abort, reset, progress, status, error };
}
