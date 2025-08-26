import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarEvents } from '../useCalendarEvents';
import { GoogleCalendarService } from '../../services/googleCalendarService';
import { ICalService } from '../../services/iCalService';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { Meeting } from '../../types';

// Mock GoogleCalendarService
vi.mock('../../services/googleCalendarService', () => ({
  GoogleCalendarService: vi.fn().mockImplementation(() => ({
    getEvents: vi.fn(),
  })),
}));

// Mock ICalService
vi.mock('../../services/iCalService', () => ({
  ICalService: vi.fn().mockImplementation(() => ({
    getEvents: vi.fn(),
  })),
}));

// Mock useSettingsStore
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock useUIStore
vi.mock('../../stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

describe('useCalendarEvents', () => {
  const mockClearExpiredSession = vi.fn();
  const mockUpdateLastActivity = vi.fn();
  const mockClearGoogleAuth = vi.fn();
  const mockShowToast = vi.fn();
  const mockGetGoogleEvents = vi.fn();
  const mockGetICalEvents = vi.fn();

  const mockGoogleAuth = {
    accessToken: 'mock-token',
    calendarId: 'test-calendar',
    tokenExpiresAt: Date.now() + 3600000, // 1 hour from now
  };

  const mockMeetings: Meeting[] = [
    {
      id: '1',
      title: 'Test Meeting',
      start: new Date('2024-01-01T10:00:00'),
      end: new Date('2024-01-01T11:00:00'),
      isOptional: false,
    },
    {
      id: '2',
      title: 'Optional Meeting',
      start: new Date('2024-01-01T14:00:00'),
      end: new Date('2024-01-01T15:00:00'),
      isOptional: true,
    },
  ];

  const createMockSettingsStore = (overrides = {}) => ({
    calendarSource: 'google',
    googleAuth: mockGoogleAuth,
    icalUrl: 'https://example.com/calendar.ics',
    clearExpiredSession: mockClearExpiredSession,
    updateLastActivity: mockUpdateLastActivity,
    clearGoogleAuth: mockClearGoogleAuth,
    ...overrides,
  });

  const createMockUIStore = (overrides = {}) => ({
    showToast: mockShowToast,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    (useSettingsStore as any).mockReturnValue(createMockSettingsStore());
    (useUIStore as any).mockReturnValue(createMockUIStore());

    (GoogleCalendarService as any).mockImplementation(() => ({
      getEvents: mockGetGoogleEvents,
    }));

    (ICalService as any).mockImplementation(() => ({
      getEvents: mockGetICalEvents,
    }));

    mockGetGoogleEvents.mockResolvedValue(mockMeetings);
    mockGetICalEvents.mockResolvedValue(mockMeetings);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    test('should return initial state correctly', () => {
      const { result } = renderHook(() => useCalendarEvents());

      expect(result.current.meetings).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.loadEvents).toBe('function');
      expect(typeof result.current.getCalendarSourceLabel).toBe('function');
    });
  });

  describe('Google Calendar integration', () => {
    test('should load Google Calendar events successfully', async () => {
      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual(mockMeetings);
      });

      expect(mockGetGoogleEvents).toHaveBeenCalledWith(startDate, endDate);
      expect(result.current.meetings).toEqual(mockMeetings);
      expect(result.current.loading).toBe(false);
    });

    test('should return empty array when no Google access token', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          googleAuth: { accessToken: null },
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(mockGetGoogleEvents).not.toHaveBeenCalled();
      expect(result.current.meetings).toEqual([]);
    });

    test('should handle expired Google token', async () => {
      const tokenError = new Error('Token expirado');
      mockGetGoogleEvents.mockRejectedValue(tokenError);

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(mockClearGoogleAuth).toHaveBeenCalled();

      expect(mockShowToast).toHaveBeenCalledWith(
        'Sesión de Google Calendar expirada. Por favor, vuelve a autenticarte en Configuración.',
        'warning'
      );
    });

    test('should use primary calendar when calendarId is not provided', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          googleAuth: { accessToken: 'token', calendarId: null },
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        await result.current.loadEvents(startDate, endDate);
      });

      expect(GoogleCalendarService).toHaveBeenCalledWith({
        accessToken: 'token',
        calendarId: 'primary',
        expiresAt: undefined,
      });
    });
  });

  describe('iCal integration', () => {
    test('should load iCal events successfully', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'ical',
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual(mockMeetings);
      });

      expect(ICalService).toHaveBeenCalledWith({
        url: 'https://example.com/calendar.ics',
      });

      expect(mockGetICalEvents).toHaveBeenCalledWith(startDate, endDate);
      expect(result.current.meetings).toEqual(mockMeetings);
    });

    test('should return empty array when no iCal URL', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'ical',
          icalUrl: null,
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(mockGetICalEvents).not.toHaveBeenCalled();
      expect(result.current.meetings).toEqual([]);
    });

    test('should handle iCal loading errors', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'ical',
        })
      );

      const error = new Error('iCal fetch error');
      mockGetICalEvents.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await expect(
        act(async () => {
          await result.current.loadEvents(startDate, endDate);
        })
      ).rejects.toThrow(
        'Error al cargar eventos del calendario iCal. Verifica la URL en Configuración.'
      );
    });
  });

  describe('Core functionality', () => {
    test('should call clearExpiredSession and updateLastActivity', async () => {
      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        await result.current.loadEvents(startDate, endDate);
      });

      expect(mockClearExpiredSession).toHaveBeenCalled();
      expect(mockUpdateLastActivity).toHaveBeenCalled();
    });

    test('should handle no calendar source', async () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'none',
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(result.current.meetings).toEqual([]);
      expect(mockGetGoogleEvents).not.toHaveBeenCalled();
      expect(mockGetICalEvents).not.toHaveBeenCalled();
    });
  });

  describe('Calendar source labels', () => {
    test('should return correct label for Google Calendar', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'google',
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      expect(result.current.getCalendarSourceLabel()).toBe('Google Calendar');
    });

    test('should return correct label for iCal', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'ical',
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      expect(result.current.getCalendarSourceLabel()).toBe('iCal');
    });

    test('should return correct label for none', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: 'none',
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      expect(result.current.getCalendarSourceLabel()).toBe('calendario');
    });

    test('should return default label for undefined source', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          calendarSource: undefined,
        })
      );

      const { result } = renderHook(() => useCalendarEvents());
      expect(result.current.getCalendarSourceLabel()).toBe('calendario');
    });
  });

  describe('Error handling', () => {
    test('should handle Google Calendar API errors gracefully', async () => {
      const error = new Error('Network error');
      mockGetGoogleEvents.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(result.current.meetings).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    test('should handle Token-related Google errors', async () => {
      const tokenError = new Error('Token invalid');
      mockGetGoogleEvents.mockRejectedValue(tokenError);

      const { result } = renderHook(() => useCalendarEvents());
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await act(async () => {
        const events = await result.current.loadEvents(startDate, endDate);
        expect(events).toEqual([]);
      });

      expect(mockClearGoogleAuth).toHaveBeenCalled();

      expect(mockShowToast).toHaveBeenCalledWith(
        'Sesión de Google Calendar expirada. Por favor, vuelve a autenticarte en Configuración.',
        'warning'
      );
    });
  });

  describe('Function stability', () => {
    test('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useCalendarEvents());

      const loadEventsRef1 = result.current.loadEvents;
      const getLabelRef1 = result.current.getCalendarSourceLabel;

      rerender();

      const loadEventsRef2 = result.current.loadEvents;
      const getLabelRef2 = result.current.getCalendarSourceLabel;

      expect(loadEventsRef1).toBe(loadEventsRef2);
      expect(getLabelRef1).toBe(getLabelRef2);
    });
  });
});
