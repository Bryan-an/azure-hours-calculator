import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClipboard } from '../useClipboard';
import { useUIStore } from '../../stores/uiStore';

// Mock the UI store
vi.mock('../../stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// Mock console.error to avoid noise in tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('useClipboard', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useUIStore as any).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard successfully with default message', async () => {
      const { result } = renderHook(() => useClipboard());
      const testText = 'Test text to copy';

      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(testText);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);

      expect(mockShowToast).toHaveBeenCalledWith(
        'Texto copiado al portapapeles',
        'success'
      );

      expect(success).toBe(true);
    });

    it('should copy text to clipboard successfully with custom message', async () => {
      const { result } = renderHook(() => useClipboard());
      const testText = 'Test text to copy';
      const customMessage = 'Custom success message';

      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(testText, customMessage);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
      expect(mockShowToast).toHaveBeenCalledWith(customMessage, 'success');
      expect(success).toBe(true);
    });

    it('should handle clipboard write error and show error toast', async () => {
      const { result } = renderHook(() => useClipboard());
      const testText = 'Test text to copy';
      const clipboardError = new Error('Clipboard write failed');

      mockClipboard.writeText.mockRejectedValueOnce(clipboardError);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(testText);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al copiar al portapapeles:',
        clipboardError
      );

      expect(mockShowToast).toHaveBeenCalledWith(
        'Error al copiar al portapapeles',
        'error'
      );

      expect(success).toBe(false);
    });

    it('should handle clipboard write error with custom message', async () => {
      const { result } = renderHook(() => useClipboard());
      const testText = 'Test text to copy';
      const customMessage = 'Custom success message';
      const clipboardError = new Error('Clipboard write failed');

      mockClipboard.writeText.mockRejectedValueOnce(clipboardError);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(testText, customMessage);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al copiar al portapapeles:',
        clipboardError
      );

      expect(mockShowToast).toHaveBeenCalledWith(
        'Error al copiar al portapapeles',
        'error'
      );

      expect(success).toBe(false);
    });

    it('should handle empty string input', async () => {
      const { result } = renderHook(() => useClipboard());
      const emptyText = '';

      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(emptyText);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(emptyText);

      expect(mockShowToast).toHaveBeenCalledWith(
        'Texto copiado al portapapeles',
        'success'
      );

      expect(success).toBe(true);
    });

    it('should handle special characters in text', async () => {
      const { result } = renderHook(() => useClipboard());
      const specialText = 'Text with special chars: ñáéíóú!@#$%^&*()';

      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(specialText);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(specialText);

      expect(mockShowToast).toHaveBeenCalledWith(
        'Texto copiado al portapapeles',
        'success'
      );

      expect(success).toBe(true);
    });

    it('should handle long text input', async () => {
      const { result } = renderHook(() => useClipboard());
      const longText = 'A'.repeat(10000); // 10KB of text

      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      let success: boolean | undefined;

      await act(async () => {
        success = await result.current.copyToClipboard(longText);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(longText);

      expect(mockShowToast).toHaveBeenCalledWith(
        'Texto copiado al portapapeles',
        'success'
      );

      expect(success).toBe(true);
    });

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useClipboard());

      const firstCopyFunction = result.current.copyToClipboard;

      rerender();

      const secondCopyFunction = result.current.copyToClipboard;

      expect(firstCopyFunction).toBe(secondCopyFunction);
    });

    it('should handle multiple consecutive calls', async () => {
      const { result } = renderHook(() => useClipboard());
      const texts = ['Text 1', 'Text 2', 'Text 3'];

      mockClipboard.writeText.mockResolvedValue(undefined);

      await act(async () => {
        for (const text of texts) {
          await result.current.copyToClipboard(text);
        }
      });

      expect(mockClipboard.writeText).toHaveBeenCalledTimes(3);
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(1, 'Text 1');
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(2, 'Text 2');
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(3, 'Text 3');
      expect(mockShowToast).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const { result } = renderHook(() => useClipboard());
      const successText = 'Success text';
      const failureText = 'Failure text';

      mockClipboard.writeText
        .mockResolvedValueOnce(undefined) // First call succeeds
        .mockRejectedValueOnce(new Error('Clipboard error')); // Second call fails

      let firstResult: boolean | undefined;
      let secondResult: boolean | undefined;

      await act(async () => {
        firstResult = await result.current.copyToClipboard(successText);
        secondResult = await result.current.copyToClipboard(failureText);
      });

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);
      expect(mockShowToast).toHaveBeenCalledTimes(2);

      expect(mockShowToast).toHaveBeenNthCalledWith(
        1,
        'Texto copiado al portapapeles',
        'success'
      );

      expect(mockShowToast).toHaveBeenNthCalledWith(
        2,
        'Error al copiar al portapapeles',
        'error'
      );
    });
  });

  describe('hook structure', () => {
    it('should return an object with copyToClipboard function', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current).toHaveProperty('copyToClipboard');
      expect(typeof result.current.copyToClipboard).toBe('function');
    });

    it('should not return unexpected properties', () => {
      const { result } = renderHook(() => useClipboard());

      const keys = Object.keys(result.current);
      expect(keys).toEqual(['copyToClipboard']);
    });
  });
});
