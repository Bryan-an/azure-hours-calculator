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
│   │   ├── ElectronTitleBar.tsx # Barra de título personalizada
│   │   ├── SettingsDialog.tsx   # Configuración de horarios y APIs
│   │   └── TaskCalculator.tsx   # Calculadora principal
│   ├── services/
│   │   ├── holidayService.ts    # API de feriados ecuatorianos
│   │   └── googleCalendarService.ts # Integración con Google Calendar
│   ├── utils/
│   │   ├── dateCalculations.ts  # Lógica de cálculo de fechas
│   │   ├── electronUtils.ts     # Utilidades para Electron
│   │   └── storage.ts           # Manejo de localStorage
│   ├── types/
│   │   └── index.ts             # Definiciones TypeScript
│   ├── App.tsx                  # Componente principal
│   ├── index.tsx
│   └── index.css
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
  frame: false,                    // CRÍTICO para titleBarOverlay
  titleBarStyle: 'hidden',
  titleBarOverlay: {
    color: '#1e1e1e',             // Color oscuro
    symbolColor: '#ffffff',        // Iconos blancos
    height: 32
  }
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
/* ... todos los componentes */
{
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
  startTime: string;    // "08:30"
  endTime: string;      // "17:30"
  lunchStart: string;   // "13:00"  
  lunchEnd: string;     // "14:00"
  workDays: number[];   // [1,2,3,4,5] (Lunes-Viernes)
}
```

### LocalStorage Keys
```typescript
const STORAGE_KEYS = {
  WORK_SCHEDULE: 'workSchedule',
  GOOGLE_CLIENT_ID: 'googleClientId',
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_CALENDAR_ID: 'googleCalendarId',
  CALENDARIFIC_API_KEY: 'calendarificApiKey',
};
```

## 🎨 UI/UX Decisiones

### Dual Interface Strategy
- **Web**: AppBar normal de Material-UI
- **Electron**: Barra de título personalizada + botones integrados
- **Detección**: `!!(window as any).require`

### Tema Oscuro
- **Primario**: `#90caf9` (azul claro)
- **Secundario**: `#f48fb1` (rosa claro) 
- **Fondo**: `#121212` (casi negro)
- **Paper**: `#1e1e1e` (gris oscuro)

### Estilo de Texto e Interfaz
- **Sin emojis**: Evitar el uso de emojis en textos de la interfaz gráfica por profesionalismo
- **Tono formal**: Mantener un lenguaje profesional y claro en todos los mensajes
- **Mensajes concisos**: Texto directo sin elementos decorativos innecesarios

## 🧮 Lógica de Cálculo Principal

### DateCalculationsUtil.calculateEndDate()
**Algoritmo**:
1. Convertir horas estimadas a minutos
2. Iniciar desde fecha/hora de inicio
3. Para cada día:
   - Verificar si es día laboral
   - Verificar si es feriado (si está habilitado)
   - Calcular minutos disponibles (día laboral - almuerzo - eventos de calendario)
   - Restar minutos usados del total necesario
4. Retornar fecha/hora de finalización

**Consideraciones**:
- Respeta horarios de almuerzo
- Excluye fines de semana
- Maneja feriados ecuatorianos
- Considera duración de eventos de Google Calendar

## 🚀 Scripts de Desarrollo

### package-scripts.sh
```bash
./package-scripts.sh setup      # Instalación completa
./package-scripts.sh dev        # Modo desarrollo (web)
./package-scripts.sh electron   # Aplicación de escritorio
./package-scripts.sh build     # Crear ejecutable
./package-scripts.sh test      # Probar configuración
```

### NPM Scripts Importantes
```bash
npm run build           # Construir para producción
npm run electron-dev    # Electron + React en desarrollo
npm run build-electron  # Crear app distribuible
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
  "@mui/material": "^5.15.15",      # UI framework
  "@mui/icons-material": "^5.15.15", # Iconos
  "@mui/x-date-pickers": "^6.19.9", # Date pickers
  "date-fns": "^2.30.0",            # Manipulación de fechas
  "axios": "^1.6.8",                # HTTP requests
  "electron-is-dev": "^2.0.0"       # Detección dev/prod
}
```

### Dev Dependencies
```json
{
  "electron": "^29.3.0",            # Desktop framework
  "electron-builder": "^24.13.3",   # Packaging
  "typescript": "^4.9.5",           # Tipado
  "concurrently": "^8.2.2"          # Scripts paralelos
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

## 🎯 Funcionalidades Futuras Sugeridas

### High Priority
- [ ] Soporte para múltiples zonas horarias
- [x] Integración con Google Calendar (completado)
- [ ] Exportar resultados a CSV/PDF
- [ ] Configuración de feriados personalizados

### Medium Priority
- [ ] Plantillas de horarios pre-configuradas
- [ ] Notificaciones de deadlines
- [ ] Integración directa con Azure DevOps API
- [ ] Soporte para Windows/Linux

### Low Priority
- [ ] Temas personalizables
- [ ] Múltiples idiomas
- [ ] Estadísticas de productividad
- [ ] Backup/sync de configuraciones

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
```

---

**Última actualización**: Agosto 2025  
**Versión**: 1.0.0  
**Estado**: Funcional y listo para uso en producción