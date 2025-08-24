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
      throw new Error('No refresh token available. Re-authentication required.');
    }

    try {
      // Note: This would require implementing token refresh endpoint
      // For now, we'll log the attempt and clear tokens for re-auth
      console.warn('Token refresh needed. Please re-authenticate.');
      this.logSecurityEvent('token_refresh_attempted', { 
        timestamp: new Date().toISOString(),
        reason: 'token_expired'
      });
      
      // Clear expired tokens to force re-authentication
      const { StorageUtil } = await import('../utils/storage');
      StorageUtil.clearGoogleAuth();
      
      throw new Error('Token expirado. Por favor, vuelve a autenticarte en Configuración.');
    } catch (error) {
      this.logSecurityEvent('token_refresh_failed', { 
        error: error instanceof Error ? error.message : 'unknown',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  private logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        calendarId: this.calendarId,
      }
    };
    
    // Store in localStorage for audit trail
    const existingLogs = JSON.parse(localStorage.getItem('google_calendar_audit_log') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 entries
    const recentLogs = existingLogs.slice(-100);
    localStorage.setItem('google_calendar_audit_log', JSON.stringify(recentLogs));
    
    // Also log to console for development
    console.log(`[SECURITY] ${event}:`, logEntry);
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Meeting[]> {
    if (!this.accessToken) {
      this.logSecurityEvent('access_attempt_no_token', { 
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() }
      });
      console.warn('Google Calendar access token not configured');
      return [];
    }

    try {
      await this.ensureValidToken();
      
      this.logSecurityEvent('calendar_access_start', {
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        calendarId: this.calendarId
      });
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
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const mappedEvents = response.data.items.map((event: any): Meeting => {
        // Handle all-day events and timed events
        const startDateTime = event.start.dateTime 
          ? new Date(event.start.dateTime)
          : new Date(event.start.date);
        
        const endDateTime = event.end.dateTime
          ? new Date(event.end.dateTime)
          : new Date(event.end.date);

        // Determine if the event is optional based on attendee response or event status
        const isOptional = this.determineIfEventIsOptional(event);

        return {
          id: event.id,
          title: event.summary || 'Sin título',
          start: startDateTime,
          end: endDateTime,
          isOptional: isOptional,
        };
      }).filter((event: Meeting) => {
        // Filter out all-day events if they don't have specific times
        const isAllDay = event.start.getHours() === 0 && 
                         event.start.getMinutes() === 0 && 
                         event.end.getHours() === 0 && 
                         event.end.getMinutes() === 0;
        return !isAllDay;
      });

      this.logSecurityEvent('calendar_access_success', {
        eventsCount: response.data.items.length,
        filteredEventsCount: mappedEvents.length
      });

      return mappedEvents;
    } catch (error) {
      this.logSecurityEvent('calendar_access_error', {
        error: error instanceof Error ? error.message : 'unknown',
        isAxiosError: axios.isAxiosError(error),
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });
      
      console.error('Error fetching events from Google Calendar:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Clear invalid token
        const { StorageUtil } = await import('../utils/storage');
        StorageUtil.clearGoogleAuth();
        throw new Error('Token de acceso de Google Calendar expirado o inválido');
      }
      return [];
    }
  }

  private determineIfEventIsOptional(event: any): boolean {
    // Check if the current user has declined the event
    const attendees = event.attendees || [];
    const currentUserAttendee = attendees.find((attendee: any) => attendee.self === true);
    
    if (currentUserAttendee) {
      return currentUserAttendee.responseStatus === 'declined';
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
      await axios.get(`${GOOGLE_CALENDAR_API_BASE_URL}/calendars/${this.calendarId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return true;
    } catch (error) {
      console.error('Error testing Google Calendar connection:', error);
      return false;
    }
  }

  async getCalendarList(): Promise<Array<{id: string, summary: string}>> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await axios.get(
        `${GOOGLE_CALENDAR_API_BASE_URL}/users/me/calendarList`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.items.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary || calendar.id,
      }));
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      return [];
    }
  }
}

// Helper class for Google OAuth authentication
export class GoogleAuthHelper {
  private static CLIENT_ID: string | null = null;
  private static SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  static setClientId(clientId: string) {
    this.CLIENT_ID = clientId;
  }

  static async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API library not loaded'));
        return;
      }

      window.gapi.load('auth2', {
        callback: () => {
          window.gapi.auth2.init({
            client_id: this.CLIENT_ID,
          }).then(() => {
            resolve();
          }).catch(reject);
        },
        onerror: reject,
      });
    });
  }

  static async signIn(): Promise<string> {
    if (!this.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    try {
      await this.initializeGapi();
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn({
        scope: this.SCOPES,
      });
      
      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      throw new Error('Error al autenticar con Google Calendar');
    }
  }

  static async signOut(): Promise<void> {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Error during Google sign-out:', error);
    }
  }

  static isSignedIn(): boolean {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      return false;
    }
  }

  static getCurrentAccessToken(): string | null {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    } catch (error) {
      return null;
    }
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}