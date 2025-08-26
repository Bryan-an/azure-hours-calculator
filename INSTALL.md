# Guía de Instalación - Azure Hours Calculator

> **Versión**: 1.0.0 | **Plataforma**: macOS (Apple Silicon & Intel) | **Última actualización**: Agosto 2025

Esta guía te ayudará a instalar y configurar Azure Hours Calculator, una aplicación profesional de escritorio para calcular fechas de tareas considerando horarios laborales, feriados ecuatorianos y eventos de Google Calendar.

## Requisitos del Sistema

- **macOS**: 10.14 Mojave o superior (Apple Silicon y Intel soportados)
- **Node.js**: versión 16 o superior (recomendado 18+)
- **npm**: versión 7 o superior (recomendado 9+)
- **Git**: Para clonar el repositorio (opcional si se descarga ZIP)

## Instalación Paso a Paso

### 1. Verificar Prerequisites

```bash
# Verificar Node.js
node --version
# Debe mostrar v16.x.x o superior

# Verificar npm
npm --version
# Debe mostrar 7.x.x o superior
```

Si no tienes Node.js instalado:

```bash
# Instalar con Homebrew (recomendado)
brew install node

# O descargar desde https://nodejs.org/
```

### 2. Clonar o Descomprimir el Proyecto

```bash
# Si tienes el código fuente
cd azure-hours-calculator

# O navegar a la carpeta donde descomprimiste el proyecto
```

### 3. Instalar Dependencias y Configurar Calidad de Código

```bash
# Instalar todas las dependencias necesarias
npm install --legacy-peer-deps

# Configurar git hooks (ESLint, Prettier, TypeScript)
npm run prepare
```

**Notas importantes**:

- El flag `--legacy-peer-deps` es necesario debido a la compatibilidad entre versiones de dependencias de React 18 y Material-UI
- `npm run prepare` configura automáticamente Husky para git hooks de calidad de código
- Los git hooks ejecutarán ESLint y Prettier automáticamente en cada commit

### 4. Configurar Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Configuración de desarrollo
BROWSER=none                           # No abrir navegador automáticamente

# API Keys opcionales
REACT_APP_CALENDARIFIC_API_KEY=tu_api_key_aquí
```

**Nota**: Google Calendar se configura completamente desde la interfaz de usuario, no requiere variables de entorno.

### 5. Verificar la Instalación

```bash
# Verificar tipos TypeScript
npm run typecheck

# Verificar calidad de código
npm run lint

# Construir la aplicación
npm run build
```

Si todo está correcto, verás:

```
# TypeScript
✓ No type errors found

# ESLint
✓ No linting errors found

# Build
Compiled successfully.
File sizes after gzip:
...
```

### 6. Ejecutar la Aplicación

#### Opción A: Aplicación de Escritorio (Recomendado)

```bash
# Iniciar como aplicación nativa con hot reload
npm run electron-dev
```

Esto abrirá la aplicación como ventana nativa de escritorio con barra de título personalizada.

#### Opción B: Modo Web (Para desarrollo)

```bash
# Iniciar servidor de desarrollo web
npm start
```

Esto abrirá la aplicación en tu navegador en `http://localhost:3000` (algunas funciones de Electron no estarán disponibles).

#### Opción C: Construir Aplicación Distribuible

```bash
# Construir aplicación de escritorio (DMG + ZIP)
npm run build-electron
```

La aplicación construida estará en la carpeta `dist/`:

- `dist/Azure Hours Calculator-1.0.0.dmg` (Instalador macOS)
- `dist/Azure Hours Calculator-1.0.0-mac.zip` (Aplicación comprimida)

## Configuración Inicial

### 1. Configurar Horario Laboral

Al abrir la aplicación por primera vez:

1. Haz clic en el ícono de configuración (⚙️) en la barra de herramientas
2. En la sección "Horario Laboral", configura:
   - **Hora de inicio**: Por defecto 8:30 AM
   - **Hora de fin**: Por defecto 5:30 PM
   - **Almuerzo**: Por defecto 1:00 PM - 2:00 PM
   - **Días laborales**: Por defecto Lunes a Viernes
3. Los cambios se guardan automáticamente en localStorage

### 2. Configurar Integraciones (Opcional)

#### Google Calendar (Para Eventos y Reuniones)

**Configuración en Google Cloud Console:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto:
   - Nombre: "Azure Hours Calculator" (o el que prefieras)
   - Habilitar Google Calendar API
3. Configurar OAuth 2.0:
   - Ir a "APIs y servicios" → "Credenciales"
   - Crear credenciales → OAuth 2.0 Client ID
   - Tipo: **Aplicación de escritorio** (importante)
   - Copiar el Client ID generado

**Configuración en la Aplicación:**

4. En Azure Hours Calculator:
   - Abrir Configuración → Integraciones
   - Pegar Client ID en "Google Client ID"
   - Hacer clic en "Conectar con Google"
   - Se abrirá el navegador para autorizar (acepta todos los permisos)
   - Seleccionar calendario específico si tienes múltiples calendarios
   - La conexión se verificará automáticamente

**Funcionalidades disponibles:**

- Exclusión automática de reuniones del cálculo
- Selección granular de eventos individuales
- Sincronización en tiempo real con tu calendario

#### Calendarific (Para Feriados Actualizados)

1. Ve a [Calendarific](https://calendarific.com/)
2. Crear cuenta gratuita (plan gratuito: 1000 requests/mes)
3. Ve a tu dashboard y copia tu API Key
4. En la aplicación:
   - Configuración → Integraciones
   - Pegar en "API Key de Calendarific"
   - La aplicación verificará automáticamente la conexión

**Fallback incluido**: Si no configuras Calendarific, la aplicación usará una lista predeterminada completa de feriados ecuatorianos para 2025, incluyendo:

- Feriados nacionales oficiales
- Carnaval y Semana Santa (fechas variables)
- Días de descanso obligatorio
- Feriados regionales principales

## Uso Básico

### Flujo Principal

1. **Ingresa las horas estimadas**: Número decimal (ej: 8.5 para 8 horas y 30 minutos)
2. **Selecciona fecha de inicio**: Usa el date picker para fecha y hora exacta
3. **Configura exclusiones globales**:
   - ✅ Excluir feriados ecuatorianos
   - ✅ Excluir eventos de calendario (si tienes Google Calendar configurado)
4. **Ajustes granulares** (opcional):
   - Clic en "Seleccionar feriados" para elegir feriados específicos
   - Clic en "Seleccionar eventos" para elegir reuniones específicas
5. **Haz clic en "Calcular Fechas"**

### Resultados Detallados

La aplicación te mostrará:

- **Fecha estimada de finalización** (con botón de copiado)
- Días laborales utilizados
- Horas de trabajo efectivas
- Feriados excluidos con detalles
- Eventos de calendario excluidos con duración
- Resumen visual con colores distintivos

### Funciones Avanzadas

- **Copia rápida**: Botón para copiar la fecha final al clipboard
- **Notificaciones**: Toast elegantes para confirmaciones y errores
- **Persistencia**: Todas las configuraciones se guardan automáticamente
- **Validaciones**: Verificación en tiempo real de datos ingresados

## Solución de Problemas

### Errores de Instalación

**Error: "npm ERR! peer dep missing"**

```bash
npm install --legacy-peer-deps
```

**Error: "Module not found" o problemas de dependencias**

```bash
# Limpiar completamente y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Error: "Husky not found" o git hooks no funcionan**

```bash
# Reconfigurar git hooks
npm run prepare
git config core.hooksPath .husky
```

### Problemas de Interfaz

**La aplicación no se ve en modo oscuro**

- En macOS, habilita modo oscuro en Preferencias del Sistema → General → Apariencia
- La aplicación hereda automáticamente el tema del sistema
- Reinicia la aplicación después de cambiar el tema

**La ventana no se puede arrastrar**

- Esto es normal: solo la barra de título personalizada es arrastrable
- Evita arrastrar desde botones o controles de la interfaz

### Problemas de Integraciones

**Google Calendar no conecta**

- Verifica que el Client ID sea exactamente como aparece en Google Cloud Console
- Asegúrate de crear credenciales para "Aplicación de escritorio"
- Si aparece "Esta app no ha sido verificada":
  1. Clic en "Avanzado"
  2. Clic en "Ir a Azure Hours Calculator (no seguro)"
  3. Autorizar todos los permisos solicitados
- La aplicación solo lee eventos, jamás modifica tu calendario

**Calendarific API no funciona**

- Verifica que la API Key sea correcta
- El plan gratuito tiene límite de 1000 requests/mes
- Si superas el límite, la aplicación usará feriados predeterminados

### Problemas de Rendimiento

**La aplicación va lenta con muchos eventos**

- Los componentes están optimizados con memoización
- Si tienes miles de eventos, considera filtrar por calendario específico
- La aplicación cachea los resultados para mejorar el rendimiento

## Verificación Final y Diagnóstico

Si encuentras algún problema durante la instalación, ejecuta esta verificación completa:

```bash
# 1. Verificar prerequisitos
node --version          # Debe ser 16+ (recomendado 18+)
npm --version           # Debe ser 7+ (recomendado 9+)

# 2. Verificar instalación
npm run typecheck       # TypeScript sin errores
npm run lint            # ESLint sin errores
npm run build           # Build exitoso

# 3. Probar aplicación
npm run electron-dev    # Debe abrir ventana nativa
```

### Lista de Verificación

- [ ] Node.js versión 16 o superior instalado
- [ ] Dependencias instaladas con `--legacy-peer-deps`
- [ ] Git hooks configurados con `npm run prepare`
- [ ] TypeScript compila sin errores
- [ ] ESLint pasa sin warnings
- [ ] Build de React exitoso
- [ ] Aplicación Electron abre correctamente
- [ ] Puerto 3000 libre (para modo desarrollo)
- [ ] Permisos de escritura en la carpeta del proyecto

### Soporte y Logs

**Para reportar problemas**, incluye siempre:

1. Versión de Node.js: `node --version`
2. Versión de npm: `npm --version`
3. Sistema operativo y versión
4. Logs completos del error
5. Pasos exactos para reproducir el problema

**Logs útiles**:

```bash
# Logs detallados de instalación
npm install --legacy-peer-deps --verbose

# Logs de build con detalles
npm run build 2>&1 | tee build.log

# Logs de Electron
npm run electron-dev 2>&1 | tee electron.log
```
