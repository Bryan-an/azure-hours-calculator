import { useState, useCallback } from 'react';
import { ICalConnectionStatus } from '../types';
import { ICalService } from '../services/iCalService';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Custom React hook for managing iCal calendar connections.
 *
 * This hook provides functionality to test, manage, and track the status of
 * iCal calendar connections. It integrates with the settings store to persist
 * the iCal URL and manages connection testing lifecycle.
 *
 * @returns An object containing connection status, test functions, and URL management
 *
 * @example
 * ```typescript
 * const {
 *   icalConnectionStatus,
 *   testICalConnection,
 *   resetICalConnection,
 *   icalUrl,
 *   setICalUrl
 * } = useCalendarConnection();
 *
 * // Set an iCal URL
 * setICalUrl('https://example.com/calendar.ics');
 *
 * // Test the connection
 * await testICalConnection();
 *
 * // Check the status
 * console.log(icalConnectionStatus); // 'idle' | 'testing' | 'success' | 'error'
 * ```
 */
export const useCalendarConnection = () => {
  const { icalUrl, setICalUrl } = useSettingsStore();

  const [icalConnectionStatus, setIcalConnectionStatus] =
    useState<ICalConnectionStatus>('idle');

  /**
   * Tests the iCal connection by attempting to connect to the configured URL.
   *
   * This function validates the iCal URL, creates an ICalService instance,
   * and tests the connection. It updates the connection status throughout
   * the testing process.
   *
   * @returns A promise that resolves when the test is complete
   *
   * @remarks
   * - Sets status to 'error' if URL is empty or invalid
   * - Sets status to 'testing' during the connection attempt
   * - Sets status to 'success' if connection succeeds
   * - Sets status to 'error' if connection fails or throws an exception
   */
  const testICalConnection = useCallback(async () => {
    if (!icalUrl || !icalUrl.trim()) {
      setIcalConnectionStatus('error');
      return;
    }

    setIcalConnectionStatus('testing');

    try {
      const icalService = new ICalService({ url: icalUrl });
      const isConnected = await icalService.testConnection();
      setIcalConnectionStatus(isConnected ? 'success' : 'error');
    } catch {
      setIcalConnectionStatus('error');
    }
  }, [icalUrl]);

  /**
   * Resets the iCal connection status back to idle state.
   *
   * This function is useful when you want to clear the connection status
   * without performing a new test, such as when the user changes the URL
   * or wants to start fresh.
   *
   * @returns void
   */
  const resetICalConnection = useCallback(() => {
    setIcalConnectionStatus('idle');
  }, []);

  return {
    /**
     * Current status of the iCal connection test.
     */
    icalConnectionStatus,

    /**
     * Function to test the iCal connection asynchronously.
     */
    testICalConnection,

    /**
     * Function to reset the connection status to idle.
     */
    resetICalConnection,

    /**
     * Current iCal URL from the settings store.
     */
    icalUrl,

    /**
     * Function to update the iCal URL in the settings store.
     */
    setICalUrl,
  };
};
