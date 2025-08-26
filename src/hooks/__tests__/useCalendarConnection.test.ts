import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarConnection } from '../useCalendarConnection';
import { ICalService } from '../../services/iCalService';
import { useSettingsStore } from '../../stores/settingsStore';

// Mock ICalService
vi.mock('../../services/iCalService', () => ({
  ICalService: vi.fn().mockImplementation(() => ({
    testConnection: vi.fn(),
  })),
}));

// Mock useSettingsStore
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

describe('useCalendarConnection', () => {
  const mockICalUrl =
    'https://calendar.google.com/calendar/ical/test/basic.ics';

  const mockSetICalUrl = vi.fn();
  const mockTestConnection = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    (useSettingsStore as any).mockReturnValue({
      icalUrl: mockICalUrl,
      setICalUrl: mockSetICalUrl,
    });

    (ICalService as any).mockImplementation(() => ({
      testConnection: mockTestConnection,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    test('should return initial state correctly', () => {
      const { result } = renderHook(() => useCalendarConnection());

      expect(result.current.icalConnectionStatus).toBe('idle');
      expect(result.current.icalUrl).toBe(mockICalUrl);
      expect(result.current.setICalUrl).toBe(mockSetICalUrl);
      expect(typeof result.current.testICalConnection).toBe('function');
      expect(typeof result.current.resetICalConnection).toBe('function');
    });

    test('should handle empty icalUrl from store', () => {
      (useSettingsStore as any).mockReturnValue({
        icalUrl: '',
        setICalUrl: mockSetICalUrl,
      });

      const { result } = renderHook(() => useCalendarConnection());

      expect(result.current.icalUrl).toBe('');
      expect(result.current.icalConnectionStatus).toBe('idle');
    });

    test('should handle undefined icalUrl from store', () => {
      (useSettingsStore as any).mockReturnValue({
        icalUrl: undefined,
        setICalUrl: mockSetICalUrl,
      });

      const { result } = renderHook(() => useCalendarConnection());

      expect(result.current.icalUrl).toBeUndefined();
      expect(result.current.icalConnectionStatus).toBe('idle');
    });
  });

  describe('testICalConnection', () => {
    test('should set status to error when icalUrl is empty', async () => {
      (useSettingsStore as any).mockReturnValue({
        icalUrl: '',
        setICalUrl: mockSetICalUrl,
      });

      const { result } = renderHook(() => useCalendarConnection());

      await act(async () => {
        await result.current.testICalConnection();
      });

      expect(result.current.icalConnectionStatus).toBe('error');
      expect(mockTestConnection).not.toHaveBeenCalled();
    });

    test('should set status to error when icalUrl is only whitespace', async () => {
      (useSettingsStore as any).mockReturnValue({
        icalUrl: '   ',
        setICalUrl: mockSetICalUrl,
      });

      const { result } = renderHook(() => useCalendarConnection());

      await act(async () => {
        await result.current.testICalConnection();
      });

      expect(result.current.icalConnectionStatus).toBe('error');
      expect(mockTestConnection).not.toHaveBeenCalled();
    });

    test('should set status to error when icalUrl is undefined', async () => {
      (useSettingsStore as any).mockReturnValue({
        icalUrl: undefined,
        setICalUrl: mockSetICalUrl,
      });

      const { result } = renderHook(() => useCalendarConnection());

      await act(async () => {
        await result.current.testICalConnection();
      });

      expect(result.current.icalConnectionStatus).toBe('error');
      expect(mockTestConnection).not.toHaveBeenCalled();
    });

    test('should successfully test connection when URL is valid', async () => {
      mockTestConnection.mockResolvedValue(true);

      const { result } = renderHook(() => useCalendarConnection());

      // Check initial state
      expect(result.current.icalConnectionStatus).toBe('idle');

      await act(async () => {
        await result.current.testICalConnection();
      });

      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('success');
      });

      expect(ICalService).toHaveBeenCalledWith({ url: mockICalUrl });
      expect(mockTestConnection).toHaveBeenCalledOnce();
    });

    test('should set status to error when connection test fails', async () => {
      mockTestConnection.mockResolvedValue(false);

      const { result } = renderHook(() => useCalendarConnection());

      await act(async () => {
        await result.current.testICalConnection();
      });

      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('error');
      });

      expect(ICalService).toHaveBeenCalledWith({ url: mockICalUrl });
      expect(mockTestConnection).toHaveBeenCalledOnce();
    });

    test('should set status to testing during connection test', async () => {
      let resolveConnection: (value: boolean) => void;

      const connectionPromise = new Promise<boolean>((resolve) => {
        resolveConnection = resolve;
      });

      mockTestConnection.mockReturnValue(connectionPromise);

      const { result } = renderHook(() => useCalendarConnection());

      // Start the connection test
      act(() => {
        result.current.testICalConnection();
      });

      // Check that status is set to testing immediately
      expect(result.current.icalConnectionStatus).toBe('testing');

      // Resolve the connection test
      await act(async () => {
        resolveConnection!(true);
        await connectionPromise;
      });

      // Check final status
      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('success');
      });
    });

    test('should handle connection test exception', async () => {
      mockTestConnection.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCalendarConnection());

      await act(async () => {
        await result.current.testICalConnection();
      });

      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('error');
      });

      expect(ICalService).toHaveBeenCalledWith({ url: mockICalUrl });
      expect(mockTestConnection).toHaveBeenCalledOnce();
    });

    test('should create new ICalService instance for each test', async () => {
      mockTestConnection.mockResolvedValue(true);

      const { result } = renderHook(() => useCalendarConnection());

      // Test connection twice
      await act(async () => {
        await result.current.testICalConnection();
      });

      await act(async () => {
        await result.current.testICalConnection();
      });

      expect(ICalService).toHaveBeenCalledTimes(2);
      expect(ICalService).toHaveBeenNthCalledWith(1, { url: mockICalUrl });
      expect(ICalService).toHaveBeenNthCalledWith(2, { url: mockICalUrl });
    });
  });

  describe('resetICalConnection', () => {
    test('should reset connection status to idle', async () => {
      const { result } = renderHook(() => useCalendarConnection());

      // First set status to something other than idle
      mockTestConnection.mockResolvedValue(true);

      await act(async () => {
        await result.current.testICalConnection();
      });

      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('success');
      });

      // Now reset
      act(() => {
        result.current.resetICalConnection();
      });

      expect(result.current.icalConnectionStatus).toBe('idle');
    });

    test('should reset from error status to idle', async () => {
      const { result } = renderHook(() => useCalendarConnection());

      // First set status to error
      mockTestConnection.mockResolvedValue(false);

      await act(async () => {
        await result.current.testICalConnection();
      });

      await waitFor(() => {
        expect(result.current.icalConnectionStatus).toBe('error');
      });

      // Now reset
      act(() => {
        result.current.resetICalConnection();
      });

      expect(result.current.icalConnectionStatus).toBe('idle');
    });

    test('should not affect other returned values when resetting', () => {
      const { result } = renderHook(() => useCalendarConnection());

      act(() => {
        result.current.resetICalConnection();
      });

      expect(result.current.icalUrl).toBe(mockICalUrl);
      expect(result.current.setICalUrl).toBe(mockSetICalUrl);
      expect(typeof result.current.testICalConnection).toBe('function');
      expect(typeof result.current.resetICalConnection).toBe('function');
    });
  });

  describe('Store integration', () => {
    test('should update when icalUrl changes in store', () => {
      const { result, rerender } = renderHook(() => useCalendarConnection());

      expect(result.current.icalUrl).toBe(mockICalUrl);

      // Update store mock
      const newUrl =
        'https://calendar.google.com/calendar/ical/new-test/basic.ics';

      (useSettingsStore as any).mockReturnValue({
        icalUrl: newUrl,
        setICalUrl: mockSetICalUrl,
      });

      rerender();

      expect(result.current.icalUrl).toBe(newUrl);
    });

    test('should expose setICalUrl from store', () => {
      const { result } = renderHook(() => useCalendarConnection());

      act(() => {
        result.current.setICalUrl('new-url');
      });

      expect(mockSetICalUrl).toHaveBeenCalledWith('new-url');
    });
  });

  describe('Function stability', () => {
    test('should maintain function references when icalUrl changes', () => {
      const { result, rerender } = renderHook(() => useCalendarConnection());

      const initialTestFunction = result.current.testICalConnection;
      const initialResetFunction = result.current.resetICalConnection;

      // Update store mock
      (useSettingsStore as any).mockReturnValue({
        icalUrl: 'new-url',
        setICalUrl: mockSetICalUrl,
      });

      rerender();

      // Functions should be new instances due to useCallback dependencies
      expect(result.current.testICalConnection).not.toBe(initialTestFunction);
      expect(result.current.resetICalConnection).toBe(initialResetFunction);
    });

    test('should maintain resetICalConnection function reference', () => {
      const { result, rerender } = renderHook(() => useCalendarConnection());

      const initialResetFunction = result.current.resetICalConnection;

      // Multiple rerenders
      rerender();
      rerender();

      expect(result.current.resetICalConnection).toBe(initialResetFunction);
    });
  });
});
