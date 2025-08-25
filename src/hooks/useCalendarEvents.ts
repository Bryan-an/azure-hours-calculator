import { useState, useCallback } from 'react';
import { Meeting } from '../types';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { ICalService } from '../services/iCalService';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

export const useCalendarEvents = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    calendarSource,
    googleAuth,
    icalUrl,
    clearExpiredSession,
    updateLastActivity,
    clearGoogleAuth,
  } = useSettingsStore();

  const { showToast } = useUIStore();

  const loadGoogleCalendarEvents = useCallback(
    async (startDate: Date, endDate: Date): Promise<Meeting[]> => {
      const {
        accessToken: googleAccessToken,
        calendarId: googleCalendarId,
        tokenExpiresAt,
      } = googleAuth;

      if (!googleAccessToken) {
        return [];
      }

      try {
        const googleService = new GoogleCalendarService({
          accessToken: googleAccessToken,
          calendarId: googleCalendarId || 'primary',
          expiresAt: tokenExpiresAt || undefined,
        });

        return await googleService.getEvents(startDate, endDate);
      } catch (error) {
        console.error('Error loading Google Calendar events:', error);

        if (
          error instanceof Error &&
          (error.message.includes('Token') ||
            error.message.includes('expirado'))
        ) {
          clearGoogleAuth();

          showToast(
            'Sesión de Google Calendar expirada. Por favor, vuelve a autenticarte en Configuración.',
            'warning'
          );
        }

        return [];
      }
    },
    [googleAuth, clearGoogleAuth, showToast]
  );

  const loadICalEvents = useCallback(
    async (startDate: Date, endDate: Date): Promise<Meeting[]> => {
      if (!icalUrl) {
        return [];
      }

      try {
        const icalService = new ICalService({ url: icalUrl });
        return await icalService.getEvents(startDate, endDate);
      } catch (error) {
        console.error('Error loading iCal events:', error);

        throw new Error(
          'Error al cargar eventos del calendario iCal. Verifica la URL en Configuración.'
        );
      }
    },
    [icalUrl]
  );

  const loadEvents = useCallback(
    async (startDate: Date, endDate: Date): Promise<Meeting[]> => {
      clearExpiredSession();
      updateLastActivity();
      setLoading(true);

      try {
        let events: Meeting[] = [];

        if (calendarSource === 'google') {
          events = await loadGoogleCalendarEvents(startDate, endDate);
        } else if (calendarSource === 'ical') {
          events = await loadICalEvents(startDate, endDate);
        }

        setMeetings(events);
        return events;
      } catch (error) {
        console.error('Error loading events:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      calendarSource,
      loadGoogleCalendarEvents,
      loadICalEvents,
      clearExpiredSession,
      updateLastActivity,
    ]
  );

  const getCalendarSourceLabel = useCallback(() => {
    switch (calendarSource) {
      case 'google':
        return 'Google Calendar';
      case 'ical':
        return 'iCal';
      case 'none':
      default:
        return 'calendario';
    }
  }, [calendarSource]);

  return {
    meetings,
    loading,
    loadEvents,
    getCalendarSourceLabel,
  };
};
