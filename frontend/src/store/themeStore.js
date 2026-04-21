// Theme store was removed as per user request.
import { create } from 'zustand';
const useThemeStore = create(() => ({
  theme: 'light',
  setTheme: () => {},
  hydrate: () => {},
}));
export default useThemeStore;
