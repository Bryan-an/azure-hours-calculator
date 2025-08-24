import axios from 'axios';
import { Holiday } from '../types';

const CALENDARIFIC_API_KEY = process.env.REACT_APP_CALENDARIFIC_API_KEY;
const HOLIDAY_API_BASE_URL = 'https://calendarific.com/api/v2';

export class HolidayService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CALENDARIFIC_API_KEY || '';
  }

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

      return response.data.response.holidays.map((holiday: any): Holiday => ({
        date: holiday.date.iso,
        name: holiday.name,
        type: holiday.type[0],
        country: 'EC',
        global: holiday.global || false,
      }));
    } catch (error) {
      console.error('Error fetching holidays from API:', error);
      return this.getStaticEcuadorHolidays(year);
    }
  }

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

  isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateString = date.toISOString().split('T')[0];
    return holidays.find(holiday => holiday.date === dateString) || null;
  }
}