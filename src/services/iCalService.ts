import { Meeting } from '../types';
import { electronUtils } from '../utils/electronUtils';

/**
 * Configuration interface for iCal service connection.
 */
export interface ICalConfig {
  /** The iCal URL to fetch calendar events from */
  url: string;
}

/**
 * Represents an iCal event with parsed properties.
 */
interface ICalEvent {
  /** Unique identifier for the event */
  uid: string;
  /** Event title/summary */
  summary: string;
  /** Event start date and time */
  dtstart: Date;
  /** Event end date and time */
  dtend: Date;
  /** Event status (e.g., CONFIRMED, CANCELLED) */
  status: string;
  /** Event transparency (OPAQUE or TRANSPARENT) */
  transparency: string;
  /** Event description or notes */
  description: string;
}

/**
 * Service for fetching and parsing iCal calendar data from various calendar providers.
 *
 * This service handles:
 * - Fetching iCal data from URLs with CORS proxy support
 * - Parsing iCal format into structured events
 * - Converting events to Meeting objects
 * - Connection testing and validation
 * - Security logging and audit trails
 *
 * @example
 * ```typescript
 * const icalService = new ICalService({
 *   url: 'https://calendar.google.com/calendar/ical/user@gmail.com/public/basic.ics'
 * });
 *
 * const meetings = await icalService.getEvents(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31')
 * );
 * ```
 */
export class ICalService {
  /** The iCal URL configured for this service instance */
  private url: string;

  /**
   * Creates a new ICalService instance.
   *
   * @param config - Configuration object containing the iCal URL
   */
  constructor(config: ICalConfig) {
    this.url = config.url;
  }

  /**
   * Fetches and parses iCal events within the specified date range.
   *
   * This method:
   * - Validates the configured URL
   * - Uses CORS proxy for restricted domains when needed
   * - Parses iCal data into structured events
   * - Filters events by the specified date range
   * - Logs security events for audit purposes
   *
   * @param startDate - The start date for filtering events (inclusive)
   * @param endDate - The end date for filtering events (inclusive)
   * @returns Promise that resolves to an array of Meeting objects
   * @throws When the HTTP request fails or iCal data cannot be parsed
   *
   * @example
   * ```typescript
   * const events = await icalService.getEvents(
   *   new Date('2024-01-01'),
   *   new Date('2024-01-31')
   * );
   * console.log(`Found ${events.length} events`);
   * ```
   */
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

  /**
   * Parses raw iCal data string into an array of structured ICalEvent objects.
   *
   * This method handles:
   * - Line folding (multi-line values)
   * - VEVENT blocks parsing
   * - Property extraction and validation
   * - Event validation before inclusion
   *
   * @param icalData - Raw iCal format string data
   * @returns Array of parsed and validated ICalEvent objects
   *
   * @remarks
   * The parser handles the most common iCal properties: UID, SUMMARY, DTSTART, DTEND,
   * STATUS, TRANSP (transparency), and DESCRIPTION. Events missing required properties
   * (uid, dtstart, dtend) are filtered out.
   */
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

  /**
   * Sets a property value on an ICalEvent object based on the property name.
   *
   * This method maps iCal property names to ICalEvent object properties and handles
   * property parameters (e.g., DTSTART;TZID=... becomes DTSTART).
   *
   * @param event - Partial ICalEvent object being constructed
   * @param property - iCal property name (may include parameters after semicolon)
   * @param value - Property value to set
   *
   * @remarks
   * Property parameters (after semicolon) are stripped from the property name.
   * Date properties are parsed using parseICalDate method.
   */
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

  /**
   * Parses iCal date strings into JavaScript Date objects.
   *
   * Supports multiple iCal date formats:
   * - Date only: YYYYMMDD
   * - UTC datetime: YYYYMMDDTHHMMSSZ
   * - Local datetime: YYYYMMDDTHHMMSS
   * - ISO format as fallback
   *
   * @param dateString - iCal formatted date string
   * @returns Parsed Date object, or current date if parsing fails
   *
   * @example
   * ```typescript
   * // Date only
   * parseICalDate('20240115') // → January 15, 2024
   *
   * // UTC datetime
   * parseICalDate('20240115T143000Z') // → January 15, 2024 14:30:00 UTC
   *
   * // Local datetime
   * parseICalDate('20240115T143000') // → January 15, 2024 14:30:00 local
   * ```
   */
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

  /**
   * Type guard to validate if a partial event object is a complete ICalEvent.
   *
   * @param event - Partial event object to validate
   * @returns True if event has all required properties with valid dates
   *
   * @remarks
   * Required properties are: uid, dtstart, dtend with valid Date objects.
   */
  private isValidEvent(event: Partial<ICalEvent>): event is ICalEvent {
    return !!(
      event.uid &&
      event.dtstart &&
      event.dtend &&
      !isNaN(event.dtstart.getTime()) &&
      !isNaN(event.dtend.getTime())
    );
  }

  /**
   * Converts an ICalEvent object to a Meeting object for the application.
   *
   * @param event - ICalEvent to convert
   * @returns Meeting object with mapped properties
   *
   * @remarks
   * The isOptional property is determined using business logic in determineIfEventIsOptional.
   * Events without titles are assigned "Sin título" as default.
   */
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

  /**
   * Determines if an event should be considered optional based on various criteria.
   *
   * An event is considered optional if:
   * 1. Status is CANCELLED
   * 2. Transparency is TRANSPARENT (doesn't block time)
   * 3. Title contains optional keywords in Spanish or English
   *
   * @param event - ICalEvent to evaluate
   * @returns True if the event should be treated as optional
   *
   * @example
   * ```typescript
   * // These events would be considered optional:
   * // - Status: CANCELLED
   * // - Transparency: TRANSPARENT
   * // - Title: "Meeting (opcional)"
   * // - Title: "Optional standup"
   * ```
   */
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

  /**
   * Determines if a URL requires CORS proxy to bypass browser restrictions.
   *
   * @param url - URL to check for CORS restrictions
   * @returns True if the URL requires CORS proxy for browser access
   *
   * @remarks
   * In Electron environment, CORS proxy is never needed since there are no CORS restrictions.
   * For web browsers, certain domains are known to have CORS restrictions.
   */
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

  /**
   * Creates a sanitized version of the URL for secure logging purposes.
   *
   * Removes sensitive query parameters and fragments while preserving the basic URL structure.
   *
   * @param url - Original URL to sanitize
   * @returns Sanitized URL string with protocol, host, and path only
   *
   * @example
   * ```typescript
   * sanitizeUrl('https://calendar.google.com/calendar/ical/user@gmail.com/private-xyz/basic.ics')
   * // Returns: 'https://calendar.google.com/calendar/ical/user@gmail.com/private-xyz/basic.ics'
   * ```
   */
  private sanitizeUrl(url: string): string {
    // Remove sensitive parts from URL for logging
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * Logs security events for audit trail and monitoring purposes.
   *
   * Events are stored in localStorage with timestamp, event type, and contextual details.
   * Only the most recent 100 log entries are retained.
   *
   * @param event - Event type identifier
   * @param details - Additional context and data for the event
   *
   * @remarks
   * Log entries include timestamp, user agent, service identifier, and provided details.
   * This provides an audit trail for calendar access and security monitoring.
   */
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

  /**
   * Tests the connection to the configured iCal URL to verify accessibility.
   *
   * This method:
   * - Validates the URL configuration
   * - Performs a lightweight request (HEAD or GET through proxy)
   * - Validates response content for proxy requests
   * - Logs the connection test results
   *
   * @returns Promise that resolves to true if connection is successful, false otherwise
   *
   * @example
   * ```typescript
   * const isConnected = await icalService.testConnection();
   * if (!isConnected) {
   *   console.error('Cannot connect to iCal URL');
   * }
   * ```
   */
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
