import { create } from 'zustand';
import api from '../api/client';

const useDocumentStore = create((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  uploadProgress: 0,
  error: null,

  fetchDocuments: async (notebookId) => {
    set({ loading: true });
    try {
      const params = notebookId ? { notebook_id: notebookId } : {};
      const { data } = await api.get('/documents', { params });
      set({ documents: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  uploadDocument: async (file, notebookId) => {
    set({ uploading: true, error: null, uploadProgress: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (notebookId) {
        formData.append('notebook_id', notebookId);
      }
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set({ uploadProgress: percentCompleted });
          }
        }
      });

      // Auto-rename notebook if it's the first upload and still "Untitled notebook"
      if (notebookId) {
        try {
          const { default: useNotebookStore } = await import('./notebookStore');
          const nb = useNotebookStore.getState().activeNotebook;
          const currentDocs = get().documents;
          // Only rename if it's the first doc and notebook is still untitled
          if (currentDocs.length === 0 && nb && nb.title === 'Untitled notebook') {
            const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            await useNotebookStore.getState().updateNotebook(notebookId, { title: fileName });
            useNotebookStore.getState().setActiveNotebook({ ...nb, title: fileName });
          }
        } catch (err) {
          console.warn('Auto-rename failed:', err);
        }
      }

      // Refresh document list (scoped to notebook)
      get().fetchDocuments(notebookId);
      set({ uploading: false, uploadProgress: 0 });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      set({ uploading: false, uploadProgress: 0, error: msg });
      throw new Error(msg);
    }
  },

  deleteDocument: async (docId) => {
    const previousDocuments = get().documents;
    
    // Optimistically update the UI immediately
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== docId),
    }));

    try {
      const { default: useChatStore } = await import('./chatStore');
      const chatState = useChatStore.getState();
      if (chatState.activeDocumentIds.includes(docId)) {
        chatState.toggleDocument(docId);
      }
      
      await api.delete(`/documents/${docId}`);
    } catch (err) {
      // Revert if the API call fails
      set({ documents: previousDocuments, error: err.message });
      throw err;
    }
  },

  renameDocument: async (docId, newName) => {
    try {
      const { data } = await api.patch(`/documents/${docId}/rename`, { name: newName });
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === docId ? { ...d, original_name: data.original_name } : d
        ),
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
