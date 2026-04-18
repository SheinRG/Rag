import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: false,

      toggleTheme: () => {
        const next = !get().isDark;
        document.documentElement.classList.toggle('dark', next);
        set({ isDark: next });
      },

      // Call on app mount to sync the class with stored preference
      hydrate: () => {
        const { isDark } = get();
        document.documentElement.classList.toggle('dark', isDark);
      },
    }),
    {
      name: 'docmind-theme',
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
);

export default useThemeStore;
