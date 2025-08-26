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

  // Holiday API (si usas alguna API externa para festivos)
  http.get('https://api.example.com/holidays', () => {
    return HttpResponse.json([
      {
        date: '2024-01-01',
        name: "New Year's Day",
        country: 'US',
      },
      {
        date: '2024-12-25',
        name: 'Christmas Day',
        country: 'US',
      },
    ]);
  }),

  // Catch-all handler para requests no manejados en desarrollo
  http.all('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.method} ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

// Configurar el servidor MSW
export const server = setupServer(...handlers);
