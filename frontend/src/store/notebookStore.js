import { create } from 'zustand';
import api from '../api/client';

const useNotebookStore = create((set, get) => ({
  notebooks: [],
  activeNotebook: null,
  loading: false,
  error: null,

  fetchNotebooks: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/notebooks');
      set({ notebooks: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  createNotebook: async (title, emoji) => {
    try {
      const { data } = await api.post('/notebooks', {
        title: title || 'Untitled notebook',
        emoji: emoji || '📓',
      });
      set((state) => ({ notebooks: [data, ...state.notebooks] }));
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateNotebook: async (id, updates) => {
    try {
      const { data } = await api.patch(`/notebooks/${id}`, updates);
      set((state) => ({
        notebooks: state.notebooks.map((nb) =>
          nb.id === id ? { ...nb, ...data } : nb
        ),
      }));
      return data;
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteNotebook: async (id) => {
    try {
      await api.delete(`/notebooks/${id}`);
      set((state) => ({
        notebooks: state.notebooks.filter((nb) => nb.id !== id),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  setActiveNotebook: (notebook) => set({ activeNotebook: notebook }),

  clearError: () => set({ error: null }),
}));

export default useNotebookStore;
