/**
 * Utilidades para interactuar con Electron desde el renderer process
 *
 * Este módulo proporciona una interfaz segura y robusta para interactuar con las APIs
 * de Electron desde el renderer process. Maneja automáticamente las diferencias entre
 * versiones de Electron (legacy remote API vs modern IPC) y proporciona fallbacks
 * seguros cuando no se ejecuta en un entorno Electron.
 *
 * @example
 * Uso básico para controlar la ventana:
 * ```typescript
 * import { electronUtils } from './electronUtils';
 *
 * // Verificar si estamos en Electron
 * if (electronUtils.isElectron()) {
 *   // Maximizar la ventana
 *   await electronUtils.maximizeWindow();
 *
 *   // Verificar estado
 *   const isMaximized = await electronUtils.isWindowMaximized();
 *   console.log('Ventana maximizada:', isMaximized);
 * }
 * ```
 *
 * @example
 * Alternar estado de maximizado:
 * ```typescript
 * // Toggle entre maximizado/restaurado
 * await electronUtils.toggleMaximize();
 * ```
 *
 * @remarks
 * - Compatible con Electron legacy (remote API) y moderno (IPC)
 * - Proporciona fallbacks seguros para entornos no-Electron
 * - Maneja errores automáticamente sin lanzar excepciones
 * - Todas las operaciones de ventana son asíncronas
 *
 * @public
 */
export const electronUtils = {
  /**
   * Detecta si la aplicación se está ejecutando en un entorno Electron
   *
   * Utiliza múltiples métodos de detección para identificar de manera confiable
   * si el código se ejecuta dentro de una aplicación Electron. Esto es crucial
   * para habilitar/deshabilitar funcionalidades específicas de Electron.
   *
   * @returns `true` si se está ejecutando en Electron, `false` en caso contrario
   *
   * @example
   * Verificación básica:
   * ```typescript
   * if (electronUtils.isElectron()) {
   *   console.log('Ejecutándose en Electron');
   *   // Habilitar funcionalidades de escritorio
   * } else {
   *   console.log('Ejecutándose en navegador web');
   *   // Usar funcionalidades web estándar
   * }
   * ```
   *
   * @example
   * Renderizado condicional en React:
   * ```typescript
   * const MyComponent = () => {
   *   const showElectronFeatures = electronUtils.isElectron();
   *
   *   return (
   *     <div>
   *       {showElectronFeatures && <ElectronTitleBar />}
   *       <MainContent />
   *     </div>
   *   );
   * };
   * ```
   *
   * @remarks
   * Métodos de detección utilizados:
   * 1. Presencia de `window.require` (Electron legacy)
   * 2. Presencia de `window.electronAPI` (Electron moderno con contextBridge)
   * 3. Análisis del User Agent que contiene 'Electron'
   *
   * @public
   */
  isElectron: (): boolean => {
    // Multiple detection methods for Electron environment
    return (
      !!(window as any).require ||
      !!(window as any).electronAPI ||
      navigator.userAgent.includes('Electron')
    );
  },

  /**
   * Obtiene una referencia a la ventana actual de Electron
   *
   * Proporciona acceso a las operaciones de ventana de Electron usando diferentes
   * estrategias según la versión de Electron disponible. Primero intenta usar
   * el módulo 'remote' (legacy) y como fallback usa IPC moderno.
   *
   * @returns Objeto con métodos de control de ventana, o `null` si no está en Electron
   *
   * @example
   * Obtener y usar la ventana actual:
   * ```typescript
   * const currentWindow = electronUtils.getCurrentWindow();
   *
   * if (currentWindow) {
   *   // Ventana disponible, usar sus métodos
   *   await currentWindow.maximize();
   *   const isMaximized = await currentWindow.isMaximized();
   * } else {
   *   console.log('No hay ventana de Electron disponible');
   * }
   * ```
   *
   * @example
   * Verificación segura antes de usar:
   * ```typescript
   * const handleWindowOperation = async () => {
   *   const window = electronUtils.getCurrentWindow();
   *
   *   if (!window || typeof window.maximize !== 'function') {
   *     console.warn('Operación de ventana no disponible');
   *     return;
   *   }
   *
   *   await window.maximize();
   * };
   * ```
   *
   * @remarks
   * Estrategias de acceso:
   * 1. **Remote API (legacy)**: Usa `remote.getCurrentWindow()`
   * 2. **IPC moderno**: Crea proxy usando `ipcRenderer.invoke()`
   * 3. **Fallback**: Retorna `null` si ninguna estrategia funciona
   *
   * El objeto retornado tiene la interfaz:
   * - `maximize(): Promise<void>`
   * - `unmaximize(): Promise<void>`
   * - `isMaximized(): Promise<boolean>`
   * - `minimize(): Promise<void>`
   * - `close(): Promise<void>`
   *
   * @public
   */
  getCurrentWindow: () => {
    if (!electronUtils.isElectron()) return null;

    try {
      const require = (window as unknown as Record<string, unknown>)
        .require as (module: string) => any;

      const { remote } = require('electron');
      return remote?.getCurrentWindow() || null;
    } catch {
      // Fallback para versiones más nuevas de Electron sin remote
      try {
        const require = (window as unknown as Record<string, unknown>)
          .require as (module: string) => any;

        const { ipcRenderer } = require('electron');

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

  /**
   * Maximiza la ventana actual de la aplicación Electron
   *
   * Expande la ventana para que ocupe toda la pantalla disponible.
   * Operación segura que no falla si no hay ventana disponible.
   *
   * @returns Promesa que se resuelve cuando la operación completa
   *
   * @example
   * ```typescript
   * // Maximizar la ventana
   * await electronUtils.maximizeWindow();
   * console.log('Ventana maximizada');
   * ```
   *
   * @example
   * Con manejo de estado:
   * ```typescript
   * const maximizeIfNeeded = async () => {
   *   const isMaximized = await electronUtils.isWindowMaximized();
   *   if (!isMaximized) {
   *     await electronUtils.maximizeWindow();
   *   }
   * };
   * ```
   *
   * @public
   */
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

  /**
   * Restaura la ventana desde el estado maximizado a su tamaño original
   *
   * Devuelve la ventana a su tamaño y posición anteriores al maximizado.
   * Operación segura que no falla si no hay ventana disponible.
   *
   * @returns Promesa que se resuelve cuando la operación completa
   *
   * @example
   * ```typescript
   * await electronUtils.unmaximizeWindow();
   * console.log('Ventana restaurada');
   * ```
   *
   * @public
   */
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

  /**
   * Verifica si la ventana actual está en estado maximizado
   *
   * Consulta el estado actual de la ventana para determinar si ocupa
   * toda la pantalla disponible.
   *
   * @returns Promesa que resuelve a `true` si está maximizada, `false` en caso contrario
   *
   * @example
   * Verificar estado antes de una operación:
   * ```typescript
   * const isMaximized = await electronUtils.isWindowMaximized();
   * if (isMaximized) {
   *   console.log('La ventana ya está maximizada');
   * } else {
   *   await electronUtils.maximizeWindow();
   * }
   * ```
   *
   * @example
   * Uso en componente React:
   * ```typescript
   * const [isMaximized, setIsMaximized] = useState(false);
   *
   * useEffect(() => {
   *   const checkStatus = async () => {
   *     const maximized = await electronUtils.isWindowMaximized();
   *     setIsMaximized(maximized);
   *   };
   *   checkStatus();
   * }, []);
   * ```
   *
   * @public
   */
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

  /**
   * Alterna el estado de maximizado de la ventana
   *
   * Si la ventana está maximizada la restaura, si está restaurada la maximiza.
   * Útil para botones de maximizar/restaurar y doble-click en la barra de título.
   *
   * @returns Promesa que se resuelve cuando la operación completa
   *
   * @example
   * Implementar toggle en un botón:
   * ```typescript
   * const handleToggleMaximize = async () => {
   *   await electronUtils.toggleMaximize();
   *   // La ventana cambiará automáticamente de estado
   * };
   *
   * <button onClick={handleToggleMaximize}>
   *   Maximizar/Restaurar
   * </button>
   * ```
   *
   * @example
   * Doble-click en barra de título personalizada:
   * ```typescript
   * const TitleBar = () => {
   *   const handleDoubleClick = () => {
   *     electronUtils.toggleMaximize();
   *   };
   *
   *   return (
   *     <div className="title-bar" onDoubleClick={handleDoubleClick}>
   *       Mi App
   *     </div>
   *   );
   * };
   * ```
   *
   * @remarks
   * Esta función es especialmente útil para implementar el comportamiento
   * estándar del sistema operativo donde doble-click en la barra de título
   * alterna el estado de maximizado.
   *
   * @public
   */
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
  },
};
