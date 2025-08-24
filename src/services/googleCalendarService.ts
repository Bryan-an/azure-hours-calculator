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
      this.logSecurityEvent('token_refresh_attempted', { 
        reason: 'token_expired'
      });
      
      // Clear expired tokens to force re-authentication
      const { StorageUtil } = await import('../utils/storage');
      StorageUtil.clearGoogleAuth();
      
      throw new Error('Token expirado. Por favor, vuelve a autenticarte en Configuración.');
    } catch (error) {
      this.logSecurityEvent('token_refresh_failed', { 
        error: 'failed'
      });
      throw error;
    }
  }

  private logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      // Remove sensitive details from logging
      details: {
        eventsCount: details.eventsCount,
        filteredEventsCount: details.filteredEventsCount,
        error: details.error ? 'Error occurred' : undefined,
        status: details.status
      }
    };
    
    // Store in localStorage for audit trail (without sensitive data)
    const existingLogs = JSON.parse(localStorage.getItem('google_calendar_audit_log') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 50 entries
    const recentLogs = existingLogs.slice(-50);
    localStorage.setItem('google_calendar_audit_log', JSON.stringify(recentLogs));
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
      // Connection test failed
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
      // Error fetching calendar list
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
    // API status check without logging sensitive information
  }

  static isElectron(): boolean {
    return !!(window as any).require || !!(window as any).electronAPI || navigator.userAgent.includes('Electron');
  }

  static async waitForGoogleAPI(maxWaitMs = 10000): Promise<boolean> {
    const startTime = Date.now();
    const isElectron = this.isElectron();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (window.gapi && window.gapi.load) {
        if (isElectron) {
          return true;
        } else {
          if ((window as any).google && (window as any).google.accounts) {
            return true;
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return false;
  }

  static async initializeGapi(): Promise<void> {
    const isElectron = this.isElectron();
    
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

            if (isElectron) {
              resolve();
            } else {
              if (!(window as any).google || !(window as any).google.accounts) {
                throw new Error('Google Identity Services not loaded');
              }

              this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: '',
              });

              resolve();
            }
          } catch (error: any) {
            if (isElectron) {
              resolve();
            } else {
              reject(error);
            }
          }
        },
        onerror: () => {
          // Error loading Google API libraries
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
      const isElectron = this.isElectron();

      if (isElectron) {
        return await this.signInElectron();
      } else {
        if (!this.tokenClient) {
          throw new Error('Failed to initialize Google token client');
        }
        
        return new Promise((resolve, reject) => {
          this.tokenClient.callback = (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google'));
            }
          };

          this.tokenClient.requestAccessToken();
        });
      }
    } catch (error: any) {
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
      
      throw new Error(`Error al autenticar con Google Calendar: ${error.message || 'Error desconocido'}`);
    }
  }

  static async signOut(): Promise<void> {
    try {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.oauth2) {
        (window as any).google.accounts.oauth2.revoke('', () => {});
      }
    } catch (error) {
      // Sign-out error handled silently
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

  // Electron-specific OAuth flow using popup window
  static async signInElectron(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use a simpler redirect that doesn't conflict with GIS
      const redirectUri = 'http://localhost:3000/oauth-callback.html';
      const scope = encodeURIComponent(this.SCOPES);
      const responseType = 'token';
      const state = Math.random().toString(36).substring(2, 15);
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `response_type=${responseType}&` +
        `state=${state}&` +
        `include_granted_scopes=true`;

      
      // Create a popup window for OAuth
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup bloqueado por el navegador. Habilita popups para este sitio.'));
        return;
      }

      // Monitor the popup for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Autenticación cancelada por el usuario'));
        }
      }, 1000);

      // Listen for the OAuth callback
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth-callback') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);

          if (event.data.error) {
            reject(new Error(event.data.error_description || event.data.error));
          } else if (event.data.access_token) {
            resolve(event.data.access_token);
          } else {
            reject(new Error('No access token received from Google'));
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Fallback: try to detect URL changes in popup
      const urlChecker = setInterval(() => {
        try {
          if (popup.location && popup.location.href.includes('access_token=')) {
            clearInterval(urlChecker);
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);

            const url = new URL(popup.location.href);
            const hash = new URLSearchParams(url.hash.substring(1));
            const accessToken = hash.get('access_token');

            popup.close();

            if (accessToken) {
              resolve(accessToken);
            } else {
              reject(new Error('No access token found in OAuth response'));
            }
          }
        } catch (e) {
          // Cross-origin access denied - this is expected until the redirect
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        clearInterval(urlChecker);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Timeout de autenticación'));
      }, 300000);
    });
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}