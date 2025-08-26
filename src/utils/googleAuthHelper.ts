import { electronUtils } from './electronUtils';

// Extend window interface for TypeScript
declare global {
  interface Window {
    gapi: any;
  }
}

/**
 * Helper class for Google OAuth authentication and Google Calendar API integration.
 * Supports both Electron and web browser environments with different authentication flows.
 *
 * @example
 * ```typescript
 * // Set the Google Client ID
 * GoogleAuthHelper.setClientId('your-google-client-id');
 *
 * // Sign in and get access token
 * try {
 *   const accessToken = await GoogleAuthHelper.signIn();
 *   console.log('Signed in successfully:', accessToken);
 * } catch (error) {
 *   console.error('Sign in failed:', error);
 * }
 *
 * // Sign out
 * await GoogleAuthHelper.signOut();
 * ```
 *
 * @public
 */
export class GoogleAuthHelper {
  /** Google Client ID for OAuth authentication */
  private static CLIENT_ID: string | null = null;

  /** Google Calendar API scopes for read-only access */
  private static SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  /** Google OAuth token client for web browser authentication */
  private static tokenClient: any = null;

  /**
   * Sets the Google Client ID for OAuth authentication.
   * This must be called before attempting to sign in.
   *
   * @param clientId - The Google OAuth Client ID from Google Cloud Console
   *
   * @example
   * ```typescript
   * GoogleAuthHelper.setClientId('123456789-abc123def456.apps.googleusercontent.com');
   * ```
   *
   * @public
   */
  static setClientId(clientId: string): void {
    this.CLIENT_ID = clientId;
  }

  /**
   * Checks if the application is running in an Electron environment.
   *
   * @returns True if running in Electron, false if running in a web browser
   *
   * @example
   * ```typescript
   * if (GoogleAuthHelper.isElectron()) {
   *   console.log('Running in Electron');
   * } else {
   *   console.log('Running in web browser');
   * }
   * ```
   *
   * @public
   */
  static isElectron(): boolean {
    return electronUtils.isElectron();
  }

  /**
   * Waits for Google API libraries to be loaded and available.
   * Polls for the presence of required Google API objects with a timeout.
   *
   * @param maxWaitMs - Maximum time to wait in milliseconds (default: 10000)
   * @returns Promise that resolves to true if APIs are available, false if timeout reached
   *
   * @example
   * ```typescript
   * const isReady = await GoogleAuthHelper.waitForGoogleAPI(5000);
   * if (isReady) {
   *   console.log('Google APIs are ready');
   * } else {
   *   console.log('Timeout waiting for Google APIs');
   * }
   * ```
   *
   * @public
   */
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

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
  }

  /**
   * Initializes Google API client libraries and authentication services.
   * Sets up different authentication flows depending on the environment (Electron vs web).
   *
   * @returns Promise that resolves when initialization is complete
   * @throws Error if Google API libraries are not loaded or Client ID is not configured
   *
   * @example
   * ```typescript
   * try {
   *   await GoogleAuthHelper.initializeGapi();
   *   console.log('Google API initialized successfully');
   * } catch (error) {
   *   console.error('Failed to initialize Google API:', error);
   * }
   * ```
   *
   * @public
   */
  static async initializeGapi(): Promise<void> {
    const isElectron = this.isElectron();

    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(
          new Error(
            'Google API library not loaded. Please check internet connection.'
          )
        );

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
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
              ],
            });

            if (isElectron) {
              resolve();
            } else {
              if (!(window as any).google || !(window as any).google.accounts) {
                throw new Error('Google Identity Services not loaded');
              }

              this.tokenClient = (
                window as any
              ).google.accounts.oauth2.initTokenClient({
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

  /**
   * Initiates the Google OAuth sign-in flow and returns an access token.
   * Uses different authentication methods based on the environment:
   * - Electron: Uses popup window with OAuth flow
   * - Web browser: Uses Google Identity Services token client
   *
   * @returns Promise that resolves to the access token string
   * @throws Error if authentication fails or is cancelled by user
   *
   * @example
   * ```typescript
   * try {
   *   const accessToken = await GoogleAuthHelper.signIn();
   *   console.log('Access token obtained:', accessToken);
   * } catch (error) {
   *   if (error.message.includes('cancelada')) {
   *     console.log('User cancelled authentication');
   *   } else {
   *     console.error('Sign in error:', error);
   *   }
   * }
   * ```
   *
   * @public
   */
  static async signIn(): Promise<string> {
    if (!this.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    try {
      // Wait for Google APIs to be available
      const isReady = await this.waitForGoogleAPI();

      if (!isReady) {
        throw new Error(
          'Google API libraries are not available. Please check your internet connection.'
        );
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
        throw new Error(
          'Popup bloqueado por el navegador. Habilita popups para este sitio.'
        );
      } else if (error.message?.includes('invalid_client')) {
        throw new Error(
          'Client ID inválido. Verifica la configuración en Google Cloud Console.'
        );
      } else if (error.message?.includes('Client ID not configured')) {
        throw new Error(
          'Client ID no configurado. Ingresa tu Client ID en la configuración.'
        );
      } else if (error.message?.includes('Google API library not loaded')) {
        throw new Error(
          'Bibliotecas de Google no cargadas. Verifica tu conexión a internet.'
        );
      } else if (
        error.message?.includes('Google Identity Services not loaded')
      ) {
        throw new Error(
          'Google Identity Services no cargado. Verifica tu conexión a internet.'
        );
      }

      throw new Error(
        `Error al autenticar con Google Calendar: ${error.message || 'Error desconocido'}`
      );
    }
  }

  /**
   * Signs out the user from Google OAuth.
   * Revokes the current OAuth token if Google Identity Services is available.
   * Errors are handled silently to prevent sign-out interruption.
   *
   * @returns Promise that resolves when sign-out is complete
   *
   * @example
   * ```typescript
   * await GoogleAuthHelper.signOut();
   * console.log('User signed out successfully');
   * ```
   *
   * @public
   */
  static async signOut(): Promise<void> {
    try {
      if (
        (window as any).google &&
        (window as any).google.accounts &&
        (window as any).google.accounts.oauth2
      ) {
        (window as any).google.accounts.oauth2.revoke('', () => {});
      }
    } catch {
      // Sign-out error handled silently
    }
  }

  /**
   * Electron-specific OAuth authentication flow using a popup window.
   * Opens a popup window with the Google OAuth URL and waits for the callback.
   * Monitors the popup for completion, cancellation, or timeout.
   *
   * @returns Promise that resolves to the access token string
   * @throws Error if popup is blocked, authentication is cancelled, or timeout occurs
   *
   * @example
   * ```typescript
   * // This method is called internally by signIn() when in Electron environment
   * const token = await GoogleAuthHelper.signInElectron();
   * ```
   *
   * @remarks
   * This method is automatically called by {@link GoogleAuthHelper.signIn} when running in Electron.
   * It should not be called directly unless you specifically need Electron-style authentication.
   *
   * @internal
   * @public
   */
  static async signInElectron(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use a simpler redirect that doesn't conflict with GIS
      const redirectUri = 'http://localhost:3000/oauth-callback.html';
      const scope = encodeURIComponent(this.SCOPES);
      const responseType = 'token';
      const state = Math.random().toString(36).substring(2, 15);

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
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
        reject(
          new Error(
            'Popup bloqueado por el navegador. Habilita popups para este sitio.'
          )
        );

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
        } catch {
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
