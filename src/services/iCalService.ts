import { Meeting } from '../types';
import { electronUtils } from '../utils/electronUtils';

export interface ICalConfig {
  url: string;
}

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: Date;
  dtend: Date;
  status: string;
  transparency: string;
  description: string;
}

export class ICalService {
  private url: string;

  constructor(config: ICalConfig) {
    this.url = config.url;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Meeting[]> {
    if (!this.url || !this.url.trim()) {
      // iCal URL not configured
      return [];
    }

    try {
      this.logSecurityEvent('ical_access_start', {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        url: this.sanitizeUrl(this.url),
      });

      // Use CORS proxy for Google Calendar URLs to avoid CORS issues
      const proxyUrl = this.needsCorsProxy(this.url)
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(this.url)}`
        : this.url;

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          Accept: this.needsCorsProxy(this.url)
            ? 'application/json'
            : 'text/calendar',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let icalData: string;

      if (this.needsCorsProxy(this.url)) {
        const jsonResponse = await response.json();
        icalData = jsonResponse.contents;
      } else {
        icalData = await response.text();
      }

      const events = this.parseICalData(icalData);

      // Filter events by date range
      const filteredEvents = events.filter((event) => {
        return event.dtstart >= startDate && event.dtstart <= endDate;
      });

      const mappedEvents = filteredEvents.map((event) =>
        this.mapICalEventToMeeting(event)
      );

      this.logSecurityEvent('ical_access_success', {
        eventsCount: events.length,
        filteredEventsCount: mappedEvents.length,
      });

      return mappedEvents;
    } catch (error) {
      this.logSecurityEvent('ical_access_error', {
        error: error instanceof Error ? error.message : 'unknown',
        url: this.sanitizeUrl(this.url),
        usedProxy: this.needsCorsProxy(this.url),
        isElectron: electronUtils.isElectron(),
      });

      // Error fetching iCal data - details logged securely

      throw error; // Re-throw to show user the specific error
    }
  }

  private parseICalData(icalData: string): ICalEvent[] {
    const events: ICalEvent[] = [];
    const lines = icalData.split(/\r?\n/);
    let currentEvent: Partial<ICalEvent> | null = null;
    let currentProperty = '';
    let currentValue = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle line folding (lines that start with space or tab)
      if (line.match(/^[ \t]/) && currentProperty) {
        currentValue += line.substring(1);
        continue;
      }

      // Process previous property if we have one
      if (currentProperty && currentEvent) {
        this.setEventProperty(currentEvent, currentProperty, currentValue);
      }

      // Reset for new property
      currentProperty = '';
      currentValue = '';

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (this.isValidEvent(currentEvent)) {
          events.push(currentEvent as ICalEvent);
        }

        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        currentProperty = line.substring(0, colonIndex);
        currentValue = line.substring(colonIndex + 1);
      }
    }

    return events;
  }

  private setEventProperty(
    event: Partial<ICalEvent>,
    property: string,
    value: string
  ): void {
    // Remove parameters from property name (e.g., "DTSTART;TZID=..." becomes "DTSTART")
    const propName = property.split(';')[0];

    switch (propName) {
      case 'UID':
        event.uid = value;
        break;
      case 'SUMMARY':
        event.summary = value;
        break;
      case 'DTSTART':
        event.dtstart = this.parseICalDate(value);
        break;
      case 'DTEND':
        event.dtend = this.parseICalDate(value);
        break;
      case 'STATUS':
        event.status = value;
        break;
      case 'TRANSP':
        event.transparency = value;
        break;
      case 'DESCRIPTION':
        event.description = value;
        break;
    }
  }

  private parseICalDate(dateString: string): Date {
    // Remove timezone info for simple parsing
    const cleanDate = dateString.replace(/;.*$/, '');

    if (cleanDate.length === 8) {
      // Date only format: YYYYMMDD
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1; // Month is 0-based
      const day = parseInt(cleanDate.substring(6, 8));
      return new Date(year, month, day);
    } else if (cleanDate.length === 16 && cleanDate.endsWith('Z')) {
      // UTC format: YYYYMMDDTHHMMSSZ
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      const hour = parseInt(cleanDate.substring(9, 11));
      const minute = parseInt(cleanDate.substring(11, 13));
      const second = parseInt(cleanDate.substring(13, 15));
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else if (cleanDate.length === 15) {
      // Local format: YYYYMMDDTHHMMSS
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));
      const hour = parseInt(cleanDate.substring(9, 11));
      const minute = parseInt(cleanDate.substring(11, 13));
      const second = parseInt(cleanDate.substring(13, 15));
      return new Date(year, month, day, hour, minute, second);
    }

    // Fallback to ISO parsing
    try {
      const date = new Date(cleanDate);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return new Date();
      }

      return date;
    } catch {
      return new Date();
    }
  }

  private isValidEvent(event: Partial<ICalEvent>): event is ICalEvent {
    return !!(
      event.uid &&
      event.dtstart &&
      event.dtend &&
      !isNaN(event.dtstart.getTime()) &&
      !isNaN(event.dtend.getTime())
    );
  }

  private mapICalEventToMeeting(event: ICalEvent): Meeting {
    const isOptional = this.determineIfEventIsOptional(event);

    return {
      id: event.uid,
      title: event.summary || 'Sin título',
      start: event.dtstart,
      end: event.dtend,
      isOptional: isOptional,
    };
  }

  private determineIfEventIsOptional(event: ICalEvent): boolean {
    // Event is optional if:
    // 1. Status is CANCELLED
    if (event.status === 'CANCELLED') {
      return true;
    }

    // 2. Transparency is TRANSPARENT (means it doesn't block time)
    if (event.transparency === 'TRANSPARENT') {
      return true;
    }

    // 3. Title contains optional keywords (customize as needed)
    const optionalKeywords = [
      'opcional',
      'optional',
      '[opcional]',
      '(opcional)',
    ];

    const title = (event.summary || '').toLowerCase();

    if (optionalKeywords.some((keyword) => title.includes(keyword))) {
      return true;
    }

    return false;
  }

  private needsCorsProxy(url: string): boolean {
    // In Electron, we don't need CORS proxy since there are no CORS restrictions
    if (electronUtils.isElectron()) {
      return false;
    }

    // Check if URL is from domains that typically have CORS restrictions in browsers
    const corsRestrictedDomains = [
      'calendar.google.com',
      'outlook.live.com',
      'outlook.office365.com',
    ];

    try {
      const urlObj = new URL(url);

      return corsRestrictedDomains.some((domain) =>
        urlObj.host.includes(domain)
      );
    } catch {
      return false;
    }
  }

  private sanitizeUrl(url: string): string {
    // Remove sensitive parts from URL for logging
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  private logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        service: 'iCal',
      },
    };

    // Store in localStorage for audit trail
    const existingLogs = JSON.parse(
      localStorage.getItem('calendar_audit_log') || '[]'
    );

    existingLogs.push(logEntry);

    // Keep only last 100 entries
    const recentLogs = existingLogs.slice(-100);
    localStorage.setItem('calendar_audit_log', JSON.stringify(recentLogs));
  }

  async testConnection(): Promise<boolean> {
    if (!this.url || !this.url.trim()) {
      return false;
    }

    try {
      // Use CORS proxy for Google Calendar URLs
      const proxyUrl = this.needsCorsProxy(this.url)
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(this.url)}`
        : this.url;

      const response = await fetch(proxyUrl, {
        method: this.needsCorsProxy(this.url) ? 'GET' : 'HEAD', // Proxy doesn't support HEAD
        headers: {
          Accept: this.needsCorsProxy(this.url)
            ? 'application/json'
            : 'text/calendar',
        },
      });

      let success = response.ok;

      // For proxy requests, also check if the proxied content is valid
      if (success && this.needsCorsProxy(this.url)) {
        try {
          const jsonResponse = await response.json();

          success =
            !!jsonResponse.contents &&
            jsonResponse.contents.includes('BEGIN:VCALENDAR');
        } catch {
          success = false;
        }
      }

      this.logSecurityEvent('ical_connection_test', {
        success,
        status: response.status,
        usedProxy: this.needsCorsProxy(this.url),
        url: this.sanitizeUrl(this.url),
      });

      return success;
    } catch (error) {
      this.logSecurityEvent('ical_connection_test', {
        success: false,
        error: error instanceof Error ? error.message : 'unknown',
        usedProxy: this.needsCorsProxy(this.url),
        url: this.sanitizeUrl(this.url),
      });

      // Connection test failed
      return false;
    }
  }
}
