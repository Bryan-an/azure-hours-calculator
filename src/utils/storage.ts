import { WorkSchedule } from '../types';

const STORAGE_KEYS = {
  WORK_SCHEDULE: 'workSchedule',
  GOOGLE_CLIENT_ID: 'googleClientId',
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_CALENDAR_ID: 'googleCalendarId',
  CALENDARIFIC_API_KEY: 'calendarificApiKey',
} as const;

export class StorageUtil {
  static saveWorkSchedule(schedule: WorkSchedule): void {
    localStorage.setItem(STORAGE_KEYS.WORK_SCHEDULE, JSON.stringify(schedule));
  }

  static loadWorkSchedule(): WorkSchedule | null {
    const stored = localStorage.getItem(STORAGE_KEYS.WORK_SCHEDULE);
    if (stored) {
      try {
        return JSON.parse(stored) as WorkSchedule;
      } catch (error) {
        console.error('Error parsing stored work schedule:', error);
      }
    }
    return null;
  }

  static getDefaultWorkSchedule(): WorkSchedule {
    return {
      startTime: '08:30',
      endTime: '17:30',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      workDays: [1, 2, 3, 4, 5], // Lunes a Viernes
    };
  }

  static saveGoogleClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, clientId);
  }

  static loadGoogleClientId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
  }

  static saveGoogleAccessToken(accessToken: string): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN, accessToken);
  }

  static loadGoogleAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
  }

  static saveGoogleCalendarId(calendarId: string): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_CALENDAR_ID, calendarId);
  }

  static loadGoogleCalendarId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_CALENDAR_ID);
  }

  static clearGoogleAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_CALENDAR_ID);
  }

  static saveCalendarificApiKey(apiKey: string): void {
    localStorage.setItem(STORAGE_KEYS.CALENDARIFIC_API_KEY, apiKey);
  }

  static loadCalendarificApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CALENDARIFIC_API_KEY);
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}