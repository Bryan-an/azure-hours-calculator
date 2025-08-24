import { create } from 'zustand';

interface UIState {
  // Dialog states
  settingsOpen: boolean;
  holidaySelectionOpen: boolean;
  eventSelectionOpen: boolean;

  // Loading states
  isCalculating: boolean;
  isLoadingHolidays: boolean;
  isLoadingEvents: boolean;
  isSavingSettings: boolean;

  // Notification/error states
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  } | null;

  // UI preferences (non-persistent)
  sidebarCollapsed: boolean;
  isDarkMode: boolean;

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setHolidaySelectionOpen: (open: boolean) => void;
  setEventSelectionOpen: (open: boolean) => void;
  setCalculating: (calculating: boolean) => void;
  setLoadingHolidays: (loading: boolean) => void;
  setLoadingEvents: (loading: boolean) => void;
  setSavingSettings: (saving: boolean) => void;
  showNotification: (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  hideNotification: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  resetUIState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  settingsOpen: false,
  holidaySelectionOpen: false,
  eventSelectionOpen: false,
  isCalculating: false,
  isLoadingHolidays: false,
  isLoadingEvents: false,
  isSavingSettings: false,
  notification: null,
  sidebarCollapsed: false,
  isDarkMode: true, // Default to dark mode

  // Actions
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setHolidaySelectionOpen: (open) => set({ holidaySelectionOpen: open }),

  setEventSelectionOpen: (open) => set({ eventSelectionOpen: open }),

  setCalculating: (calculating) => set({ isCalculating: calculating }),

  setLoadingHolidays: (loading) => set({ isLoadingHolidays: loading }),

  setLoadingEvents: (loading) => set({ isLoadingEvents: loading }),

  setSavingSettings: (saving) => set({ isSavingSettings: saving }),

  showNotification: (message, severity) =>
    set({
      notification: {
        open: true,
        message,
        severity,
      },
    }),

  hideNotification: () => set({ notification: null }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setDarkMode: (darkMode) => set({ isDarkMode: darkMode }),

  resetUIState: () =>
    set({
      settingsOpen: false,
      holidaySelectionOpen: false,
      eventSelectionOpen: false,
      isCalculating: false,
      isLoadingHolidays: false,
      isLoadingEvents: false,
      isSavingSettings: false,
      notification: null,
      sidebarCollapsed: false,
      isDarkMode: true,
    }),
}));
