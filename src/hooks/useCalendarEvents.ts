import { useState, useCallback } from 'react';
import { Meeting } from '../types';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { ICalService } from '../services/iCalService';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Custom hook for managing calendar events from Google Calendar and iCal sources.
 *
 * This hook provides a unified interface for loading calendar events from different
 * sources (Google Calendar or iCal), handling authentication states, error management,
 * and session management.
 *
 * @example
 * ```tsx
 * const { meetings, loading, loadEvents, getCalendarSourceLabel } = useCalendarEvents();
 *
 * // Load events for a date range
 * const events = await loadEvents(new Date('2024-01-01'), new Date('2024-01-31'));
 *
 * // Get the current calendar source label
 * const sourceLabel = getCalendarSourceLabel(); // "Google Calendar" or "iCal"
 * ```
 *
 * @returns An object containing:
 *   - `meetings`: Array of loaded meeting events
 *   - `loading`: Boolean indicating if events are currently being loaded
 *   - `loadEvents`: Function to load events for a date range
 *   - `getCalendarSourceLabel`: Function to get the human-readable calendar source name
 */
export const useCalendarEvents = () => {
  /** Current list of loaded meeting events */
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  /** Loading state for calendar operations */
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

  /**
   * Loads events from Google Calendar for the specified date range.
   *
   * This function handles Google Calendar authentication, token validation,
   * and error management. It automatically handles expired tokens by clearing
   * the authentication state and showing appropriate user notifications.
   *
   * @param startDate - The start date for the event range
   * @param endDate - The end date for the event range
   * @returns Promise that resolves to an array of meeting events
   *
   * @throws When Google Calendar service encounters an error
   *
   * @example
   * ```tsx
   * const events = await loadGoogleCalendarEvents(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   * ```
   */
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

  /**
   * Loads events from an iCal URL for the specified date range.
   *
   * This function fetches and parses iCal data from the configured URL.
   * It handles network errors and provides user-friendly error messages.
   *
   * @param startDate - The start date for the event range
   * @param endDate - The end date for the event range
   * @returns Promise that resolves to an array of meeting events
   *
   * @throws When iCal service encounters an error or URL is invalid
   *
   * @example
   * ```tsx
   * const events = await loadICalEvents(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   * ```
   */
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

  /**
   * Loads calendar events based on the configured calendar source.
   *
   * This is the main function for loading calendar events. It automatically
   * determines which calendar source to use (Google Calendar or iCal) based
   * on the current settings, handles session management, and provides unified
   * error handling.
   *
   * The function performs the following operations:
   * 1. Clears any expired sessions
   * 2. Updates the last activity timestamp
   * 3. Sets loading state
   * 4. Loads events from the appropriate source
   * 5. Updates the meetings state
   * 6. Handles errors and resets loading state
   *
   * @param startDate - The start date for the event range
   * @param endDate - The end date for the event range
   * @returns Promise that resolves to an array of meeting events
   *
   * @throws When the calendar service encounters an error
   *
   * @example
   * ```tsx
   * try {
   *   const events = await loadEvents(
   *     new Date('2024-01-01'),
   *     new Date('2024-01-31')
   *   );
   *   console.log(`Loaded ${events.length} events`);
   * } catch (error) {
   *   console.error('Failed to load events:', error);
   * }
   * ```
   */
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

  /**
   * Returns a human-readable label for the current calendar source.
   *
   * This function provides localized labels for different calendar sources
   * that can be used in the UI for displaying the current calendar type.
   *
   * @returns Human-readable label for the current calendar source
   *
   * @example
   * ```tsx
   * const sourceLabel = getCalendarSourceLabel();
   * // Returns: "Google Calendar", "iCal", or "calendario"
   * ```
   */
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
