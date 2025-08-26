# Azure Hours Calculator - Claude Code Project Documentation

## 📋 Project Overview

**Azure Hours Calculator** es una aplicación de escritorio para macOS que calcula automáticamente las fechas de inicio y fin de tareas en Azure DevOps, considerando horarios laborales, feriados ecuatorianos y eventos de Google Calendar.

### 🎯 Propósito

Automatizar el proceso manual de calcular fechas de finalización de tareas considerando:

- Horario laboral configurable (8:30 AM - 5:30 PM con almuerzo 1:00-2:00 PM)
- Feriados nacionales de Ecuador
- Eventos del Google Calendar (opcional)
- Días laborales (Lunes a Viernes)

## 🛠 Stack Tecnológico

- **Frontend**: React + TypeScript + Material-UI (MUI)
- **Desktop**: Electron (frameless window)
- **Fechas**: date-fns
- **APIs Externas**:
  - Calendarific (feriados ecuatorianos)
  - Google Calendar API (eventos y reuniones)
- **Almacenamiento**: localStorage

## 📁 Arquitectura del Proyecto

```
azure-hours-calculator/
├── public/
│   ├── electron.js              # Proceso principal de Electron
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ElectronTitleBar.tsx     # Barra de título personalizada frameless
│   │   ├── EventSelectionDialog.tsx # Diálogo de selección de eventos de calendario
│   │   ├── HolidayDay.tsx           # Componente visual para días festivos
│   │   ├── HolidaySelectionDialog.tsx # Diálogo de selección granular de feriados
│   │   ├── SettingsDialog.tsx       # Configuración de horarios y APIs
│   │   └── TaskCalculator.tsx       # Calculadora principal
│   ├── hooks/
│   │   ├── useCalendarConnection.ts # Hook para conexión con calendarios
│   │   ├── useCalendarEvents.ts     # Hook para eventos de calendario
│   │   ├── useClipboard.ts          # Hook para manejo de clipboard
│   │   ├── useEventSelection.ts     # Hook para selección de eventos
│   │   ├── useFieldVisibility.ts    # Hook para visibilidad de campos
│   │   ├── useGoogleAuth.ts         # Hook para autenticación Google OAuth
│   │   ├── useHolidaySelection.ts   # Hook para selección granular de feriados
│   │   ├── useHolidays.ts           # Hook para gestión de feriados
│   │   ├── useTaskCalculation.ts    # Hook para lógica de cálculo
│   │   ├── useTaskForm.ts           # Hook para estado del formulario
│   │   └── useTimeUtils.ts          # Hook para utilidades de tiempo
│   ├── services/
│   │   ├── googleCalendarService.ts # Google Calendar API integration
│   │   ├── holidayService.ts        # API de feriados ecuatorianos
│   │   └── iCalService.ts           # Integración con calendarios iCal
│   ├── stores/
│   │   ├── index.ts                 # Barrel export para stores (evitar imports circulares)
│   │   ├── preferencesStore.ts      # Zustand store para preferencias de usuario
│   │   ├── settingsStore.ts         # Zustand store para configuraciones
│   │   └── uiStore.ts               # Zustand store para estado de UI
│   ├── utils/
│   │   ├── dateCalculations.ts      # Lógica de cálculo de fechas
│   │   ├── electronUtils.ts         # Utilidades para Electron
│   │   └── googleAuthHelper.ts      # Helper para autenticación Google OAuth
│   ├── types/
│   │   └── index.ts                 # Definiciones TypeScript completas
│   ├── App.tsx                      # Componente principal
│   ├── index.tsx
│   ├── index.css                    # Estilos globales y CSS crítico para Electron
│   └── theme.ts                     # Configuración del tema Material-UI
├── package.json
├── tsconfig.json
├── README.md
├── INSTALL.md
└── package-scripts.sh           # Scripts de instalación
```

## 🔧 Configuraciones Clave

### Electron Configuration (Critical)

```javascript
// public/electron.js
const mainWindow = new BrowserWindow({
  frame: false, // CRÍTICO para titleBarOverlay
  titleBarStyle: 'hidden',
  titleBarOverlay: {
    color: '#1e1e1e', // Color oscuro
    symbolColor: '#ffffff', // Iconos blancos
    height: 32,
  },
});
```

### Material-UI Drag Regions (Critical)

```css
/* src/index.css - Solución para MUI + Electron */
.MuiButton-root,
.MuiIconButton-root,
.MuiTextField-root,
/* todos los componentes MUI */
button,
input {
  -webkit-app-region: no-drag !important;
}

.electron-titlebar {
  -webkit-app-region: drag;
  -webkit-user-select: none;
}
```

## 🚨 Problemas Resueltos y Lecciones Aprendidas

### 1. Window Dragging Issue (CRÍTICO)

**Problema**: La ventana no se podía arrastrar en macOS con titleBarStyle hidden.

**Intentos fallidos**:

- `titleBarStyle: 'hiddenInset'` solo
- CSS `-webkit-app-region: drag` en AppBar sin `frame: false`
- `titleBarOverlay` sin `frame: false`

**Solución exitosa**:

- `frame: false` en BrowserWindow (ESENCIAL)
- Barra de título personalizada (`ElectronTitleBar`)
- CSS específico para componentes MUI como `no-drag`
- Basado en GitHub issue mui/material-ui#5043

### 2. Traffic Light Buttons Overlap

**Problema**: Los botones de cerrar/minimizar/maximizar se superponían con el contenido.

**Solución**:

- `titleBarOverlay` con color matching del tema
- Barra de título personalizada con altura correcta (32px)
- Traffic lights nativos en macOS, botones personalizados en Windows/Linux

### 3. Material-UI Components Causing Window Drag

**Problema**: Al hacer clic en botones MUI, se arrastraba toda la ventana.

**Solución crítica**:

```css
/* Todos los componentes MUI deben ser no-drag */
.MuiButton-root,
.MuiIconButton-root,
/* ... todos los componentes */ {
  -webkit-app-region: no-drag !important;
}
```

## 🔌 APIs e Integraciones

### Calendarific API (Opcional)

- **Propósito**: Obtener feriados actualizados de Ecuador
- **Fallback**: Lista estática de feriados 2025 incluida
- **Configuración**: `REACT_APP_CALENDARIFIC_API_KEY` en `.env`

### Google Calendar API (Opcional)

- **Propósito**: Excluir eventos y reuniones del cálculo de horas
- **Configuración**: Google Client ID + Autenticación OAuth vía interfaz
- **Autenticación**: OAuth 2.0 flow con acceso a calendario de solo lectura

## 💾 Configuración y Storage

### WorkSchedule (Configurable)

```typescript
interface WorkSchedule {
  startTime: string; // "08:30"
  endTime: string; // "17:30"
  lunchStart: string; // "13:00"
  lunchEnd: string; // "14:00"
  workDays: number[]; // [1,2,3,4,5] (0=Sunday, 1=Monday, etc)
}
```

### Interfaces Principales

```typescript
interface Holiday {
  date: string;
  name: string;
  type: string;
  country: string;
  global: boolean;
}

interface Meeting {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isOptional: boolean;
}

interface TaskCalculation {
  estimatedHours: number;
  startDate: Date;
  endDate?: Date;
  excludeHolidays: boolean;
  excludeMeetings: boolean;
  excludedMeetingIds?: string[]; // IDs de eventos específicamente excluidos
  excludedHolidayDates?: string[]; // Fechas de feriados específicamente excluidos
  holidays: Holiday[];
  meetings: Meeting[];
}

type CalendarSource = 'google' | 'ical' | 'none';
type GoogleConnectionStatus =
  | 'idle'
  | 'testing'
  | 'success'
  | 'error'
  | 'authenticating';
```

### Zustand Stores

```typescript
// settingsStore.ts - Configuraciones de la aplicación
// uiStore.ts - Estado de la interfaz de usuario
// preferencesStore.ts - Preferencias del usuario
```

## 🎨 UI/UX Decisiones

### Dual Interface Strategy

- **Web**: AppBar normal de Material-UI
- **Electron**: Barra de título personalizada (`ElectronTitleBar`) + botones integrados
- **Detección**: `!!(window as any).require`

### Tema Oscuro Profesional

- **Primario**: `#90caf9` (azul claro)
- **Secundario**: `#f48fb1` (rosa claro)
- **Fondo**: `#121212` (casi negro)
- **Paper**: `#1e1e1e` (gris oscuro)
- **Traffic lights**: Colores nativos de macOS para controles de ventana

### Componentes de Selección Granular

- **HolidaySelectionDialog**: Selección individual de feriados con toggle automático
- **EventSelectionDialog**: Selección individual de eventos de calendario
- **HolidayDay**: Componente visual para mostrar información de feriados
- **Memoización**: Componentes optimizados con React.memo y useMemo

### Estilo de Texto e Interfaz

- **Sin emojis**: Evitar el uso de emojis en textos de la interfaz gráfica por profesionalismo
- **Tono formal**: Mantener un lenguaje profesional y claro en todos los mensajes
- **Mensajes concisos**: Texto directo sin elementos decorativos innecesarios
- **Toast notifications**: Notificaciones elegantes con react-hot-toast

### Arquitectura de Hooks Personalizada

- **Separación de responsabilidades**: Un hook por funcionalidad específica
- **Composición**: Hooks que usan otros hooks para funcionalidad compleja
- **Estado local vs global**: Zustand para estado global, hooks para estado local

### Buenas Prácticas de Importación

- **Importaciones directas**: Usar siempre imports directos desde archivos específicos
- **Barrel file controlado**: Solo `stores/index.ts` para evitar imports circulares
- **Ejemplo correcto**:
  ```typescript
  import { useHolidays } from '../hooks/useHolidays';
  import { useCalendarEvents } from '../hooks/useCalendarEvents';
  import { useSettingsStore } from '../stores/settingsStore';
  ```
- **Ejemplo aceptable** (solo para stores):
  ```typescript
  import { useSettingsStore, useUiStore } from '../stores';
  ```

## 🧮 Lógica de Cálculo Principal

### DateCalculationsUtil.calculateEndDate()

**Algoritmo Mejorado**:

1. Convertir horas estimadas a minutos
2. Iniciar desde fecha/hora de inicio
3. Para cada día:
   - Verificar si es día laboral según configuración
   - Verificar si es feriado (con selección granular)
   - Verificar eventos de calendario (con selección granular)
   - Calcular minutos disponibles (día laboral - almuerzo - eventos excluidos)
   - Restar minutos usados del total necesario
4. Retornar fecha/hora de finalización con detalles completos

**Consideraciones Avanzadas**:

- Respeta horarios de almuerzo configurables
- Excluye fines de semana según configuración de días laborales
- Maneja feriados ecuatorianos con selección individual
- Considera duración de eventos de Google Calendar con exclusión granular
- Optimizado para rendimiento con caching de cálculos
- Soporte para múltiples calendarios simultáneos

**Hooks Especializados**:

- `useTaskCalculation`: Lógica principal de cálculo
- `useHolidaySelection`: Gestión granular de feriados
- `useEventSelection`: Gestión granular de eventos
- `useTimeUtils`: Utilidades de conversión y formateo

## 🚀 Scripts de Desarrollo

### package-scripts.sh

```bash
./package-scripts.sh setup      # Instalación completa
./package-scripts.sh dev        # Modo desarrollo (web)
./package-scripts.sh electron   # Aplicación de escritorio
./package-scripts.sh build     # Crear ejecutable
./package-scripts.sh test      # Probar configuración
```

### NPM Scripts Principales

```bash
# Desarrollo
npm start               # Servidor desarrollo web
npm run electron-dev    # Electron + React con hot reload

# Producción
npm run build           # Build para producción
npm run build-electron  # Crear app distribuible (DMG + ZIP)

# Calidad de Código
npm run lint            # Ejecutar ESLint
npm run lint:fix        # Corregir errores ESLint automáticamente
npm run format          # Formatear código con Prettier
npm run format:check    # Verificar formato sin cambios
npm run typecheck       # Verificar tipos TypeScript

# Otros
npm run electron        # Ejecutar app Electron construida
npm run prepare         # Setup Husky git hooks
```

## 🔒 Variables de Entorno

### .env (Opcional)

```bash
BROWSER=none                           # No abrir navegador en dev
REACT_APP_CALENDARIFIC_API_KEY=xxx     # API feriados (opcional)
```

**Nota**: Google Calendar se configura vía UI con autenticación OAuth, no variables de entorno.

## 📚 Dependencias Críticas

### Runtime Dependencies

```json
{
  "@emotion/react": "^11.11.4",     # Emotion CSS-in-JS para MUI
  "@emotion/styled": "^11.11.5",    # Styled components con Emotion
  "@mui/material": "^5.15.15",      # UI framework principal
  "@mui/icons-material": "^5.15.15", # Iconos Material Design
  "@mui/x-date-pickers": "^6.19.9", # Date pickers avanzados
  "axios": "^1.6.8",                # HTTP requests para APIs
  "date-fns": "^2.30.0",            # Manipulación de fechas
  "electron-is-dev": "^2.0.0",      # Detección dev/prod en Electron
  "react": "^18.2.0",               # Framework de UI
  "react-dom": "^18.2.0",           # React DOM renderer
  "react-hot-toast": "^2.6.0",      # Notificaciones toast elegantes
  "react-scripts": "5.0.1",         # Scripts de desarrollo CRA
  "zustand": "^5.0.8"               # Estado global ligero
}
```

### Dev Dependencies

```json
{
  "@eslint/js": "^9.34.0",          # ESLint core
  "@types/node": "^16.18.101",      # Tipos Node.js
  "@types/react": "^18.2.79",       # Tipos React
  "@types/react-dom": "^18.2.25",   # Tipos React DOM
  "concurrently": "^8.2.2",         # Scripts paralelos
  "electron": "^29.3.0",            # Desktop framework
  "electron-builder": "^24.13.3",   # Packaging para distribución
  "eslint": "^8.57.1",              # Linter JavaScript/TypeScript
  "eslint-config-prettier": "^10.1.8", # Integración ESLint + Prettier
  "eslint-plugin-prettier": "^5.5.4", # Plugin Prettier para ESLint
  "eslint-plugin-react": "^7.37.5", # Reglas ESLint específicas de React
  "eslint-plugin-react-hooks": "^5.2.0", # Reglas para React Hooks
  "husky": "^9.1.7",                # Git hooks automation
  "lint-staged": "^16.1.5",         # Linting solo archivos staged
  "prettier": "^3.6.2",             # Formateo de código
  "typescript": "^4.9.5",           # Tipado estático
  "typescript-eslint": "^8.40.0",   # Parser TypeScript para ESLint
  "wait-on": "^7.2.0"               # Esperar servicios en desarrollo
}
```

## ⚠️ Problemas Conocidos y Limitaciones

### 1. Electron Version Compatibility

- Usar Electron ^29.3.0 para compatibilidad con titleBarOverlay
- Versiones anteriores pueden tener problemas con `frame: false`

### 2. Material-UI Drag Conflicts

- Requiere CSS `!important` para override de MUI styles
- Todos los componentes interactivos deben ser `no-drag`

### 3. API Rate Limits

- Calendarific: 1000 requests/mes (plan gratuito)
- Google Calendar: Límites generosos según Google Cloud quotas

### 4. Timezone Assumptions

- Cálculos asumen timezone de Ecuador (GMT-5)
- No hay manejo explícito de cambios de horario
- date-fns maneja automáticamente el timezone local

### 5. Performance Optimization

- React.memo para componentes pesados
- useMemo para cálculos costosos
- useCallback para funciones en dependencias
- Debounce en inputs de búsqueda y filtros

### 6. Git Hooks y Calidad

- Pre-commit: ESLint + Prettier en archivos staged
- Pre-push: TypeCheck + build verification
- lint-staged para optimización de tiempo

## 🎯 Funcionalidades Futuras Sugeridas

### High Priority

- [ ] Soporte para múltiples zonas horarias
- [x] Integración con Google Calendar (completado)
- [x] Selección granular de feriados (completado)
- [x] Selección granular de eventos de calendario (completado)
- [ ] Exportar resultados a CSV/PDF
- [ ] Configuración de feriados personalizados

### Medium Priority

- [ ] Plantillas de horarios pre-configuradas
- [ ] Notificaciones de deadlines
- [ ] Integración directa con Azure DevOps API
- [ ] Soporte para Windows/Linux
- [x] Optimización de rendimiento con memoización (completado)
- [x] Sistema de hooks modulares (completado)

### Low Priority

- [ ] Temas personalizables
- [ ] Múltiples idiomas
- [ ] Estadísticas de productividad
- [ ] Backup/sync de configuraciones
- [x] Clipboard integration para copiar fechas (completado)
- [x] Toast notifications profesionales (completado)

## 🐛 Debugging Tips

### Electron Dev Tools

```javascript
// En desarrollo, abrir DevTools con:
mainWindow.webContents.openDevTools();
```

### Common Issues

1. **"Window not draggable"**: Verificar `frame: false` y CSS regions
2. **"Buttons drag window"**: Asegurar `no-drag` en componentes MUI
3. **"APIs not working"**: Verificar keys en localStorage y configuración CORS

### Logs Importantes

```bash
# Ver logs de Electron
./package-scripts.sh electron 2>&1 | grep -i error

# Ver compilación
npm run build 2>&1 | grep -i error
```

## 📞 Contacto y Mantenimiento

### Información del Proyecto

- **Cliente**: Bryan Andagoya (Desarrollador en Ecuador - Quito)
- **Uso**: Planificación de tareas Azure DevOps
- **Plataforma Principal**: macOS
- **Generado con**: Claude Code

### Comandos de Mantenimiento

```bash
# Actualizar dependencias
npm audit fix --legacy-peer-deps

# Limpiar y reinstalar
npm cache clean --force && rm -rf node_modules && npm install --legacy-peer-deps

# Verificar build
npm run build && echo "Build OK"

# Calidad de código completa
npm run typecheck && npm run lint && npm run format:check

# Setup inicial completo
npm run prepare && npm install --legacy-peer-deps

# Crear distribución completa
npm run build-electron
```

---

**Última actualización**: Agosto 2025  
**Versión**: 1.0.0  
**Estado**: Funcional y listo para uso en producción

## 🔄 Últimas Mejoras Implementadas

### V1.0.0 - Agosto 2025

- ✅ **Selección granular de feriados**: Diálogo interactivo para seleccionar feriados específicos
- ✅ **Selección granular de eventos**: Control detallado sobre qué eventos de calendario excluir
- ✅ **Optimización de rendimiento**: Memoización de componentes y hooks
- ✅ **Arquitectura modular**: Sistema de hooks especializados y reutilizables
- ✅ **Integración de clipboard**: Copia fácil de fechas calculadas
- ✅ **Notificaciones elegantes**: Sistema toast profesional
- ✅ **Calidad de código**: ESLint, Prettier, Husky, git hooks automáticos
- ✅ **TypeScript estricto**: Tipado completo y verificaciones automáticas
- ✅ **Electron frameless**: Ventana nativa con controles personalizados
