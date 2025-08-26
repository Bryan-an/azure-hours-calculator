import { useState, useCallback } from 'react';
import { ICalConnectionStatus } from '../types';
import { ICalService } from '../services/iCalService';
import { useSettingsStore } from '../stores/settingsStore';

export const useCalendarConnection = () => {
  const { icalUrl, setICalUrl } = useSettingsStore();

  const [icalConnectionStatus, setIcalConnectionStatus] =
    useState<ICalConnectionStatus>('idle');

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

  const resetICalConnection = useCallback(() => {
    setIcalConnectionStatus('idle');
  }, []);

  return {
    icalConnectionStatus,
    testICalConnection,
    resetICalConnection,
    icalUrl,
    setICalUrl,
  };
};
