// Utilidades para interactuar con Electron desde el renderer

export const electronUtils = {
  isElectron: (): boolean => {
    return !!(window as any).require;
  },

  getCurrentWindow: () => {
    if (!electronUtils.isElectron()) return null;
    
    try {
      const { remote } = (window as any).require('electron');
      return remote?.getCurrentWindow() || null;
    } catch (error) {
      // Fallback para versiones más nuevas de Electron sin remote
      try {
        const { ipcRenderer } = (window as any).require('electron');
        return {
          maximize: () => ipcRenderer.invoke('window-maximize'),
          unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
          isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
          minimize: () => ipcRenderer.invoke('window-minimize'),
          close: () => ipcRenderer.invoke('window-close'),
        };
      } catch (ipcError) {
        console.warn('No se pudo acceder a las APIs de Electron:', ipcError);
        return null;
      }
    }
  },

  maximizeWindow: async (): Promise<void> => {
    const currentWindow = electronUtils.getCurrentWindow();
    if (!currentWindow) return;

    try {
      if (typeof currentWindow.maximize === 'function') {
        await currentWindow.maximize();
      }
    } catch (error) {
      console.error('Error al maximizar ventana:', error);
    }
  },

  unmaximizeWindow: async (): Promise<void> => {
    const currentWindow = electronUtils.getCurrentWindow();
    if (!currentWindow) return;

    try {
      if (typeof currentWindow.unmaximize === 'function') {
        await currentWindow.unmaximize();
      }
    } catch (error) {
      console.error('Error al restaurar ventana:', error);
    }
  },

  isWindowMaximized: async (): Promise<boolean> => {
    const currentWindow = electronUtils.getCurrentWindow();
    if (!currentWindow) return false;

    try {
      if (typeof currentWindow.isMaximized === 'function') {
        return await currentWindow.isMaximized();
      }
      return false;
    } catch (error) {
      console.error('Error al verificar estado de ventana:', error);
      return false;
    }
  },

  toggleMaximize: async (): Promise<void> => {
    try {
      const isMaximized = await electronUtils.isWindowMaximized();
      if (isMaximized) {
        await electronUtils.unmaximizeWindow();
      } else {
        await electronUtils.maximizeWindow();
      }
    } catch (error) {
      console.error('Error al cambiar estado de ventana:', error);
    }
  }
};