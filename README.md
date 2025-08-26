# Azure Hours Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-29.3-green)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

Una aplicación de escritorio profesional para macOS que automatiza el cálculo de fechas de finalización de tareas en Azure DevOps, considerando horarios laborales configurables, feriados ecuatorianos y eventos de Google Calendar con selección granular.

## ✨ Características Principales

### 🧮 Cálculo Inteligente de Fechas

- **Cálculo automático preciso**: Algoritmo avanzado que considera horarios laborales, almuerzos y exclusiones
- **Selección granular de feriados**: Control individual sobre qué feriados ecuatorianos excluir del cálculo
- **Selección granular de eventos**: Elegir específicamente qué reuniones y eventos de calendario excluir
- **Resultados detallados**: Información completa sobre días laborales, horas efectivas y exclusiones

### 🎨 Interfaz Profesional y Moderna

- **Aplicación nativa frameless**: Ventana personalizada con controles de tráfico de macOS
- **Modo oscuro profesional**: Tema diseñado específicamente para desarrolladores
- **Componentes optimizados**: Interfaz rápida con memoización y React.memo
- **Notificaciones elegantes**: Sistema toast profesional para feedback del usuario
- **Clipboard integration**: Copia rápida de fechas calculadas

### 🔗 Integraciones Poderosas

- **Google Calendar completo**: OAuth 2.0, selección de calendario, exclusión granular de eventos
- **Feriados ecuatorianos actualizados**: API Calendarific + fallback a lista completa 2025
- **Configuración flexible**: Horarios laborales totalmente personalizables

### 🛠️ Desarrollo y Calidad

- **TypeScript estricto**: Tipado completo con verificaciones automáticas
- **Calidad de código automatizada**: ESLint, Prettier, Husky git hooks
- **Arquitectura modular**: Hooks personalizados y componentes reutilizables
- **Build multiplataforma**: Soporte ARM64 y x64 para macOS

## 🚀 Instalación Rápida

### Prerequisitos

- **macOS**: 10.14+ (Apple Silicon y Intel soportados)
- **Node.js**: 16+ (recomendado 18+)
- **npm**: 7+ (recomendado 9+)

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Bryan-an/azure-hours-calculator.git
cd azure-hours-calculator

# 2. Instalar dependencias y configurar calidad de código
npm install --legacy-peer-deps
npm run prepare  # Configura git hooks automáticamente

# 3. Verificar instalación
npm run typecheck && npm run lint && npm run build

# 4. Ejecutar aplicación
npm run electron-dev  # Aplicación nativa con hot reload
```

### Construir para Distribución

```bash
# Generar DMG y ZIP para macOS
npm run build-electron
```

Los archivos estarán en `dist/`:

- `Azure Hours Calculator-1.0.0.dmg` (Instalador)
- `Azure Hours Calculator-1.0.0-mac.zip` (Aplicación portable)

> 📝 **Instalación detallada**: Ver [INSTALL.md](INSTALL.md) para guía completa

## ⚙️ Configuración

### 🕰️ Horario Laboral (Totalmente Personalizable)

```
Defecto Ecuador: 8:30 AM - 5:30 PM
Almuerzo: 1:00 PM - 2:00 PM
Días laborales: Lunes a Viernes
```

Todos los horarios son configurables desde la interfaz.

### 🔗 Integraciones Disponibles

#### 📅 Google Calendar (Recomendado)

**Setup rápido**:

1. [Google Cloud Console](https://console.cloud.google.com/) → Nuevo proyecto
2. Habilitar "Google Calendar API"
3. Credenciales → OAuth 2.0 → **Aplicación de escritorio**
4. Copiar Client ID → Pegar en la app → "Conectar"

**Funcionalidades**:

- ✅ Exclusión automática de reuniones del cálculo
- ✅ Selección granular evento por evento
- ✅ Soporte múltiples calendarios
- ✅ Sincronización en tiempo real

#### 🇪🇨 Feriados Ecuatorianos

**Opción 1: Calendarific API** (feriados actualizados)

- Cuenta gratuita en [Calendarific](https://calendarific.com/)
- 1000 requests/mes gratis
- Actualizaciones automáticas

**Opción 2: Lista integrada** (predeterminado)

- Feriados nacionales 2025 incluidos
- Carnaval y Semana Santa calculados
- No requiere configuración

**Ambas opciones soportan selección granular de feriados individuales**

## 🚀 Cómo Usar

### Flujo Completo

1. **⚙️ Configuración inicial**
   - Ajusta horario laboral (8:30-17:30 por defecto)
   - Conecta Google Calendar (opcional)
   - Configura API Calendarific (opcional)

2. **📝 Ingreso de datos**
   - **Horas estimadas**: Decimal (ej: 8.5 = 8h 30min)
   - **Fecha/hora inicio**: Date picker preciso
   - **Exclusiones globales**: Toggles para feriados y eventos

3. **🎯 Ajustes granulares** (nuevo)
   - **"Seleccionar feriados"**: Elige feriados específicos individualmente
   - **"Seleccionar eventos"**: Elige reuniones específicas a excluir
   - **Vista previa**: Ve cómo afectan las exclusiones

4. **🧮 Cálculo y resultados**
   - Fecha estimada de finalización
   - Días laborales utilizados
   - Horas efectivas de trabajo
   - Lista detallada de exclusiones
   - **Botón copiar**: Fecha lista para pegar

### Funciones Avanzadas

- **📋 Clipboard integration**: Copia fechas con un clic
- **🔔 Notificaciones toast**: Feedback elegante y profesional
- **💾 Auto-save**: Configuraciones guardadas automáticamente
- **⚡ Optimizada**: Interfaz rápida con memoización

## 🏗️ Arquitectura

### Stack Tecnológico

```
🖥️ Desktop: Electron 29.3+ (frameless, titleBarOverlay)
⚔️ Frontend: React 18 + TypeScript 4.9
🎨 UI: Material-UI 5.15 + Emotion
📅 Dates: date-fns 2.30
💾 State: Zustand 5.0 (lightweight)
🔔 Toast: react-hot-toast 2.6
```

### Arquitectura de Componentes

```
App.tsx
├── ElectronTitleBar (frameless window controls)
├── TaskCalculator (main interface)
│   ├── DatePickers (start date/time)
│   ├── HolidaySelectionDialog (granular holidays)
│   └── EventSelectionDialog (granular events)
├── SettingsDialog (configuration)
└── Toast Notifications (feedback)
```

### Sistema de Hooks Modular

```
🎯 useTaskCalculation (main calculation logic)
🇪🇨 useHolidays + useHolidaySelection (Ecuador holidays)
📅 useCalendarEvents + useEventSelection (Google Calendar)
⚙️ useGoogleAuth (OAuth 2.0 flow)
📋 useClipboard (copy functionality)
💾 useTaskForm (form state management)
```

### Integraciones Externas

- **Google Calendar API**: OAuth 2.0, read-only access
- **Calendarific API**: Ecuador holidays, 1000 req/month free
- **LocalStorage**: Settings, preferences, tokens
- **Clipboard API**: Quick date copying

## 🚀 Scripts y Comandos

### 🗺️ Desarrollo

| Comando                | Descripción                       |
| ---------------------- | --------------------------------- |
| `npm run electron-dev` | 🖥️ Aplicación nativa + hot reload |
| `npm start`            | 🌍 Servidor web desarrollo        |
| `npm run typecheck`    | ✔️ Verificar tipos TypeScript     |
| `npm run lint`         | 🔍 Análisis de código ESLint      |
| `npm run lint:fix`     | 🩹 Auto-fix errores ESLint        |
| `npm run format`       | 🎨 Formatear con Prettier         |

### 📦 Producción y Build

| Comando                  | Resultado                   |
| ------------------------ | --------------------------- |
| `npm run build`          | 🌍 Build web optimizado     |
| `npm run build-electron` | 💿 **DMG + ZIP para macOS** |
| `npm run electron`       | 🚀 Ejecutar app construida  |

### ⚙️ Utilidades

| Comando                | Uso                              |
| ---------------------- | -------------------------------- |
| `npm run prepare`      | 🤝 Setup Husky git hooks         |
| `npm run format:check` | 🕵️ Verificar formato sin cambios |

### 🏆 Calidad de Código Automatizada

**Git Hooks configurados automáticamente:**

- **Pre-commit**: 🎯 ESLint + Prettier en archivos staged
- **Pre-push**: ✅ TypeCheck + Build verification

**Herramientas integradas:**

- **ESLint**: Reglas TypeScript + React + React Hooks
- **Prettier**: Formato consistente automático
- **TypeScript**: Verificación estática estricta
- **lint-staged**: Solo archivos modificados

## 🗺️ Estructura del Proyecto

### 🏢 Arquitectura Principal

```
azure-hours-calculator/
├── 💰 assets/                     # Iconos para construcción
│   ├── icon.icns (macOS)
│   └── icon-1024.png
├── 🌍 public/
│   ├── electron.js              # ⚡ Proceso principal Electron
│   ├── oauth-callback.html      # 🔐 OAuth Google callback
│   └── manifest.json            # PWA manifest
├── 🧩 src/
│   ├── 🧩 components/
│   │   ├── ElectronTitleBar.tsx       # 🖥️ Frameless window controls
│   │   ├── TaskCalculator.tsx         # 🧮 Calculadora principal
│   │   ├── SettingsDialog.tsx         # ⚙️ Configuración completa
│   │   ├── HolidaySelectionDialog.tsx # 🇪🇨 Selección granular feriados
│   │   ├── EventSelectionDialog.tsx   # 📅 Selección granular eventos
│   │   └── HolidayDay.tsx             # 🎆 Componente visual feriado
│   ├── ⚙️ hooks/                     # Sistema modular de hooks
│   │   ├── useTaskCalculation.ts      # 🧮 Lógica principal
│   │   ├── useHolidaySelection.ts     # 🇪🇨 Gestión granular feriados
│   │   ├── useEventSelection.ts       # 📅 Gestión granular eventos
│   │   ├── useGoogleAuth.ts           # 🔐 OAuth 2.0 flow
│   │   ├── useClipboard.ts            # 📋 Copy functionality
│   │   └── [...6 hooks más]           # Ver CLAUDE.md
│   ├── 🔗 services/
│   │   ├── googleCalendarService.ts   # 📅 Google Calendar API
│   │   ├── holidayService.ts          # 🇪🇨 Ecuador holidays API
│   │   └── iCalService.ts             # 📅 iCal integration
│   ├── 💾 stores/
│   │   ├── settingsStore.ts           # ⚙️ App settings (Zustand)
│   │   ├── uiStore.ts                 # 🎨 UI state
│   │   └── preferencesStore.ts        # 📁 User preferences
│   ├── 🛠️ utils/
│   │   ├── dateCalculations.ts        # 🧮 Core calculation logic
│   │   ├── electronUtils.ts           # ⚡ Electron helpers
│   │   └── googleAuthHelper.ts        # 🔐 OAuth helpers
│   └── 📝 types/index.ts             # ⚔️ TypeScript definitions
├── 🤝 .husky/                     # Git hooks automation
├── 📄 Documentation
│   ├── README.md                   # 📚 Overview general
│   ├── INSTALL.md                  # 🚀 Guía instalación
│   └── CLAUDE.md                   # 🤖 Documentación técnica completa
└── ⚙️ Config files
    ├── package.json                # Dependencies & scripts
    ├── tsconfig.json              # TypeScript config
    ├── eslint.config.mjs          # ESLint rules
    └── LICENSE                     # MIT License
```

### 🏆 Características de la Arquitectura

- **🧩 Componentes modulares**: Separación clara de responsabilidades
- **⚙️ Hooks especializados**: Lógica reutilizable y testeable
- **💾 Estado global optimizado**: Zustand para performance
- **🔐 Integraciones seguras**: OAuth 2.0 y manejo seguro de tokens
- **🏆 Calidad garantizada**: Git hooks, ESLint, Prettier, TypeScript

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto mantiene altos estándares de calidad.

### 🚀 Proceso de Contribución

```bash
# 1. Fork y clonar
git clone https://github.com/tu-usuario/azure-hours-calculator.git
cd azure-hours-calculator

# 2. Instalar y configurar
npm install --legacy-peer-deps
npm run prepare  # Git hooks automáticos

# 3. Crear rama feature
git checkout -b feature/amazing-feature

# 4. Desarrollar con calidad automática
# Los git hooks validarán tu código en cada commit

# 5. Push y PR
git push origin feature/amazing-feature
```

### 🏆 Estándares de Calidad Automatizados

**⚙️ Pre-commit (automático)**:

- ✔️ ESLint: Análisis de código
- ✔️ Prettier: Formato consistente
- ✔️ TypeScript: Verificación de tipos

**🚀 Pre-push (automático)**:

- ✔️ Build: Compilación exitosa
- ✔️ Type check: Tipado completo

### 📝 Guías para Contribuir

- **🧩 Componentes**: Usar React.memo para optimización
- **⚙️ Hooks**: Un hook por responsabilidad específica
- **🔐 APIs**: Manejo seguro de tokens y credenciales
- **🎨 UI**: Seguir el tema Material-UI oscuro
- **📝 Docs**: Actualizar CLAUDE.md para cambios arquitecturales

### 🐛 Reportar Issues

Incluir siempre:

- Versión de Node.js y npm
- Sistema operativo y versión
- Pasos para reproducir
- Logs de error completos

## 📝 Documentación Completa

| Archivo                  | Propósito                         |
| ------------------------ | --------------------------------- |
| [README.md](README.md)   | 📚 Overview y guía rápida         |
| [INSTALL.md](INSTALL.md) | 🚀 Instalación paso a paso        |
| [CLAUDE.md](CLAUDE.md)   | 🤖 Documentación técnica completa |
| [LICENSE](LICENSE)       | ⚖️ MIT License                    |

## 📚 Licencia

Distribuido bajo la **MIT License**. Ver [LICENSE](LICENSE) para más información.

## 🙋‍♂️ Autor

**Bryan Andagoya** - Desarrollador Full Stack en Ecuador 🇪🇨

- 🐙 GitHub: [@Bryan-an](https://github.com/Bryan-an)
- 📧 Email: bryanandagoya@gmail.com
- 💼 LinkedIn: Desarrollador especializado en React, TypeScript y Electron

---

## ⭐ ¡Dale una Estrella!

Si **Azure Hours Calculator** te resulta útil para tu trabajo con Azure DevOps, ¡no olvides darle una estrella en GitHub!

## 🤖 Desarrollado con IA

Este proyecto fue desarrollado con la asistencia de [Claude Code](https://claude.ai/code), demonstrando el potencial de la colaboración humano-IA en el desarrollo de software profesional.

### 🏆 Logros del Proyecto

- ✅ Aplicación nativa completamente funcional
- ✅ Integraciones complejas (Google Calendar, APIs)
- ✅ Arquitectura escalable y mantenible
- ✅ Código de calidad profesional
- ✅ Documentación completa y detallada

---

📊 **Estado del Proyecto**: 🟢 Activo y Funcional | **Versión**: 1.0.0 | **Última actualización**: Agosto 2025
