import { WorkSchedule } from '../types';

const STORAGE_KEYS = {
  WORK_SCHEDULE: 'workSchedule',
  GOOGLE_CLIENT_ID: 'googleClientId',
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_CALENDAR_ID: 'googleCalendarId',
  GOOGLE_TOKEN_EXPIRES_AT: 'googleTokenExpiresAt',
  ICAL_URL: 'icalUrl',
  CALENDAR_SOURCE: 'calendarSource',
  CALENDARIFIC_API_KEY: 'calendarificApiKey',
  SECURITY_SETTINGS: 'securitySettings',
} as const;

interface SecuritySettings {
  sessionTimeoutMinutes: number;
  lastActivityTimestamp: number;
  autoLogoutEnabled: boolean;
}

export type CalendarSource = 'google' | 'ical' | 'none';

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

  static saveGoogleTokenExpiresAt(expiresAt: number): void {
    localStorage.setItem(
      STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT,
      expiresAt.toString()
    );
  }

  static loadGoogleTokenExpiresAt(): number | null {
    const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT);
    return stored ? parseInt(stored, 10) : null;
  }

  static clearGoogleAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_CALENDAR_ID);
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKEN_EXPIRES_AT);
  }

  // Security settings management
  static getDefaultSecuritySettings(): SecuritySettings {
    return {
      sessionTimeoutMinutes: 480, // 8 hours default
      lastActivityTimestamp: Date.now(),
      autoLogoutEnabled: true,
    };
  }

  static saveSecuritySettings(settings: SecuritySettings): void {
    localStorage.setItem(
      STORAGE_KEYS.SECURITY_SETTINGS,
      JSON.stringify(settings)
    );
  }

  static loadSecuritySettings(): SecuritySettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SECURITY_SETTINGS);
    if (stored) {
      try {
        return { ...this.getDefaultSecuritySettings(), ...JSON.parse(stored) };
      } catch (error) {
        console.error('Error parsing security settings:', error);
      }
    }
    return this.getDefaultSecuritySettings();
  }

  static updateLastActivity(): void {
    const settings = this.loadSecuritySettings();
    settings.lastActivityTimestamp = Date.now();
    this.saveSecuritySettings(settings);
  }

  static isSessionExpired(): boolean {
    const settings = this.loadSecuritySettings();
    if (!settings.autoLogoutEnabled) return false;

    const now = Date.now();
    const timeoutMs = settings.sessionTimeoutMinutes * 60 * 1000;
    return now - settings.lastActivityTimestamp > timeoutMs;
  }

  static clearExpiredSession(): void {
    if (this.isSessionExpired()) {
      this.clearGoogleAuth();
      // Log security event
      // Session expired and cleared
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
  }

  // iCal configuration
  static saveICalUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.ICAL_URL, url);
  }

  static loadICalUrl(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ICAL_URL);
  }

  // Calendar source selection
  static saveCalendarSource(source: CalendarSource): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_SOURCE, source);
  }

  static loadCalendarSource(): CalendarSource {
    const stored = localStorage.getItem(
      STORAGE_KEYS.CALENDAR_SOURCE
    ) as CalendarSource;
    return stored || 'none';
  }

  static saveCalendarificApiKey(apiKey: string): void {
    localStorage.setItem(STORAGE_KEYS.CALENDARIFIC_API_KEY, apiKey);
  }

  static loadCalendarificApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CALENDARIFIC_API_KEY);
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}
