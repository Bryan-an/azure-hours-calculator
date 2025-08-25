import { create } from 'zustand';
import toast from 'react-hot-toast';
import React from 'react';
import WarningIcon from '@mui/icons-material/Warning';

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

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setHolidaySelectionOpen: (open: boolean) => void;
  setEventSelectionOpen: (open: boolean) => void;
  setCalculating: (calculating: boolean) => void;
  setLoadingHolidays: (loading: boolean) => void;
  setLoadingEvents: (loading: boolean) => void;
  setSavingSettings: (saving: boolean) => void;

  // Global toast notifications (system-wide)
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
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

  // Actions
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setHolidaySelectionOpen: (open) => set({ holidaySelectionOpen: open }),

  setEventSelectionOpen: (open) => set({ eventSelectionOpen: open }),

  setCalculating: (calculating) => set({ isCalculating: calculating }),

  setLoadingHolidays: (loading) => set({ isLoadingHolidays: loading }),

  setLoadingEvents: (loading) => set({ isLoadingEvents: loading }),

  setSavingSettings: (saving) => set({ isSavingSettings: saving }),

  // Global toast notifications (system-wide events)
  showToast: (message, type) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast(message, {
          icon: React.createElement(WarningIcon, {
            color: 'warning',
          }),
        });
        break;
      default:
        toast(message);
    }
  },

  resetUIState: () =>
    set({
      settingsOpen: false,
      holidaySelectionOpen: false,
      eventSelectionOpen: false,
      isCalculating: false,
      isLoadingHolidays: false,
      isLoadingEvents: false,
      isSavingSettings: false,
    }),
}));
