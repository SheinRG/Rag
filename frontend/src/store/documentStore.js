import { create } from 'zustand';
import api from '../api/client';

const useDocumentStore = create((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/documents');
      set({ documents: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  uploadDocument: async (file) => {
    set({ uploading: true, error: null, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set({ uploadProgress: percentCompleted });
          }
        }
      });
      // Refresh document list
      get().fetchDocuments();
      set({ uploading: false, uploadProgress: 0 });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      set({ uploading: false, uploadProgress: 0, error: msg });
      throw new Error(msg);
    }
  },

  deleteDocument: async (docId) => {
    try {
      await api.delete(`/documents/${docId}`);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  pollDocumentStatus: async (docId) => {
    try {
      const { data } = await api.get(`/documents/${docId}/status`);
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === docId ? { ...d, ...data } : d
        ),
      }));
      return data;
    } catch (err) {
      console.error('Poll status error:', err);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useDocumentStore;
