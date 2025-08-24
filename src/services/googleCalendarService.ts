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

// Helper class for Google OAuth authentication using Google Identity Services (GIS)
export class GoogleAuthHelper {
  private static CLIENT_ID: string | null = null;
  private static SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
  private static tokenClient: any = null;

  static setClientId(clientId: string) {
    this.CLIENT_ID = clientId;
  }

  static diagnoseGoogleAPI(): void {
    console.log('=== Google API Diagnosis (GIS) ===');
    console.log('Client ID configured:', !!this.CLIENT_ID);
    console.log('Client ID value:', this.CLIENT_ID ? `${this.CLIENT_ID.substring(0, 10)}...` : 'Not set');
    console.log('window.gapi available:', !!window.gapi);
    console.log('window.google available:', !!(window as any).google);
    
    if (window.gapi) {
      console.log('gapi.client available:', !!window.gapi.client);
      console.log('gapi.load function:', typeof window.gapi.load);
    }

    if ((window as any).google) {
      console.log('google.accounts available:', !!((window as any).google.accounts));
      if ((window as any).google.accounts) {
        console.log('google.accounts.oauth2 available:', !!((window as any).google.accounts.oauth2));
      }
    }
    console.log('Token client initialized:', !!this.tokenClient);
    console.log('================================');
  }

  static async waitForGoogleAPI(maxWaitMs = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (window.gapi && window.gapi.load && (window as any).google && (window as any).google.accounts) {
        console.log('Google APIs (GAPI + GIS) are ready');
        return true;
      }
      console.log('Waiting for Google APIs to load...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.error('Google APIs failed to load within timeout');
    return false;
  }

  static async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API library not loaded. Please check internet connection.'));
        return;
      }

      if (!this.CLIENT_ID) {
        reject(new Error('Google Client ID not configured'));
        return;
      }

      // Load client library for API calls
      window.gapi.load('client', {
        callback: async () => {
          try {
            // Initialize client for API calls
            await window.gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            });

            // Initialize Google Identity Services token client
            if (!(window as any).google || !(window as any).google.accounts) {
              throw new Error('Google Identity Services not loaded');
            }

            this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
              client_id: this.CLIENT_ID,
              scope: this.SCOPES,
              callback: '', // Will be set in signIn method
            });

            console.log('Google API and GIS initialized successfully');
            resolve();
          } catch (error: any) {
            console.error('Error initializing Google API/GIS:', error);
            console.error('Initialization error details:', {
              message: error.message,
              stack: error.stack,
              clientId: this.CLIENT_ID,
              gapiLoaded: !!window.gapi,
              googleLoaded: !!((window as any).google),
              accountsLoaded: !!((window as any).google && (window as any).google.accounts),
              clientAvailable: !!(window.gapi && window.gapi.client)
            });
            reject(error);
          }
        },
        onerror: (error: any) => {
          console.error('Error loading Google API libraries:', error);
          reject(new Error('Failed to load Google API libraries'));
        },
      });
    });
  }

  static async signIn(): Promise<string> {
    if (!this.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    try {
      // Wait for Google APIs to be available
      const isReady = await this.waitForGoogleAPI();
      if (!isReady) {
        throw new Error('Google API libraries are not available. Please check your internet connection.');
      }

      await this.initializeGapi();
      
      if (!this.tokenClient) {
        throw new Error('Failed to initialize Google token client');
      }

      console.log('Starting Google sign-in process with GIS...');
      
      return new Promise((resolve, reject) => {
        // Set the callback for token response
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            console.error('Token response error:', response);
            reject(new Error(response.error_description || response.error));
            return;
          }
          
          if (response.access_token) {
            console.log('Google sign-in successful with GIS');
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received from Google'));
          }
        };

        // Request access token
        this.tokenClient.requestAccessToken();
      });
    } catch (error: any) {
      console.error('Error during Google sign-in:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor?.name);
      console.error('Error keys:', Object.keys(error || {}));
      
      // Log all error properties for debugging
      if (error) {
        console.log('Error properties:', {
          message: error.message,
          error: error.error,
          details: error.details,
          code: error.code,
          status: error.status,
          stack: error.stack
        });
      }
      
      // Provide more specific error messages
      if (error.message?.includes('popup_closed_by_user')) {
        throw new Error('Autenticación cancelada por el usuario');
      } else if (error.message?.includes('popup_blocked')) {
        throw new Error('Popup bloqueado por el navegador. Habilita popups para este sitio.');
      } else if (error.message?.includes('invalid_client')) {
        throw new Error('Client ID inválido. Verifica la configuración en Google Cloud Console.');
      } else if (error.message?.includes('Client ID not configured')) {
        throw new Error('Client ID no configurado. Ingresa tu Client ID en la configuración.');
      } else if (error.message?.includes('Google API library not loaded')) {
        throw new Error('Bibliotecas de Google no cargadas. Verifica tu conexión a internet.');
      } else if (error.message?.includes('Google Identity Services not loaded')) {
        throw new Error('Google Identity Services no cargado. Verifica tu conexión a internet.');
      }
      
      // If we have specific error details, include them
      const errorDetails = error.details || error.error || error.message || JSON.stringify(error);
      throw new Error(`Error al autenticar con Google Calendar: ${errorDetails}`);
    }
  }

  static async signOut(): Promise<void> {
    try {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.oauth2) {
        (window as any).google.accounts.oauth2.revoke('', () => {
          console.log('Access token revoked');
        });
      }
    } catch (error) {
      console.error('Error during Google sign-out:', error);
    }
  }

  static isSignedIn(): boolean {
    // With GIS, we don't have a persistent sign-in state
    // This would need to be managed by storing token info
    return false;
  }

  static getCurrentAccessToken(): string | null {
    // With GIS, tokens are managed differently
    // This would need to be implemented based on token storage
    return null;
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}