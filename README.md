# Azure Hours Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-29.3-green)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)

Una aplicación de escritorio profesional para calcular fechas de inicio y fin de tareas en Azure DevOps, considerando horarios laborales, feriados ecuatorianos y eventos de Google Calendar.

## ✨ Características Principales

- **🧮 Cálculo automático de fechas**: Calcula la fecha de fin basada en horas estimadas y fecha de inicio
- **⏰ Horario laboral configurable**: 8:30 AM - 5:30 PM por defecto, con hora de almuerzo personalizable
- **🇪🇨 Feriados ecuatorianos**: Detección automática de feriados nacionales de Ecuador (2025)
- **📅 Integración con Google Calendar**: Sincronización con tu calendario de Google para excluir reuniones y eventos
- **🎨 Interfaz profesional**: Modo oscuro diseñado específicamente para desarrolladores
- **🖥️ Aplicación nativa**: Construida con Electron para macOS (ARM64 y x64)
- **⚡ Hot reload**: Desarrollo rápido con recarga automática
- **🔒 Seguridad**: Manejo seguro de tokens y configuraciones

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/Bryan-an/azure-hours-calculator.git
cd azure-hours-calculator
```

2. Instala las dependencias:

```bash
npm install --legacy-peer-deps
```

3. Para desarrollo:

```bash
npm run electron-dev
```

4. Para construir la aplicación:

```bash
npm run build-electron
```

## Configuración

### Horario Laboral

- **Hora de inicio**: 8:30 AM (configurable)
- **Hora de fin**: 5:30 PM (configurable)
- **Almuerzo**: 1:00 PM - 2:00 PM (configurable)
- **Días laborales**: Lunes a Viernes (configurable)

### Integraciones

#### Google Calendar (Opcional)

Para integrar con tu calendario de Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar
4. Crea credenciales OAuth 2.0 para aplicación de escritorio
5. Obtén tu Client ID
6. Configúralo en la aplicación y autoriza el acceso

#### Calendarific (Opcional)

Para obtener feriados actualizados de Ecuador:

1. Regístrate en [Calendarific](https://calendarific.com/)
2. Obtén tu API key gratuita
3. Configúrala en la aplicación

## Uso

1. **Configura tu horario**: Ve a Configuración para ajustar tu horario laboral
2. **Ingresa las horas estimadas**: Número decimal de horas (ej: 8.5)
3. **Selecciona fecha de inicio**: Fecha y hora de inicio de la tarea
4. **Habilita exclusiones**:
   - Feriados ecuatorianos automáticos
   - Eventos de Google Calendar (si está configurado)
   - Selección granular de feriados específicos
5. **Calcula**: Obtén la fecha estimada de finalización

## Arquitectura

- **Frontend**: React + TypeScript + Material-UI
- **Desktop**: Electron
- **APIs**:
  - Calendarific (feriados actualizados)
  - Google Calendar API (eventos y reuniones)
  - Fallback a feriados estáticos Ecuador 2025
- **Almacenamiento**: LocalStorage

## 🚀 Scripts Disponibles

### Desarrollo

- `npm start`: Inicia el servidor de desarrollo web
- `npm run electron-dev`: Desarrollo Electron con hot reload
- `npm run typecheck`: Verificar tipos de TypeScript
- `npm run lint`: Ejecutar ESLint
- `npm run lint:fix`: Corregir errores de ESLint automáticamente
- `npm run format`: Formatear código con Prettier

### Producción

- `npm run build`: Construye la aplicación web para producción
- `npm run build-electron`: Construye la aplicación de escritorio (DMG + ZIP)
- `npm run electron`: Ejecuta la aplicación Electron construida

### Calidad de Código

- **ESLint**: Configurado con reglas de TypeScript y React
- **Prettier**: Formateo automático de código
- **Husky**: Git hooks para calidad de código
  - Pre-commit: lint + format archivos modificados
  - Pre-push: typecheck + build completo

## Estructura del Proyecto

```
azure-hours-calculator/
├── public/
│   ├── electron.js           # Proceso principal de Electron
│   ├── oauth-callback.html   # Callback para Google OAuth
│   └── manifest.json         # PWA manifest
├── src/
│   ├── components/
│   │   ├── ElectronTitleBar.tsx    # Barra de título personalizada
│   │   ├── SettingsDialog.tsx      # Configuración de la app
│   │   └── TaskCalculator.tsx      # Calculadora principal
│   ├── services/
│   │   ├── googleCalendarService.ts # Google Calendar API
│   │   └── holidayService.ts        # API de feriados
│   ├── utils/
│   │   ├── dateCalculations.ts      # Lógica de cálculo de fechas
│   │   ├── electronUtils.ts         # Utilidades para Electron
│   │   └── storage.ts               # Manejo de localStorage
│   ├── types/
│   │   └── index.ts                 # Definiciones TypeScript
│   └── App.tsx                      # Componente principal
├── assets/                          # Iconos y recursos persistentes
├── .husky/                          # Git hooks
├── eslint.config.mjs               # Configuración ESLint
├── CLAUDE.md                       # Documentación técnica detallada
└── LICENSE                         # MIT License
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Calidad de Código

Este proyecto mantiene altos estándares de calidad:

- **ESLint**: Análisis estático de código
- **Prettier**: Formateo consistente
- **TypeScript**: Tipado estricto
- **Git Hooks**: Verificaciones automáticas en commits
- **Tests**: Typecheck obligatorio antes de push

Los git hooks se ejecutan automáticamente para mantener la calidad del código.

## 📄 Licencia

Distribuido bajo la **MIT License**. Ver [LICENSE](LICENSE) para más información.

## 🙋‍♂️ Autor

**Bryan Andagoya** - Desarrollador en Ecuador 🇪🇨

- GitHub: [@Bryan-an](https://github.com/Bryan-an)
- Proyecto: [azure-hours-calculator](https://github.com/Bryan-an/azure-hours-calculator)

---

⭐ Si te resulta útil este proyecto, ¡no olvides darle una estrella!

🤖 Desarrollado con la asistencia de [Claude Code](https://claude.ai/code)
