import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Definir handlers para las APIs que necesitamos mockear
export const handlers = [
  // Google Calendar API handlers
  http.get(
    'https://www.googleapis.com/calendar/v3/calendars/:calendarId/events',
    () => {
      return HttpResponse.json({
        items: [
          {
            id: 'test-event-1',
            summary: 'Test Event',
            start: {
              dateTime: '2024-01-15T09:00:00Z',
            },
            end: {
              dateTime: '2024-01-15T10:00:00Z',
            },
          },
        ],
      });
    }
  ),

  // Google Auth endpoints
  http.post('https://oauth2.googleapis.com/token', () => {
    return HttpResponse.json({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer',
    });
  }),

  // Calendarific API for Ecuador holidays (used by HolidayService)
  http.get('https://calendarific.com/api/v2/holidays', ({ request }) => {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const year = url.searchParams.get('year');

    if (country === 'EC' && year === '2024') {
      return HttpResponse.json({
        response: {
          holidays: [
            {
              date: { iso: '2024-01-01' },
              name: 'Año Nuevo',
              type: ['National'],
              global: true,
            },
            {
              date: { iso: '2024-05-01' },
              name: 'Día del Trabajador',
              type: ['National'],
              global: true,
            },
            {
              date: { iso: '2024-12-25' },
              name: 'Navidad',
              type: ['National'],
              global: true,
            },
          ],
        },
      });
    }

    // Fallback for other countries/years
    return HttpResponse.json({
      response: {
        holidays: [],
      },
    });
  }),

  // Catch-all handler para requests no manejados en desarrollo
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

// Configurar el servidor MSW
export const server = setupServer(...handlers);
