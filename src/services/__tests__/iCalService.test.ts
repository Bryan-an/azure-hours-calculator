import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../__tests__/server';
import { ICalService } from '../iCalService';
import { electronUtils } from '../../utils/electronUtils';

// Mock electronUtils
vi.mock('../../utils/electronUtils', () => ({
  electronUtils: {
    isElectron: vi.fn(),
  },
}));

describe('ICalService', () => {
  let service: ICalService;
  const mockUrl = 'https://calendar.google.com/calendar/ical/test/basic.ics';

  // Sample iCal data for testing
  const sampleICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-event-1
SUMMARY:Test Meeting
DTSTART:20240301T090000Z
DTEND:20240301T100000Z
STATUS:CONFIRMED
TRANSP:OPAQUE
DESCRIPTION:Test description
END:VEVENT
BEGIN:VEVENT
UID:test-event-2
SUMMARY:Optional Meeting (opcional)
DTSTART:20240302T140000Z
DTEND:20240302T150000Z
STATUS:CANCELLED
TRANSP:TRANSPARENT
DESCRIPTION:Optional meeting
END:VEVENT
BEGIN:VEVENT
UID:invalid-event
SUMMARY:Invalid Event
END:VEVENT
END:VCALENDAR`;

  const sampleDateRangeStart = new Date('2024-03-01T00:00:00Z');
  const sampleDateRangeEnd = new Date('2024-03-31T23:59:59Z');

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default localStorage mock implementation
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue('[]'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Default navigator mock
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
      },
      writable: true,
    });

    service = new ICalService({ url: mockUrl });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('constructor', () => {
    test('should initialize with provided URL', () => {
      const testUrl = 'https://example.com/calendar.ics';
      const testService = new ICalService({ url: testUrl });
      expect(testService).toBeDefined();
    });
  });

  describe('getEvents', () => {
    test('should return empty array when URL is not configured', async () => {
      const emptyService = new ICalService({ url: '' });

      const events = await emptyService.getEvents(
        sampleDateRangeStart,
        sampleDateRangeEnd
      );

      expect(events).toEqual([]);
    });

    test('should return empty array when URL is only whitespace', async () => {
      const emptyService = new ICalService({ url: '   ' });

      const events = await emptyService.getEvents(
        sampleDateRangeStart,
        sampleDateRangeEnd
      );

      expect(events).toEqual([]);
    });

    test('should fetch and parse iCal data successfully without CORS proxy', async () => {
      // Mock electronUtils to return true (no CORS proxy needed)
      vi.mocked(electronUtils.isElectron).mockReturnValue(true);

      server.use(
        http.get(mockUrl, () => {
          return HttpResponse.text(sampleICalData);
        })
      );

      const events = await service.getEvents(
        sampleDateRangeStart,
        sampleDateRangeEnd
      );

      expect(events).toHaveLength(2); // Should exclude invalid event

      expect(events[0]).toEqual({
        id: 'test-event-1',
        title: 'Test Meeting',
        start: new Date('2024-03-01T09:00:00Z'),
        end: new Date('2024-03-01T10:00:00Z'),
        isOptional: false,
      });
    });

    test('should use CORS proxy for Google Calendar URLs in browser', async () => {
      // Mock electronUtils to return false (CORS proxy needed)
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      server.use(
        http.get('https://api.allorigins.win/get', ({ request }) => {
          const url = new URL(request.url);
          const targetUrl = url.searchParams.get('url');

          if (targetUrl === mockUrl) {
            return HttpResponse.json({
              contents: sampleICalData,
              status: { http_code: 200 },
            });
          }

          return HttpResponse.error();
        })
      );

      const events = await service.getEvents(
        sampleDateRangeStart,
        sampleDateRangeEnd
      );

      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('test-event-1');
    });

    test('should handle network errors', async () => {
      server.use(
        http.get(mockUrl, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        service.getEvents(sampleDateRangeStart, sampleDateRangeEnd)
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should handle HTTP error responses', async () => {
      server.use(
        http.get(mockUrl, () => {
          return new HttpResponse(null, {
            status: 404,
            statusText: 'Not Found',
          });
        })
      );

      await expect(
        service.getEvents(sampleDateRangeStart, sampleDateRangeEnd)
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should filter events by date range', async () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(true);

      const iCalWithMultipleDates = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:before-range
SUMMARY:Before Range
DTSTART:20240201T090000Z
DTEND:20240201T100000Z
END:VEVENT
BEGIN:VEVENT
UID:in-range
SUMMARY:In Range
DTSTART:20240315T090000Z
DTEND:20240315T100000Z
END:VEVENT
BEGIN:VEVENT
UID:after-range
SUMMARY:After Range
DTSTART:20240401T090000Z
DTEND:20240401T100000Z
END:VEVENT
END:VCALENDAR`;

      server.use(
        http.get(mockUrl, () => {
          return HttpResponse.text(iCalWithMultipleDates);
        })
      );

      const events = await service.getEvents(
        sampleDateRangeStart,
        sampleDateRangeEnd
      );

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('in-range');
    });

    test('should log security events', async () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(true);
      const setItemSpy = vi.fn();
      const getItemSpy = vi.fn().mockReturnValue('[]');

      Object.defineProperty(global, 'localStorage', {
        value: { getItem: getItemSpy, setItem: setItemSpy },
        writable: true,
      });

      server.use(
        http.get(mockUrl, () => {
          return HttpResponse.text(sampleICalData);
        })
      );

      await service.getEvents(sampleDateRangeStart, sampleDateRangeEnd);

      expect(setItemSpy).toHaveBeenCalledWith(
        'calendar_audit_log',
        expect.stringContaining('ical_access_start')
      );

      expect(setItemSpy).toHaveBeenCalledWith(
        'calendar_audit_log',
        expect.stringContaining('ical_access_success')
      );
    });
  });

  describe('parseICalData', () => {
    test('should parse valid iCal data', () => {
      const events = (service as any).parseICalData(sampleICalData);
      expect(events).toHaveLength(2); // Excludes invalid event

      expect(events[0]).toEqual({
        uid: 'test-event-1',
        summary: 'Test Meeting',
        dtstart: new Date('2024-03-01T09:00:00Z'),
        dtend: new Date('2024-03-01T10:00:00Z'),
        status: 'CONFIRMED',
        transparency: 'OPAQUE',
        description: 'Test description',
      });
    });

    test('should handle line folding in iCal data', () => {
      const iCalWithFolding = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:folded-event
SUMMARY:This is a very long summary that spans
 multiple lines due to folding
DTSTART:20240301T090000Z
DTEND:20240301T100000Z
END:VEVENT
END:VCALENDAR`;

      const events = (service as any).parseICalData(iCalWithFolding);
      expect(events).toHaveLength(1);

      expect(events[0].summary).toBe(
        'This is a very long summary that spansmultiple lines due to folding'
      );
    });

    test('should ignore incomplete events', () => {
      const incompleteICalData = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:incomplete-event
SUMMARY:Incomplete Event
DTSTART:20240301T090000Z
END:VEVENT
END:VCALENDAR`;

      const events = (service as any).parseICalData(incompleteICalData);
      expect(events).toHaveLength(0);
    });
  });

  describe('parseICalDate', () => {
    test('should parse date-only format (YYYYMMDD)', () => {
      const date = (service as any).parseICalDate('20240315');
      expect(date).toEqual(new Date(2024, 2, 15)); // Month is 0-based
    });

    test('should parse UTC datetime format (YYYYMMDDTHHMMSSZ)', () => {
      const date = (service as any).parseICalDate('20240315T143000Z');
      expect(date).toEqual(new Date(Date.UTC(2024, 2, 15, 14, 30, 0)));
    });

    test('should parse local datetime format (YYYYMMDDTHHMMSS)', () => {
      const date = (service as any).parseICalDate('20240315T143000');
      expect(date).toEqual(new Date(2024, 2, 15, 14, 30, 0));
    });

    test('should handle timezone parameters by removing them', () => {
      const date = (service as any).parseICalDate(
        '20240315T143000;TZID=America/New_York'
      );

      expect(date).toEqual(new Date(2024, 2, 15, 14, 30, 0));
    });

    test('should fallback to ISO parsing for other formats', () => {
      const date = (service as any).parseICalDate('2024-03-15T14:30:00');
      expect(date).toEqual(new Date('2024-03-15T14:30:00'));
    });

    test('should return current date for invalid formats', () => {
      const dateBefore = new Date();
      const date = (service as any).parseICalDate('invalid-date');
      const dateAfter = new Date();

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeGreaterThanOrEqual(dateBefore.getTime());
      expect(date.getTime()).toBeLessThanOrEqual(dateAfter.getTime());
    });
  });

  describe('determineIfEventIsOptional', () => {
    test('should return true for cancelled events', () => {
      const event = {
        uid: 'test',
        summary: 'Test',
        dtstart: new Date(),
        dtend: new Date(),
        status: 'CANCELLED',
        transparency: 'OPAQUE',
        description: '',
      };

      const isOptional = (service as any).determineIfEventIsOptional(event);
      expect(isOptional).toBe(true);
    });

    test('should return true for transparent events', () => {
      const event = {
        uid: 'test',
        summary: 'Test',
        dtstart: new Date(),
        dtend: new Date(),
        status: 'CONFIRMED',
        transparency: 'TRANSPARENT',
        description: '',
      };

      const isOptional = (service as any).determineIfEventIsOptional(event);
      expect(isOptional).toBe(true);
    });

    test('should return true for events with optional keywords', () => {
      const testCases = [
        'Meeting (opcional)',
        'Meeting [opcional]',
        'Optional meeting',
        'Meeting opcional',
      ];

      testCases.forEach((summary) => {
        const event = {
          uid: 'test',
          summary,
          dtstart: new Date(),
          dtend: new Date(),
          status: 'CONFIRMED',
          transparency: 'OPAQUE',
          description: '',
        };

        const isOptional = (service as any).determineIfEventIsOptional(event);
        expect(isOptional).toBe(true);
      });
    });

    test('should return false for regular events', () => {
      const event = {
        uid: 'test',
        summary: 'Regular Meeting',
        dtstart: new Date(),
        dtend: new Date(),
        status: 'CONFIRMED',
        transparency: 'OPAQUE',
        description: '',
      };

      const isOptional = (service as any).determineIfEventIsOptional(event);
      expect(isOptional).toBe(false);
    });
  });

  describe('needsCorsProxy', () => {
    test('should return false when in Electron environment', () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(true);

      const needsProxy = (service as any).needsCorsProxy(
        'https://calendar.google.com/test'
      );

      expect(needsProxy).toBe(false);
    });

    test('should return true for Google Calendar URLs in browser', () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      const needsProxy = (service as any).needsCorsProxy(
        'https://calendar.google.com/test'
      );

      expect(needsProxy).toBe(true);
    });

    test('should return true for Office 365 URLs in browser', () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      const needsProxy = (service as any).needsCorsProxy(
        'https://outlook.office365.com/test'
      );

      expect(needsProxy).toBe(true);
    });

    test('should return false for other domains in browser', () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      const needsProxy = (service as any).needsCorsProxy(
        'https://example.com/test'
      );

      expect(needsProxy).toBe(false);
    });

    test('should handle invalid URLs', () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);
      const needsProxy = (service as any).needsCorsProxy('invalid-url');
      expect(needsProxy).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    test('should remove query parameters and fragments', () => {
      const sanitized = (service as any).sanitizeUrl(
        'https://example.com/path?param=value#fragment'
      );

      expect(sanitized).toBe('https://example.com/path');
    });

    test('should handle URLs without path', () => {
      const sanitized = (service as any).sanitizeUrl(
        'https://example.com?param=value'
      );

      expect(sanitized).toBe('https://example.com/');
    });

    test('should handle invalid URLs', () => {
      const sanitized = (service as any).sanitizeUrl('invalid-url');
      expect(sanitized).toBe('invalid-url');
    });
  });

  describe('mapICalEventToMeeting', () => {
    test('should map iCal event to Meeting interface', () => {
      const iCalEvent = {
        uid: 'test-id',
        summary: 'Test Meeting',
        dtstart: new Date('2024-03-01T09:00:00Z'),
        dtend: new Date('2024-03-01T10:00:00Z'),
        status: 'CONFIRMED',
        transparency: 'OPAQUE',
        description: 'Test description',
      };

      const meeting = (service as any).mapICalEventToMeeting(iCalEvent);

      expect(meeting).toEqual({
        id: 'test-id',
        title: 'Test Meeting',
        start: new Date('2024-03-01T09:00:00Z'),
        end: new Date('2024-03-01T10:00:00Z'),
        isOptional: false,
      });
    });

    test('should use default title for events without summary', () => {
      const iCalEvent = {
        uid: 'test-id',
        summary: '',
        dtstart: new Date('2024-03-01T09:00:00Z'),
        dtend: new Date('2024-03-01T10:00:00Z'),
        status: 'CONFIRMED',
        transparency: 'OPAQUE',
        description: '',
      };

      const meeting = (service as any).mapICalEventToMeeting(iCalEvent);
      expect(meeting.title).toBe('Sin título');
    });
  });

  describe('testConnection', () => {
    test('should return false when URL is empty', async () => {
      const emptyService = new ICalService({ url: '' });
      const result = await emptyService.testConnection();
      expect(result).toBe(false);
    });

    test('should return true for successful connection without proxy', async () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(true);

      server.use(
        http.head(mockUrl, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      const result = await service.testConnection();
      expect(result).toBe(true);
    });

    test('should return true for successful connection with proxy', async () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      server.use(
        http.get('https://api.allorigins.win/get', ({ request }) => {
          const url = new URL(request.url);
          const targetUrl = url.searchParams.get('url');

          if (targetUrl === mockUrl) {
            return HttpResponse.json({
              contents: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
              status: { http_code: 200 },
            });
          }

          return HttpResponse.error();
        })
      );

      const result = await service.testConnection();
      expect(result).toBe(true);
    });

    test('should return false for failed connection', async () => {
      server.use(
        http.head(mockUrl, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const result = await service.testConnection();
      expect(result).toBe(false);
    });

    test('should return false for invalid proxy response', async () => {
      vi.mocked(electronUtils.isElectron).mockReturnValue(false);

      server.use(
        http.get('https://api.allorigins.win/get', ({ request }) => {
          const url = new URL(request.url);
          const targetUrl = url.searchParams.get('url');

          if (targetUrl === mockUrl) {
            return HttpResponse.json({
              contents: 'invalid content',
              status: { http_code: 200 },
            });
          }

          return HttpResponse.error();
        })
      );

      const result = await service.testConnection();
      expect(result).toBe(false);
    });

    test('should return false for network errors', async () => {
      server.use(
        http.head(mockUrl, () => {
          return HttpResponse.error();
        })
      );

      const result = await service.testConnection();
      expect(result).toBe(false);
    });

    test('should log connection test results', async () => {
      const setItemSpy = vi.fn();
      const getItemSpy = vi.fn().mockReturnValue('[]');

      Object.defineProperty(global, 'localStorage', {
        value: { getItem: getItemSpy, setItem: setItemSpy },
        writable: true,
      });

      server.use(
        http.head(mockUrl, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      await service.testConnection();

      expect(setItemSpy).toHaveBeenCalledWith(
        'calendar_audit_log',
        expect.stringContaining('ical_connection_test')
      );
    });
  });

  describe('security logging', () => {
    test('should maintain audit log with max 100 entries', () => {
      const existingLogs = Array(95).fill({ event: 'old_event' });
      const getItemSpy = vi.fn().mockReturnValue(JSON.stringify(existingLogs));
      const setItemSpy = vi.fn();

      Object.defineProperty(global, 'localStorage', {
        value: { getItem: getItemSpy, setItem: setItemSpy },
        writable: true,
      });

      // Call private method using any cast
      (service as any).logSecurityEvent('test_event', { test: 'data' });

      expect(setItemSpy).toHaveBeenCalledWith(
        'calendar_audit_log',
        expect.stringContaining('"event":"test_event"')
      );

      const savedData = JSON.parse(setItemSpy.mock.calls[0][1]);
      expect(savedData).toHaveLength(96); // 95 existing + 1 new
    });

    test('should trim log entries to keep only last 100', () => {
      const existingLogs = Array(150)
        .fill(null)
        .map((_, i) => ({ event: `old_event_${i}` }));

      const getItemSpy = vi.fn().mockReturnValue(JSON.stringify(existingLogs));
      const setItemSpy = vi.fn();

      Object.defineProperty(global, 'localStorage', {
        value: { getItem: getItemSpy, setItem: setItemSpy },
        writable: true,
      });

      (service as any).logSecurityEvent('new_event', { test: 'data' });

      const savedData = JSON.parse(setItemSpy.mock.calls[0][1]);
      expect(savedData).toHaveLength(100); // Should be trimmed to 100
      expect(savedData[99].event).toBe('new_event'); // Last entry should be the new one
    });
  });
});
