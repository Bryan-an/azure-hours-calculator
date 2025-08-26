import axios from 'axios';
import { Holiday } from '../types';

/** API key for Calendarific service from environment variables */
const CALENDARIFIC_API_KEY = process.env.REACT_APP_CALENDARIFIC_API_KEY;

/** Base URL for the Calendarific holidays API */
const HOLIDAY_API_BASE_URL = 'https://calendarific.com/api/v2';

/**
 * Service class for managing Ecuador holidays
 *
 * This service provides methods to fetch Ecuador holidays either from the Calendarific API
 * or from a static fallback list. It handles API failures gracefully by falling back to predefined holidays.
 *
 * @example
 * ```typescript
 * const holidayService = new HolidayService('your-api-key');
 * const holidays = await holidayService.getEcuadorHolidays(2025);
 * const isDateHoliday = holidayService.isHoliday(new Date('2025-01-01'), holidays);
 * ```
 *
 * @public
 */
export class HolidayService {
  /** API key for accessing the Calendarific service */
  private apiKey: string;

  /**
   * Creates a new instance of HolidayService
   *
   * @param apiKey - Optional API key for Calendarific service. If not provided, will use environment variable
   *
   * @example
   * ```typescript
   * // Using environment variable
   * const service = new HolidayService();
   *
   * // Using explicit API key
   * const service = new HolidayService('your-api-key');
   * ```
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey || CALENDARIFIC_API_KEY || '';
  }

  /**
   * Retrieves Ecuador holidays for a specific year
   *
   * Fetches holidays from the Calendarific API. If the API is unavailable or fails,
   * it automatically falls back to a static list of Ecuador holidays.
   *
   * @param year - The year for which to fetch holidays (e.g., 2025)
   * @returns Promise that resolves to an array of Holiday objects for Ecuador
   *
   * @throws Will log errors to console if API call fails, but won't throw exceptions (uses fallback)
   *
   * @example
   * ```typescript
   * const holidays = await holidayService.getEcuadorHolidays(2025);
   * console.log(`Found ${holidays.length} holidays for 2025`);
   * ```
   *
   * @public
   */
  async getEcuadorHolidays(year: number): Promise<Holiday[]> {
    if (!this.apiKey) {
      // Fallback a lista estática de feriados ecuatorianos 2025
      return this.getStaticEcuadorHolidays(year);
    }

    try {
      const response = await axios.get(`${HOLIDAY_API_BASE_URL}/holidays`, {
        params: {
          api_key: this.apiKey,
          country: 'EC',
          year: year,
        },
      });

      return response.data.response.holidays.map(
        (holiday: any): Holiday => ({
          date: holiday.date.iso,
          name: holiday.name,
          type: holiday.type[0],
          country: 'EC',
          global: holiday.global || false,
        })
      );
    } catch (error) {
      console.error('Error fetching holidays from API:', error);
      return this.getStaticEcuadorHolidays(year);
    }
  }

  /**
   * Gets static list of Ecuador holidays for a given year
   *
   * Provides a fallback list of Ecuador's national holidays. Includes both fixed dates
   * and specific mobile holidays for certain years (like 2025).
   *
   * @param year - The year for which to get static holidays
   * @returns Array of Holiday objects containing Ecuador's national holidays
   *
   * @remarks
   * This method includes:
   * - Fixed national holidays (New Year, Labor Day, etc.)
   * - Year-specific mobile holidays (Carnival, Good Friday for 2025)
   *
   * @example
   * ```typescript
   * const staticHolidays = holidayService.getStaticEcuadorHolidays(2025);
   * ```
   *
   */
  private getStaticEcuadorHolidays(year: number): Holiday[] {
    // Feriados fijos de Ecuador
    const staticHolidays: Holiday[] = [
      {
        date: `${year}-01-01`,
        name: 'Año Nuevo',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-05-01`,
        name: 'Día del Trabajador',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-05-24`,
        name: 'Batalla del Pichincha',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-08-10`,
        name: 'Primer Grito de Independencia',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-10-09`,
        name: 'Independencia de Guayaquil',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-11-02`,
        name: 'Día de los Difuntos',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-11-03`,
        name: 'Independencia de Cuenca',
        type: 'national',
        country: 'EC',
        global: true,
      },
      {
        date: `${year}-12-25`,
        name: 'Navidad',
        type: 'national',
        country: 'EC',
        global: true,
      },
    ];

    // Feriados específicos para 2025 (fechas móviles)
    if (year === 2025) {
      staticHolidays.push(
        {
          date: '2025-03-03',
          name: 'Carnaval',
          type: 'national',
          country: 'EC',
          global: true,
        },
        {
          date: '2025-03-04',
          name: 'Carnaval',
          type: 'national',
          country: 'EC',
          global: true,
        },
        {
          date: '2025-04-18',
          name: 'Viernes Santo',
          type: 'national',
          country: 'EC',
          global: true,
        }
      );
    }

    return staticHolidays;
  }

  /**
   * Checks if a given date is a holiday
   *
   * Determines whether a specific date matches any holiday in the provided holidays array.
   *
   * @param date - The date to check (as a Date object)
   * @param holidays - Array of holidays to check against
   * @returns The Holiday object if the date is a holiday, null otherwise
   *
   * @example
   * ```typescript
   * const holidays = await holidayService.getEcuadorHolidays(2025);
   * const newYear = new Date('2025-01-01');
   * const holidayInfo = holidayService.isHoliday(newYear, holidays);
   *
   * if (holidayInfo) {
   *   console.log(`${newYear.toDateString()} is ${holidayInfo.name}`);
   * }
   * ```
   *
   * @public
   */
  isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateString = date.toISOString().split('T')[0];
    return holidays.find((holiday) => holiday.date === dateString) || null;
  }
}
