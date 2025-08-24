import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkSchedule, CalendarSource } from '../types';

interface SecuritySettings {
  sessionTimeoutMinutes: number;
  lastActivityTimestamp: number;
  autoLogoutEnabled: boolean;
}

interface GoogleAuthData {
  clientId: string | null;
  accessToken: string | null;
  calendarId: string | null;
  tokenExpiresAt: number | null;
}

interface SettingsState {
  // Core work schedule
  workSchedule: WorkSchedule;

  // API keys and configurations
  calendarificApiKey: string | null;
  icalUrl: string | null;
  calendarSource: CalendarSource;

  // Google Calendar authentication
  googleAuth: GoogleAuthData;

  // Security settings
  securitySettings: SecuritySettings;

  // Actions
  setWorkSchedule: (schedule: WorkSchedule) => void;
  setCalendarificApiKey: (apiKey: string | null) => void;
  setICalUrl: (url: string | null) => void;
  setCalendarSource: (source: CalendarSource) => void;
  setGoogleAuth: (auth: Partial<GoogleAuthData>) => void;
  clearGoogleAuth: () => void;
  setSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateLastActivity: () => void;
  isSessionExpired: () => boolean;
  clearExpiredSession: () => void;
  clearAllData: () => void;
}

const getDefaultWorkSchedule = (): WorkSchedule => ({
  startTime: '08:30',
  endTime: '17:30',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  workDays: [1, 2, 3, 4, 5], // Lunes a Viernes
});

const getDefaultSecuritySettings = (): SecuritySettings => ({
  sessionTimeoutMinutes: 480, // 8 hours default
  lastActivityTimestamp: Date.now(),
  autoLogoutEnabled: true,
});

const getDefaultGoogleAuth = (): GoogleAuthData => ({
  clientId: null,
  accessToken: null,
  calendarId: null,
  tokenExpiresAt: null,
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      workSchedule: getDefaultWorkSchedule(),
      calendarificApiKey: null,
      icalUrl: null,
      calendarSource: 'none',
      googleAuth: getDefaultGoogleAuth(),
      securitySettings: getDefaultSecuritySettings(),

      // Actions
      setWorkSchedule: (schedule) => set({ workSchedule: schedule }),

      setCalendarificApiKey: (apiKey) => set({ calendarificApiKey: apiKey }),

      setICalUrl: (url) => set({ icalUrl: url }),

      setCalendarSource: (source) => set({ calendarSource: source }),

      setGoogleAuth: (auth) =>
        set((state) => ({
          googleAuth: { ...state.googleAuth, ...auth },
        })),

      clearGoogleAuth: () =>
        set({
          googleAuth: {
            ...getDefaultGoogleAuth(),
            clientId: get().googleAuth.clientId, // Preserve client ID
          },
        }),

      setSecuritySettings: (settings) =>
        set((state) => ({
          securitySettings: { ...state.securitySettings, ...settings },
        })),

      updateLastActivity: () =>
        set((state) => ({
          securitySettings: {
            ...state.securitySettings,
            lastActivityTimestamp: Date.now(),
          },
        })),

      isSessionExpired: () => {
        const { securitySettings } = get();
        if (!securitySettings.autoLogoutEnabled) return false;

        const now = Date.now();
        const timeoutMs = securitySettings.sessionTimeoutMinutes * 60 * 1000;
        return now - securitySettings.lastActivityTimestamp > timeoutMs;
      },

      clearExpiredSession: () => {
        if (get().isSessionExpired()) {
          get().clearGoogleAuth();

          // Log security event
          const securityLog = {
            event: 'session_expired',
            timestamp: new Date().toISOString(),
            details: { reason: 'timeout' },
          };

          const existingLogs = JSON.parse(
            localStorage.getItem('security_events_log') || '[]'
          );
          existingLogs.push(securityLog);
          localStorage.setItem(
            'security_events_log',
            JSON.stringify(existingLogs.slice(-50))
          );
        }
      },

      clearAllData: () => {
        set({
          workSchedule: getDefaultWorkSchedule(),
          calendarificApiKey: null,
          icalUrl: null,
          calendarSource: 'none',
          googleAuth: getDefaultGoogleAuth(),
          securitySettings: getDefaultSecuritySettings(),
        });
      },
    }),
    {
      name: 'azure-hours-settings', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      // Persist everything except security.lastActivityTimestamp which should be managed separately
      partialize: (state) => ({
        workSchedule: state.workSchedule,
        calendarificApiKey: state.calendarificApiKey,
        icalUrl: state.icalUrl,
        calendarSource: state.calendarSource,
        googleAuth: state.googleAuth,
        securitySettings: {
          sessionTimeoutMinutes: state.securitySettings.sessionTimeoutMinutes,
          autoLogoutEnabled: state.securitySettings.autoLogoutEnabled,
          // Don't persist lastActivityTimestamp - it should be set fresh on app start
        },
      }),
    }
  )
);
