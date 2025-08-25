import { useState, useCallback } from 'react';
import { GoogleConnectionStatus, CalendarOption } from '../types';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { GoogleAuthHelper } from '../utils/googleAuthHelper';
import { useSettingsStore } from '../stores/settingsStore';

export const useGoogleAuth = () => {
  const { googleAuth, setGoogleAuth, clearGoogleAuth, clearExpiredSession } =
    useSettingsStore();

  const [connectionStatus, setConnectionStatus] =
    useState<GoogleConnectionStatus>('idle');

  const [availableCalendars, setAvailableCalendars] = useState<
    CalendarOption[]
  >([]);

  const validateGoogleClientId = useCallback((clientId: string): boolean => {
    const clientIdPattern =
      /^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/;
    return clientIdPattern.test(clientId);
  }, []);

  const loadAvailableCalendars = useCallback(async () => {
    if (!googleAuth.accessToken) return;

    try {
      const googleService = new GoogleCalendarService({
        accessToken: googleAuth.accessToken,
      });

      const calendars = await googleService.getCalendarList();
      setAvailableCalendars(calendars);
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  }, [googleAuth.accessToken]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!googleAuth.clientId || !googleAuth.clientId.trim()) {
      setConnectionStatus('error');
      return;
    }

    const trimmedClientId = googleAuth.clientId.trim();

    if (!validateGoogleClientId(trimmedClientId)) {
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('authenticating');

    try {
      GoogleAuthHelper.setClientId(googleAuth.clientId.trim());
      const accessToken = await GoogleAuthHelper.signIn();

      setGoogleAuth({ accessToken });

      const googleService = new GoogleCalendarService({ accessToken });
      const isConnected = await googleService.testConnection();

      if (isConnected) {
        setConnectionStatus('success');
        await loadAvailableCalendars();
      } else {
        setConnectionStatus('error');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setConnectionStatus('error');
    }
  }, [
    googleAuth.clientId,
    setGoogleAuth,
    validateGoogleClientId,
    loadAvailableCalendars,
  ]);

  const handleGoogleSignOut = useCallback(async () => {
    try {
      await GoogleAuthHelper.signOut();
      clearGoogleAuth();
      setAvailableCalendars([]);
      setConnectionStatus('idle');
    } catch (error) {
      console.error('Google sign-out error:', error);
    }
  }, [clearGoogleAuth]);

  const testConnection = useCallback(async () => {
    if (!googleAuth.accessToken) {
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('testing');

    const googleService = new GoogleCalendarService({
      accessToken: googleAuth.accessToken,
      calendarId: googleAuth.calendarId || 'primary',
    });

    const isConnected = await googleService.testConnection();
    setConnectionStatus(isConnected ? 'success' : 'error');
  }, [googleAuth.accessToken, googleAuth.calendarId]);

  const initializeSession = useCallback(() => {
    clearExpiredSession();

    if (googleAuth.accessToken) {
      loadAvailableCalendars();
    }
  }, [clearExpiredSession, googleAuth.accessToken, loadAvailableCalendars]);

  return {
    connectionStatus,
    availableCalendars,
    validateGoogleClientId,
    handleGoogleSignIn,
    handleGoogleSignOut,
    testConnection,
    loadAvailableCalendars,
    initializeSession,
  };
};
