import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PreferencesState {
  // UI preferences that should persist across sessions
  sidebarCollapsed: boolean;
  isDarkMode: boolean;
  preferredDateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'auto';
  defaultCalculationView: 'simple' | 'detailed';

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;

  setPreferredDateFormat: (
    format: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'auto'
  ) => void;

  setDefaultCalculationView: (view: 'simple' | 'detailed') => void;
  resetPreferences: () => void;
}

const getDefaultPreferences = () => ({
  sidebarCollapsed: false,
  isDarkMode: true,
  preferredDateFormat: 'auto' as const,
  defaultCalculationView: 'detailed' as const,
});

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Initial state
      ...getDefaultPreferences(),

      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setDarkMode: (darkMode) => set({ isDarkMode: darkMode }),

      setPreferredDateFormat: (format) => set({ preferredDateFormat: format }),

      setDefaultCalculationView: (view) =>
        set({ defaultCalculationView: view }),

      resetPreferences: () => set(getDefaultPreferences()),
    }),
    {
      name: 'azure-hours-ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        isDarkMode: state.isDarkMode,
        preferredDateFormat: state.preferredDateFormat,
        defaultCalculationView: state.defaultCalculationView,
      }),
    }
  )
);
