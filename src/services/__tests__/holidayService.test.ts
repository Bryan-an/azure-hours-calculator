import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HolidayService } from '../holidayService';
import { Holiday } from '../../types';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Get the mock instance
const mockedAxios = axios as any;

describe('HolidayService', () => {
  let holidayService: HolidayService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up environment variable after each test
    delete process.env.REACT_APP_CALENDARIFIC_API_KEY;
  });

  describe('constructor', () => {
    it('should use provided API key', () => {
      const testApiKey = 'test-api-key';
      holidayService = new HolidayService(testApiKey);

      expect(holidayService['apiKey']).toBe(testApiKey);
    });

    it('should use fallback when constructor receives undefined', () => {
      holidayService = new HolidayService(undefined);

      // Should fallback to environment variable or empty string
      expect(typeof holidayService['apiKey']).toBe('string');
      expect(holidayService['apiKey']).toBeDefined();
    });

    it('should use empty string when no API key provided and no environment variable', () => {
      const originalEnv = process.env.REACT_APP_CALENDARIFIC_API_KEY;
      delete process.env.REACT_APP_CALENDARIFIC_API_KEY;

      holidayService = new HolidayService();

      expect(holidayService['apiKey']).toBe('');

      // Restore original value
      if (originalEnv !== undefined) {
        process.env.REACT_APP_CALENDARIFIC_API_KEY = originalEnv;
      }
    });
  });

  describe('getEcuadorHolidays', () => {
    describe('with valid API key', () => {
      beforeEach(() => {
        holidayService = new HolidayService('valid-api-key');
      });

      it('should fetch holidays from API successfully', async () => {
        const mockApiResponse = {
          data: {
            response: {
              holidays: [
                {
                  date: { iso: '2024-01-01' },
                  name: "New Year's Day",
                  type: ['National'],
                  global: true,
                },
                {
                  date: { iso: '2024-05-01' },
                  name: 'Labour Day',
                  type: ['National'],
                  global: true,
                },
                {
                  date: { iso: '2024-12-25' },
                  name: 'Christmas Day',
                  type: ['National'],
                  global: false,
                },
              ],
            },
          },
        };

        mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

        const result = await holidayService.getEcuadorHolidays(2024);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://calendarific.com/api/v2/holidays',
          {
            params: {
              api_key: 'valid-api-key',
              country: 'EC',
              year: 2024,
            },
          }
        );

        expect(result).toEqual([
          {
            date: '2024-01-01',
            name: "New Year's Day",
            type: 'National',
            country: 'EC',
            global: true,
          },
          {
            date: '2024-05-01',
            name: 'Labour Day',
            type: 'National',
            country: 'EC',
            global: true,
          },
          {
            date: '2024-12-25',
            name: 'Christmas Day',
            type: 'National',
            country: 'EC',
            global: false,
          },
        ]);
      });

      it('should handle API errors and fallback to static holidays', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        const result = await holidayService.getEcuadorHolidays(2024);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching holidays from API:',
          expect.any(Error)
        );

        // Should return static holidays for 2024
        expect(result).toEqual(
          expect.arrayContaining([
            {
              date: '2024-01-01',
              name: 'Año Nuevo',
              type: 'national',
              country: 'EC',
              global: true,
            },
            {
              date: '2024-05-01',
              name: 'Día del Trabajador',
              type: 'national',
              country: 'EC',
              global: true,
            },
            {
              date: '2024-12-25',
              name: 'Navidad',
              type: 'national',
              country: 'EC',
              global: true,
            },
          ])
        );

        consoleSpy.mockRestore();
      });

      it('should handle network timeouts and fallback to static holidays', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockedAxios.get.mockRejectedValueOnce({ code: 'ETIMEDOUT' });

        const result = await holidayService.getEcuadorHolidays(2025);

        expect(consoleSpy).toHaveBeenCalled();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('country', 'EC');

        consoleSpy.mockRestore();
      });
    });

    describe('without API key', () => {
      beforeEach(() => {
        holidayService = new HolidayService('');
      });

      it('should return static holidays when no API key is provided', async () => {
        const result = await holidayService.getEcuadorHolidays(2024);

        expect(mockedAxios.get).not.toHaveBeenCalled();
        expect(result).toEqual(
          expect.arrayContaining([
            {
              date: '2024-01-01',
              name: 'Año Nuevo',
              type: 'national',
              country: 'EC',
              global: true,
            },
            {
              date: '2024-05-01',
              name: 'Día del Trabajador',
              type: 'national',
              country: 'EC',
              global: true,
            },
          ])
        );
      });
    });

    describe('static holidays for different years', () => {
      beforeEach(() => {
        holidayService = new HolidayService('');
      });

      it('should return basic static holidays for regular years', async () => {
        const result = await holidayService.getEcuadorHolidays(2024);

        const expectedBasicHolidays = [
          'Año Nuevo',
          'Día del Trabajador',
          'Batalla del Pichincha',
          'Primer Grito de Independencia',
          'Independencia de Guayaquil',
          'Día de los Difuntos',
          'Independencia de Cuenca',
          'Navidad',
        ];

        expectedBasicHolidays.forEach((holidayName) => {
          expect(result.some((holiday) => holiday.name === holidayName)).toBe(
            true
          );
        });

        expect(result).toHaveLength(8);
      });

      it('should return additional holidays for 2025', async () => {
        const result = await holidayService.getEcuadorHolidays(2025);

        const expectedAdditionalHolidays = ['Carnaval', 'Viernes Santo'];

        expectedAdditionalHolidays.forEach((holidayName) => {
          expect(result.some((holiday) => holiday.name === holidayName)).toBe(
            true
          );
        });

        // Should have 8 basic holidays + 3 additional for 2025 (2 Carnaval + 1 Viernes Santo)
        expect(result).toHaveLength(11);

        // Check specific 2025 dates
        expect(
          result.some(
            (holiday) =>
              holiday.date === '2025-03-03' && holiday.name === 'Carnaval'
          )
        ).toBe(true);
        expect(
          result.some(
            (holiday) =>
              holiday.date === '2025-03-04' && holiday.name === 'Carnaval'
          )
        ).toBe(true);
        expect(
          result.some(
            (holiday) =>
              holiday.date === '2025-04-18' && holiday.name === 'Viernes Santo'
          )
        ).toBe(true);
      });

      it('should return correct date format for different years', async () => {
        const result2023 = await holidayService.getEcuadorHolidays(2023);
        const result2026 = await holidayService.getEcuadorHolidays(2026);

        // Check that years are correctly interpolated in dates
        expect(
          result2023.some((holiday) => holiday.date === '2023-01-01')
        ).toBe(true);
        expect(
          result2026.some((holiday) => holiday.date === '2026-01-01')
        ).toBe(true);
      });
    });
  });

  describe('isHoliday', () => {
    beforeEach(() => {
      holidayService = new HolidayService('');
    });

    it('should return holiday when date matches', () => {
      const holidays: Holiday[] = [
        {
          date: '2024-01-01',
          name: "New Year's Day",
          type: 'national',
          country: 'EC',
          global: true,
        },
        {
          date: '2024-12-25',
          name: 'Christmas Day',
          type: 'national',
          country: 'EC',
          global: true,
        },
      ];

      const testDate = new Date('2024-01-01T10:30:00Z');
      const result = holidayService.isHoliday(testDate, holidays);

      expect(result).toEqual({
        date: '2024-01-01',
        name: "New Year's Day",
        type: 'national',
        country: 'EC',
        global: true,
      });
    });

    it('should return null when date does not match any holiday', () => {
      const holidays: Holiday[] = [
        {
          date: '2024-01-01',
          name: "New Year's Day",
          type: 'national',
          country: 'EC',
          global: true,
        },
      ];

      const testDate = new Date('2024-01-02T10:30:00Z');
      const result = holidayService.isHoliday(testDate, holidays);

      expect(result).toBeNull();
    });

    it('should handle dates with different timezones correctly', () => {
      const holidays: Holiday[] = [
        {
          date: '2024-05-01',
          name: 'Labour Day',
          type: 'national',
          country: 'EC',
          global: true,
        },
      ];

      // Test with different timezone but same date
      const testDate = new Date('2024-05-01T23:59:59+05:00');
      const result = holidayService.isHoliday(testDate, holidays);

      expect(result).toEqual({
        date: '2024-05-01',
        name: 'Labour Day',
        type: 'national',
        country: 'EC',
        global: true,
      });
    });

    it('should return first matching holiday when multiple holidays exist for same date', () => {
      const holidays: Holiday[] = [
        {
          date: '2024-01-01',
          name: "New Year's Day",
          type: 'national',
          country: 'EC',
          global: true,
        },
        {
          date: '2024-01-01',
          name: 'Another Holiday',
          type: 'regional',
          country: 'EC',
          global: false,
        },
      ];

      const testDate = new Date('2024-01-01T12:00:00Z');
      const result = holidayService.isHoliday(testDate, holidays);

      expect(result).toEqual({
        date: '2024-01-01',
        name: "New Year's Day",
        type: 'national',
        country: 'EC',
        global: true,
      });
    });

    it('should handle empty holidays array', () => {
      const holidays: Holiday[] = [];
      const testDate = new Date('2024-01-01T12:00:00Z');

      const result = holidayService.isHoliday(testDate, holidays);

      expect(result).toBeNull();
    });
  });

  describe('integration tests', () => {
    it('should work with real holiday data from getEcuadorHolidays', async () => {
      holidayService = new HolidayService('');

      const holidays = await holidayService.getEcuadorHolidays(2025);
      const newYearDate = new Date('2025-01-01T12:00:00Z');

      const result = holidayService.isHoliday(newYearDate, holidays);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Año Nuevo');
      expect(result?.date).toBe('2025-01-01');
    });

    it('should correctly identify Carnaval holidays for 2025', async () => {
      holidayService = new HolidayService('');

      const holidays = await holidayService.getEcuadorHolidays(2025);

      const carnaval1 = new Date('2025-03-03T12:00:00Z');
      const carnaval2 = new Date('2025-03-04T12:00:00Z');
      const nonHoliday = new Date('2025-03-05T12:00:00Z');

      const result1 = holidayService.isHoliday(carnaval1, holidays);
      const result2 = holidayService.isHoliday(carnaval2, holidays);
      const result3 = holidayService.isHoliday(nonHoliday, holidays);

      expect(result1?.name).toBe('Carnaval');
      expect(result2?.name).toBe('Carnaval');
      expect(result3).toBeNull();
    });
  });
});
