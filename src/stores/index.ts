// Central exports for all stores
export { useSettingsStore } from './settingsStore';
export { useUIStore } from './uiStore';
export { usePreferencesStore } from './preferencesStore';

// Store initialization utility
import { useSettingsStore } from './settingsStore';

export const initializeStores = () => {
  // Initialize last activity on app start
  const { updateLastActivity, clearExpiredSession } =
    useSettingsStore.getState();
  updateLastActivity();
  clearExpiredSession();
};
