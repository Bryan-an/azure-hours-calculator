import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAuthHelper } from '../googleAuthHelper';
import * as electronUtilsModule from '../electronUtils';

// Mock electronUtils
vi.mock('../electronUtils', () => ({
  electronUtils: {
    isElectron: vi.fn(),
  },
}));

describe('GoogleAuthHelper', () => {
  beforeEach(() => {
    // Reset all static properties
    (GoogleAuthHelper as any).CLIENT_ID = null;
    (GoogleAuthHelper as any).tokenClient = null;

    // Clear all mocks
    vi.clearAllMocks();

    // Reset window properties
    delete (global.window as any).gapi;
    delete (global.window as any).google;
  });

  describe('setClientId', () => {
    it('should set the client ID correctly', () => {
      const clientId = 'test-client-id.googleusercontent.com';
      GoogleAuthHelper.setClientId(clientId);

      expect((GoogleAuthHelper as any).CLIENT_ID).toBe(clientId);
    });

    it('should allow updating the client ID', () => {
      GoogleAuthHelper.setClientId('first-id');
      expect((GoogleAuthHelper as any).CLIENT_ID).toBe('first-id');

      GoogleAuthHelper.setClientId('second-id');
      expect((GoogleAuthHelper as any).CLIENT_ID).toBe('second-id');
    });
  });

  describe('isElectron', () => {
    it('should return true when running in Electron', () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        true
      );

      const result = GoogleAuthHelper.isElectron();

      expect(result).toBe(true);
      expect(electronUtilsModule.electronUtils.isElectron).toHaveBeenCalled();
    });

    it('should return false when not running in Electron', () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        false
      );

      const result = GoogleAuthHelper.isElectron();

      expect(result).toBe(false);
    });
  });

  describe('waitForGoogleAPI', () => {
    beforeEach(() => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        false
      );
    });

    it('should return true immediately when APIs are available in browser', async () => {
      (global.window as any).gapi = { load: vi.fn() };
      (global.window as any).google = { accounts: {} };

      const result = await GoogleAuthHelper.waitForGoogleAPI(100);

      expect(result).toBe(true);
    });

    it('should return true immediately when APIs are available in Electron', async () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        true
      );

      (global.window as any).gapi = { load: vi.fn() };

      const result = await GoogleAuthHelper.waitForGoogleAPI(100);

      expect(result).toBe(true);
    });

    it('should return false when APIs are not available after timeout', async () => {
      // No APIs available
      const result = await GoogleAuthHelper.waitForGoogleAPI(10);

      expect(result).toBe(false);
    });
  });

  describe('initializeGapi', () => {
    beforeEach(() => {
      GoogleAuthHelper.setClientId('test-client-id');
    });

    it('should reject when gapi is not available', async () => {
      await expect(GoogleAuthHelper.initializeGapi()).rejects.toThrow(
        'Google API library not loaded. Please check internet connection.'
      );
    });

    it('should reject when CLIENT_ID is not configured', async () => {
      (global.window as any).gapi = { load: vi.fn() };
      (GoogleAuthHelper as any).CLIENT_ID = null;

      await expect(GoogleAuthHelper.initializeGapi()).rejects.toThrow(
        'Google Client ID not configured'
      );
    });

    it('should initialize successfully in Electron', async () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        true
      );

      const mockGapi = {
        load: vi.fn((library: string, options: any) => {
          options.callback();
        }),
        client: {
          init: vi.fn().mockResolvedValue({}),
        },
      };

      (global.window as any).gapi = mockGapi;

      await expect(GoogleAuthHelper.initializeGapi()).resolves.toBeUndefined();

      expect(mockGapi.load).toHaveBeenCalledWith('client', expect.any(Object));

      expect(mockGapi.client.init).toHaveBeenCalledWith({
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        ],
      });
    });

    it('should initialize successfully in browser with token client', async () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        false
      );

      const mockTokenClient = { callback: null, requestAccessToken: vi.fn() };

      const mockGapi = {
        load: vi.fn((library: string, options: any) => {
          options.callback();
        }),
        client: {
          init: vi.fn().mockResolvedValue({}),
        },
      };

      const mockGoogle = {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn().mockReturnValue(mockTokenClient),
          },
        },
      };

      (global.window as any).gapi = mockGapi;
      (global.window as any).google = mockGoogle;

      await expect(GoogleAuthHelper.initializeGapi()).resolves.toBeUndefined();

      expect(mockGoogle.accounts.oauth2.initTokenClient).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: '',
      });

      expect((GoogleAuthHelper as any).tokenClient).toBe(mockTokenClient);
    });

    it('should handle gapi.load error', async () => {
      const mockGapi = {
        load: vi.fn((library: string, options: any) => {
          options.onerror();
        }),
        client: { init: vi.fn() },
      };

      (global.window as any).gapi = mockGapi;

      await expect(GoogleAuthHelper.initializeGapi()).rejects.toThrow(
        'Failed to load Google API libraries'
      );
    });
  });

  describe('signIn', () => {
    beforeEach(() => {
      GoogleAuthHelper.setClientId('test-client-id');
    });

    it('should reject when CLIENT_ID is not configured', async () => {
      (GoogleAuthHelper as any).CLIENT_ID = null;

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Google Client ID not configured'
      );
    });

    it('should reject when Google APIs are not ready', async () => {
      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockResolvedValue(false);

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Google API libraries are not available. Please check your internet connection.'
      );
    });

    it('should call signInElectron when running in Electron', async () => {
      vi.mocked(electronUtilsModule.electronUtils.isElectron).mockReturnValue(
        true
      );

      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockResolvedValue(true);
      vi.spyOn(GoogleAuthHelper, 'initializeGapi').mockResolvedValue();

      const signInElectronSpy = vi
        .spyOn(GoogleAuthHelper, 'signInElectron')
        .mockResolvedValue('electron-token');

      const result = await GoogleAuthHelper.signIn();

      expect(result).toBe('electron-token');
      expect(signInElectronSpy).toHaveBeenCalled();
    });

    it('should handle popup_closed_by_user error correctly', async () => {
      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockRejectedValue(
        new Error('popup_closed_by_user')
      );

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Autenticación cancelada por el usuario'
      );
    });

    it('should handle popup_blocked error correctly', async () => {
      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockRejectedValue(
        new Error('popup_blocked')
      );

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Popup bloqueado por el navegador. Habilita popups para este sitio.'
      );
    });

    it('should handle invalid_client error correctly', async () => {
      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockRejectedValue(
        new Error('invalid_client')
      );

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Client ID inválido. Verifica la configuración en Google Cloud Console.'
      );
    });

    it('should handle generic errors correctly', async () => {
      vi.spyOn(GoogleAuthHelper, 'waitForGoogleAPI').mockRejectedValue(
        new Error('Something went wrong')
      );

      await expect(GoogleAuthHelper.signIn()).rejects.toThrow(
        'Error al autenticar con Google Calendar: Something went wrong'
      );
    });
  });

  describe('signOut', () => {
    it('should handle missing Google APIs silently', async () => {
      await expect(GoogleAuthHelper.signOut()).resolves.toBeUndefined();
    });

    it('should call revoke when Google APIs are available', async () => {
      const revokeSpy = vi.fn();

      (global.window as any).google = {
        accounts: {
          oauth2: {
            revoke: revokeSpy,
          },
        },
      };

      await GoogleAuthHelper.signOut();

      expect(revokeSpy).toHaveBeenCalledWith('', expect.any(Function));
    });

    it('should handle revoke errors silently', async () => {
      (global.window as any).google = {
        accounts: {
          oauth2: {
            revoke: vi.fn(() => {
              throw new Error('Revoke failed');
            }),
          },
        },
      };

      await expect(GoogleAuthHelper.signOut()).resolves.toBeUndefined();
    });
  });

  describe('signInElectron', () => {
    beforeEach(() => {
      GoogleAuthHelper.setClientId('test-client-id');
      vi.restoreAllMocks(); // Remove any spies that might interfere
    });

    it('should create auth URL with correct parameters', async () => {
      const mockOpen = vi.fn().mockReturnValue(null);
      vi.stubGlobal('open', mockOpen);

      // The function will reject due to popup being null, but we can test the URL
      await expect(GoogleAuthHelper.signInElectron()).rejects.toThrow(
        'Popup bloqueado por el navegador. Habilita popups para este sitio.'
      );

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://accounts.google.com/o/oauth2/v2/auth'),
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      const authUrl = mockOpen.mock.calls[0][0];
      expect(authUrl).toContain('client_id=test-client-id');

      expect(authUrl).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth-callback.html'
      );

      expect(authUrl).toContain(
        'scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly'
      );

      expect(authUrl).toContain('response_type=token');

      vi.unstubAllGlobals();
    });

    it('should reject when popup is blocked', async () => {
      vi.stubGlobal('open', vi.fn().mockReturnValue(null));

      await expect(GoogleAuthHelper.signInElectron()).rejects.toThrow(
        'Popup bloqueado por el navegador. Habilita popups para este sitio.'
      );

      vi.unstubAllGlobals();
    });
  });
});
