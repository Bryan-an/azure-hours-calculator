import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * Custom hook for clipboard operations
 *
 * This hook provides functionality to copy text to the system clipboard
 * with user feedback through toast notifications. It handles both successful
 * and failed clipboard operations gracefully.
 *
 * Features:
 * - Copy text to system clipboard
 * - Automatic success/error toast notifications
 * - Customizable success messages
 * - Error handling with fallback notifications
 *
 * @example
 * ```typescript
 * const { copyToClipboard } = useClipboard();
 *
 * // Copy with default success message
 * await copyToClipboard('Hello World');
 *
 * // Copy with custom success message
 * await copyToClipboard('Hello World', 'Text copied successfully!');
 *
 * // Handle the result
 * const success = await copyToClipboard('Hello World');
 * if (success) {
 *   console.log('Text copied successfully');
 * }
 * ```
 *
 * @returns Object containing clipboard operation functions
 * @returns returns.copyToClipboard - Function to copy text to clipboard
 *
 * @public
 */
export const useClipboard = () => {
  const { showToast } = useUIStore();

  /**
   * Copy text to the system clipboard
   *
   * Attempts to copy the provided text to the system clipboard using the
   * Navigator Clipboard API. Shows appropriate toast notifications for
   * success or failure states.
   *
   * @param text - The text to copy to the clipboard
   * @param successMessage - Optional custom success message. If not provided,
   *                        defaults to 'Texto copiado al portapapeles'
   * @returns Promise<boolean> - True if copy was successful, false otherwise
   *
   * @example
   * ```typescript
   * const { copyToClipboard } = useClipboard();
   *
   * // Basic usage
   * const success = await copyToClipboard('Hello World');
   *
   * // With custom message
   * await copyToClipboard('Hello World', 'Text copied!');
   * ```
   *
   * @throws When the clipboard API is not available or fails
   *
   * @public
   */
  const copyToClipboard = useCallback(
    async (text: string, successMessage?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage || 'Texto copiado al portapapeles', 'success');
        return true;
      } catch (error) {
        console.error('Error al copiar al portapapeles:', error);
        showToast('Error al copiar al portapapeles', 'error');
        return false;
      }
    },
    [showToast]
  );

  return {
    copyToClipboard,
  };
};
