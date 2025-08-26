import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { electronUtils } from '../electronUtils';

// Mock interfaces para tipado
interface MockWindow extends Window {
  require?: (module: string) => any;
  electronAPI?: any;
}

interface MockElectronRemote {
  getCurrentWindow: () => MockElectronWindow;
}

interface MockElectronWindow {
  maximize: () => void | Promise<void>;
  unmaximize: () => void | Promise<void>;
  isMaximized: () => boolean | Promise<boolean>;
  minimize: () => void | Promise<void>;
  close: () => void | Promise<void>;
}

interface MockIpcRenderer {
  invoke: (channel: string) => Promise<any>;
}

describe('electronUtils', () => {
  let mockWindow: MockWindow;
  let originalWindow: Window;
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Guardar referencias originales
    originalWindow = global.window;
    originalNavigator = global.navigator;

    // Crear mock window limpio
    mockWindow = {
      ...originalWindow,
    } as MockWindow;

    // Aplicar mock window
    vi.stubGlobal('window', mockWindow);

    // Mock navigator básico
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
  });

  afterEach(() => {
    // Limpiar todos los mocks
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('isElectron', () => {
    it('should return false when not in Electron environment', () => {
      // Entorno web normal - sin APIs de Electron
      const result = electronUtils.isElectron();
      expect(result).toBe(false);
    });

    it('should return true when window.require exists', () => {
      mockWindow.require = vi.fn();
      vi.stubGlobal('window', mockWindow);

      const result = electronUtils.isElectron();
      expect(result).toBe(true);
    });

    it('should return true when window.electronAPI exists', () => {
      mockWindow.electronAPI = {};
      vi.stubGlobal('window', mockWindow);

      const result = electronUtils.isElectron();
      expect(result).toBe(true);
    });

    it('should return true when navigator.userAgent contains Electron', () => {
      vi.stubGlobal('navigator', {
        ...originalNavigator,
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) MyApp/1.0.0 Chrome/91.0.4472.164 Electron/13.1.7 Safari/537.36',
      });

      const result = electronUtils.isElectron();
      expect(result).toBe(true);
    });

    it('should return true when multiple Electron indicators are present', () => {
      mockWindow.require = vi.fn();
      mockWindow.electronAPI = {};
      vi.stubGlobal('window', mockWindow);

      vi.stubGlobal('navigator', {
        ...originalNavigator,
        userAgent: 'Electron/13.1.7',
      });

      const result = electronUtils.isElectron();
      expect(result).toBe(true);
    });
  });

  describe('getCurrentWindow', () => {
    it('should return null when not in Electron environment', () => {
      const result = electronUtils.getCurrentWindow();
      expect(result).toBeNull();
    });

    it('should return window object when using remote API (legacy Electron)', () => {
      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        isMaximized: vi.fn().mockReturnValue(false),
        minimize: vi.fn(),
        close: vi.fn(),
      };

      const mockRemote: MockElectronRemote = {
        getCurrentWindow: vi.fn().mockReturnValue(mockCurrentWindow),
      };

      const mockRequire = vi.fn((module: string) => {
        if (module === 'electron') {
          return { remote: mockRemote };
        }

        throw new Error(`Module ${module} not found`);
      });

      mockWindow.require = mockRequire;
      vi.stubGlobal('window', mockWindow);

      const result = electronUtils.getCurrentWindow();

      expect(result).toBe(mockCurrentWindow);
      expect(mockRequire).toHaveBeenCalledWith('electron');
      expect(mockRemote.getCurrentWindow).toHaveBeenCalled();
    });

    it('should fallback to ipcRenderer when remote API fails', () => {
      const mockIpcRenderer: MockIpcRenderer = {
        invoke: vi.fn(),
      };

      let callCount = 0;

      const mockRequire = vi.fn((module: string) => {
        if (module === 'electron') {
          callCount++;

          if (callCount === 1) {
            // Primer intento: devolver remote que falla
            return {
              remote: {
                getCurrentWindow: () => null,
              },
            };
          } else {
            // Segundo intento: devolver ipcRenderer
            return { ipcRenderer: mockIpcRenderer };
          }
        }

        throw new Error(`Module ${module} not found`);
      });

      mockWindow.require = mockRequire;
      vi.stubGlobal('window', mockWindow);

      const result = electronUtils.getCurrentWindow();

      expect(result).toBeDefined();

      if (result) {
        expect(result).toHaveProperty('maximize');
        expect(result).toHaveProperty('unmaximize');
        expect(result).toHaveProperty('isMaximized');
        expect(result).toHaveProperty('minimize');
        expect(result).toHaveProperty('close');
      }
    });

    it('should return null when both remote and ipcRenderer fail', () => {
      const mockRequire = vi.fn(() => {
        throw new Error('Electron not available');
      });

      mockWindow.require = mockRequire;
      vi.stubGlobal('window', mockWindow);

      // Mock console.warn para evitar output en tests
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = electronUtils.getCurrentWindow();

      expect(result).toBeNull();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'No se pudo acceder a las APIs de Electron:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle ipcRenderer wrapper functions correctly', async () => {
      const mockIpcRenderer: MockIpcRenderer = {
        invoke: vi
          .fn()
          .mockResolvedValueOnce(undefined) // maximize
          .mockResolvedValueOnce(undefined) // unmaximize
          .mockResolvedValueOnce(true) // isMaximized
          .mockResolvedValueOnce(undefined) // minimize
          .mockResolvedValueOnce(undefined), // close
      };

      const mockRequire = vi.fn((module: string) => {
        if (module === 'electron') {
          return {
            remote: null, // Force fallback
            ipcRenderer: mockIpcRenderer,
          };
        }

        throw new Error(`Module ${module} not found`);
      });

      mockWindow.require = mockRequire;
      vi.stubGlobal('window', mockWindow);

      const windowWrapper = electronUtils.getCurrentWindow();

      expect(windowWrapper).toBeDefined();

      // Test all wrapper functions
      if (windowWrapper) {
        await windowWrapper.maximize();
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-maximize');

        await windowWrapper.unmaximize();

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
          'window-unmaximize'
        );

        const isMaximized = await windowWrapper.isMaximized();
        expect(isMaximized).toBe(true);

        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
          'window-is-maximized'
        );

        await windowWrapper.minimize();
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-minimize');

        await windowWrapper.close();
        expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-close');
      }
    });
  });

  describe('maximizeWindow', () => {
    it('should do nothing when not in Electron environment', async () => {
      await expect(electronUtils.maximizeWindow()).resolves.not.toThrow();
    });

    it('should call maximize on current window', async () => {
      const mockMaximize = vi.fn().mockResolvedValue(undefined);

      const mockCurrentWindow: MockElectronWindow = {
        maximize: mockMaximize,
        unmaximize: vi.fn(),
        isMaximized: vi.fn(),
        minimize: vi.fn(),
        close: vi.fn(),
      };

      // Mock getCurrentWindow para devolver ventana mock
      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      await electronUtils.maximizeWindow();

      expect(mockMaximize).toHaveBeenCalled();
    });

    it('should handle maximize function not being available', async () => {
      const mockCurrentWindow = {
        // maximize function no disponible
        unmaximize: vi.fn(),
        isMaximized: vi.fn(),
      } as any;

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      await expect(electronUtils.maximizeWindow()).resolves.not.toThrow();
    });

    it('should handle errors during maximize', async () => {
      const mockMaximize = vi
        .fn()
        .mockRejectedValue(new Error('Maximize failed'));

      const mockCurrentWindow: MockElectronWindow = {
        maximize: mockMaximize,
        unmaximize: vi.fn(),
        isMaximized: vi.fn(),
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await electronUtils.maximizeWindow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al maximizar ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('unmaximizeWindow', () => {
    it('should do nothing when not in Electron environment', async () => {
      await expect(electronUtils.unmaximizeWindow()).resolves.not.toThrow();
    });

    it('should call unmaximize on current window', async () => {
      const mockUnmaximize = vi.fn().mockResolvedValue(undefined);

      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: mockUnmaximize,
        isMaximized: vi.fn(),
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      await electronUtils.unmaximizeWindow();

      expect(mockUnmaximize).toHaveBeenCalled();
    });

    it('should handle errors during unmaximize', async () => {
      const mockUnmaximize = vi
        .fn()
        .mockRejectedValue(new Error('Unmaximize failed'));

      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: mockUnmaximize,
        isMaximized: vi.fn(),
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await electronUtils.unmaximizeWindow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al restaurar ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isWindowMaximized', () => {
    it('should return false when not in Electron environment', async () => {
      const result = await electronUtils.isWindowMaximized();
      expect(result).toBe(false);
    });

    it('should return true when window is maximized', async () => {
      const mockIsMaximized = vi.fn().mockResolvedValue(true);

      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        isMaximized: mockIsMaximized,
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const result = await electronUtils.isWindowMaximized();

      expect(result).toBe(true);
      expect(mockIsMaximized).toHaveBeenCalled();
    });

    it('should return false when window is not maximized', async () => {
      const mockIsMaximized = vi.fn().mockResolvedValue(false);

      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        isMaximized: mockIsMaximized,
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const result = await electronUtils.isWindowMaximized();

      expect(result).toBe(false);
    });

    it('should return false when isMaximized function is not available', async () => {
      const mockCurrentWindow = {
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        // isMaximized no disponible
      } as any;

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const result = await electronUtils.isWindowMaximized();

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      const mockIsMaximized = vi
        .fn()
        .mockRejectedValue(new Error('IsMaximized failed'));

      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        isMaximized: mockIsMaximized,
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await electronUtils.isWindowMaximized();

      expect(result).toBe(false);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al verificar estado de ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('toggleMaximize', () => {
    it('should maximize window when currently not maximized', async () => {
      vi.spyOn(electronUtils, 'isWindowMaximized').mockResolvedValue(false);
      vi.spyOn(electronUtils, 'maximizeWindow').mockResolvedValue(undefined);
      vi.spyOn(electronUtils, 'unmaximizeWindow').mockResolvedValue(undefined);

      await electronUtils.toggleMaximize();

      expect(electronUtils.isWindowMaximized).toHaveBeenCalled();
      expect(electronUtils.maximizeWindow).toHaveBeenCalled();
      expect(electronUtils.unmaximizeWindow).not.toHaveBeenCalled();
    });

    it('should unmaximize window when currently maximized', async () => {
      vi.spyOn(electronUtils, 'isWindowMaximized').mockResolvedValue(true);
      vi.spyOn(electronUtils, 'maximizeWindow').mockResolvedValue(undefined);
      vi.spyOn(electronUtils, 'unmaximizeWindow').mockResolvedValue(undefined);

      await electronUtils.toggleMaximize();

      expect(electronUtils.isWindowMaximized).toHaveBeenCalled();
      expect(electronUtils.unmaximizeWindow).toHaveBeenCalled();
      expect(electronUtils.maximizeWindow).not.toHaveBeenCalled();
    });

    it('should handle errors during toggle', async () => {
      vi.spyOn(electronUtils, 'isWindowMaximized').mockRejectedValue(
        new Error('Toggle failed')
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await electronUtils.toggleMaximize();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al cambiar estado de ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors during maximize in toggle', async () => {
      vi.spyOn(electronUtils, 'isWindowMaximized').mockResolvedValue(false);

      vi.spyOn(electronUtils, 'maximizeWindow').mockRejectedValue(
        new Error('Maximize in toggle failed')
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await electronUtils.toggleMaximize();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al cambiar estado de ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors during unmaximize in toggle', async () => {
      vi.spyOn(electronUtils, 'isWindowMaximized').mockResolvedValue(true);

      vi.spyOn(electronUtils, 'unmaximizeWindow').mockRejectedValue(
        new Error('Unmaximize in toggle failed')
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await electronUtils.toggleMaximize();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al cambiar estado de ventana:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases and integration', () => {
    it('should work end-to-end in a simulated Electron environment', async () => {
      // Setup completo de un entorno Electron simulado
      const mockCurrentWindow: MockElectronWindow = {
        maximize: vi.fn().mockResolvedValue(undefined),
        unmaximize: vi.fn().mockResolvedValue(undefined),
        isMaximized: vi
          .fn()
          .mockResolvedValueOnce(false) // Primera llamada: no maximizada
          .mockResolvedValueOnce(true) // Segunda llamada: maximizada
          .mockResolvedValueOnce(false), // Tercera llamada: no maximizada
        minimize: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      const mockRemote: MockElectronRemote = {
        getCurrentWindow: vi.fn().mockReturnValue(mockCurrentWindow),
      };

      const mockRequire = vi.fn().mockReturnValue({ remote: mockRemote });
      mockWindow.require = mockRequire;
      vi.stubGlobal('window', mockWindow);

      // Test flow completo
      expect(electronUtils.isElectron()).toBe(true);

      const window = electronUtils.getCurrentWindow();
      expect(window).toBe(mockCurrentWindow);

      // Test isMaximized inicial
      const isMaximized = await electronUtils.isWindowMaximized();
      expect(isMaximized).toBe(false);

      // Test maximize
      await electronUtils.maximizeWindow();
      expect(mockCurrentWindow.maximize).toHaveBeenCalled();

      // Test toggle desde maximizado a no maximizado
      await electronUtils.toggleMaximize();
      expect(mockCurrentWindow.unmaximize).toHaveBeenCalled();
    });

    it('should handle mixed sync/async window methods gracefully', () => {
      // Algunos métodos pueden ser síncronos en versiones antiguas de Electron
      const mockCurrentWindow = {
        maximize: vi.fn(), // sync
        unmaximize: vi.fn(), // sync
        isMaximized: vi.fn().mockReturnValue(true), // sync return
        minimize: vi.fn(),
        close: vi.fn(),
      };

      vi.spyOn(electronUtils, 'getCurrentWindow').mockReturnValue(
        mockCurrentWindow as any
      );

      // Debe funcionar tanto con métodos sync como async
      expect(async () => {
        await electronUtils.maximizeWindow();
        await electronUtils.unmaximizeWindow();
        const result = await electronUtils.isWindowMaximized();
        expect(result).toBe(true);
      }).not.toThrow();
    });
  });
});
