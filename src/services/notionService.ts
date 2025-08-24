import axios from 'axios';
import { Meeting } from '../types';

const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

export class NotionService {
  private apiKey: string;
  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.apiKey = apiKey;
    this.databaseId = databaseId;
  }

  async getMeetings(startDate: Date, endDate: Date): Promise<Meeting[]> {
    if (!this.apiKey || !this.databaseId) {
      console.warn('Notion API key or database ID not configured');
      return [];
    }

    try {
      const response = await axios.post(
        `${NOTION_API_BASE_URL}/databases/${this.databaseId}/query`,
        {
          filter: {
            and: [
              {
                property: 'Date',
                date: {
                  on_or_after: startDate.toISOString().split('T')[0],
                },
              },
              {
                property: 'Date',
                date: {
                  on_or_before: endDate.toISOString().split('T')[0],
                },
              },
            ],
          },
          sorts: [
            {
              property: 'Date',
              direction: 'ascending',
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      return response.data.results.map((page: any): Meeting => {
        const properties = page.properties;
        const dateProperty = properties.Date?.date;
        const titleProperty = properties.Title?.title?.[0]?.plain_text || 'Sin título';
        const isOptionalProperty = properties.Optional?.checkbox || false;

        // Construir fecha de inicio y fin
        const startDateTime = new Date(dateProperty?.start || dateProperty?.date);
        const endDateTime = dateProperty?.end ? new Date(dateProperty.end) : new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hora por defecto

        return {
          id: page.id,
          title: titleProperty,
          start: startDateTime,
          end: endDateTime,
          isOptional: isOptionalProperty,
        };
      });
    } catch (error) {
      console.error('Error fetching meetings from Notion:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.databaseId) {
      return false;
    }

    try {
      await axios.get(`${NOTION_API_BASE_URL}/databases/${this.databaseId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      });
      return true;
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      return false;
    }
  }
}