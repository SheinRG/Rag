import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  loadFromStorage: async () => {
    // Listen for auth changes automatically from Supabase
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const token = session.access_token;
        const user = { id: session.user.id, email: session.user.email };
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      }
    });

    // Try to get initial session in case local storage is stale
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const token = session.access_token;
      const user = { id: session.user.id, email: session.user.email };
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user });
    } else {
      // Fallback to manual local storage check (though session should be reliable)
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          set({ token, user: JSON.parse(userStr) });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      }
    }
  },

  signup: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      set({ loading: false });
      return { success: true, message: 'Account created! Check your email to confirm.' };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, message: err.message };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const token = data.session.access_token;
      const user = { id: data.user.id, email: data.user.email };

      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ token, user, loading: false });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, message: err.message };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
// Sync load immediately on script execution to prevent router flicker
useAuthStore.getState().loadFromStorage();

export default useAuthStore;
