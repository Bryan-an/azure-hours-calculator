import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

export const useClipboard = () => {
  const { showToast } = useUIStore();

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
