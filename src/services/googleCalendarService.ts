import axios from 'axios';
import { Meeting } from '../types';

const GOOGLE_CALENDAR_API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

export interface GoogleAuthConfig {
  accessToken: string;
  calendarId?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export class GoogleCalendarService {
  private accessToken: string;
  private calendarId: string;
  private refreshToken?: string;
  private expiresAt?: number;

  constructor(config: GoogleAuthConfig) {
    this.accessToken = config.accessToken;
    this.calendarId = config.calendarId || 'primary';
    this.refreshToken = config.refreshToken;
    this.expiresAt = config.expiresAt;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.expiresAt) return;

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    if (now + bufferTime >= this.expiresAt) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.logSecurityEvent('token_refresh_no_refresh_token', {
        reason: 'missing_refresh_token',
        action: 'requiring_reauth',
      });

      throw new Error('Re-autenticación requerida en Configuración.');
    }

    try {
      // Log attempt but don't actually refresh for security reasons
      this.logSecurityEvent('token_refresh_not_implemented', {
        reason: 'security_design_choice',
        action: 'clearing_expired_tokens',
        hasRefreshToken: !!this.refreshToken,
        tokenExpiresAt: this.expiresAt,
      });

      // Clear expired tokens to force fresh authentication
      const { useSettingsStore } = await import('../stores/settingsStore');
      useSettingsStore.getState().clearGoogleAuth();

      throw new Error(
        'Token expirado. Ve a Configuración → Google Calendar para re-autenticarte.'
      );
    } catch (error) {
      // Log the specific error but don't expose sensitive details
      this.logSecurityEvent('token_refresh_process_error', {
        error: error instanceof Error ? error.message : 'unknown_error',
        step: 'token_cleanup',
      });

      throw error;
    }
  }

  private logSecurityEvent(
    event: string,
    details: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      // Remove sensitive details from logging
      details: {
        eventsCount: details.eventsCount,
        filteredEventsCount: details.filteredEventsCount,
        error: details.error ? 'Error occurred' : undefined,
        status: details.status,
      },
    };

    // Store in localStorage for audit trail (without sensitive data)
    const existingLogs = JSON.parse(
      localStorage.getItem('google_calendar_audit_log') || '[]'
    );

    existingLogs.push(logEntry);

    // Keep only last 50 entries
    const recentLogs = existingLogs.slice(-50);

    localStorage.setItem(
      'google_calendar_audit_log',
      JSON.stringify(recentLogs)
    );
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Meeting[]> {
    if (!this.accessToken) {
      this.logSecurityEvent('access_attempt_no_token', {});
      return [];
    }

    try {
      await this.ensureValidToken();

      this.logSecurityEvent('calendar_access_start', {});

      const response = await axios.get(
        `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${this.calendarId}/events`,
        {
          params: {
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
          },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const mappedEvents = response.data.items
        .map((event: unknown): Meeting => {
          const eventObj = event as Record<string, any>;

          // Handle all-day events and timed events
          const startDateTime = eventObj.start?.dateTime
            ? new Date(eventObj.start.dateTime)
            : new Date(eventObj.start?.date);

          const endDateTime = eventObj.end?.dateTime
            ? new Date(eventObj.end.dateTime)
            : new Date(eventObj.end?.date);

          // Determine if the event is optional based on attendee response or event status
          const isOptional = this.determineIfEventIsOptional(eventObj);

          return {
            id: eventObj.id,
            title: eventObj.summary || 'Sin título',
            start: startDateTime,
            end: endDateTime,
            isOptional: isOptional,
          };
        })
        .filter((event: Meeting) => {
          // Filter out all-day events if they don't have specific times
          const isAllDay =
            event.start.getHours() === 0 &&
            event.start.getMinutes() === 0 &&
            event.end.getHours() === 0 &&
            event.end.getMinutes() === 0;

          return !isAllDay;
        });

      this.logSecurityEvent('calendar_access_success', {
        eventsCount: response.data.items.length,
        filteredEventsCount: mappedEvents.length,
      });

      return mappedEvents;
    } catch (error) {
      this.logSecurityEvent('calendar_access_error', {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
      });

      console.error('Error fetching events from Google Calendar:', error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Clear invalid token
        const { useSettingsStore } = await import('../stores/settingsStore');
        useSettingsStore.getState().clearGoogleAuth();

        throw new Error(
          'Token de acceso de Google Calendar expirado o inválido'
        );
      }

      return [];
    }
  }

  private determineIfEventIsOptional(event: Record<string, unknown>): boolean {
    // Check if the current user has declined the event
    const attendees = (event.attendees as Array<Record<string, unknown>>) || [];

    const currentUserAttendee = attendees.find(
      (attendee) => (attendee as { self?: boolean }).self === true
    );

    if (currentUserAttendee) {
      return (
        (currentUserAttendee as { responseStatus?: string }).responseStatus ===
        'declined'
      );
    }

    // Check event transparency (if marked as 'transparent', it's like optional)
    if (event.transparency === 'transparent') {
      return true;
    }

    // Check if event status is cancelled
    if (event.status === 'cancelled') {
      return true;
    }

    // Default to non-optional (mandatory)
    return false;
  }

  async testConnection(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      await axios.get(
        `${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${this.calendarId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return true;
    } catch {
      // Connection test failed
      return false;
    }
  }

  async getCalendarList(): Promise<Array<{ id: string; summary: string }>> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await axios.get(
        `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.items.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary || calendar.id,
      }));
    } catch {
      // Error fetching calendar list
      return [];
    }
  }
}
