# Guía de Instalación - Azure Hours Calculator

## Requisitos del Sistema

- **macOS**: 10.14 Mojave o superior
- **Node.js**: versión 16 o superior
- **npm**: versión 7 o superior

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

### 3. Instalar Dependencias

```bash
# Instalar todas las dependencias necesarias
npm install --legacy-peer-deps
```

**Nota**: El flag `--legacy-peer-deps` es necesario debido a la compatibilidad entre algunas versiones de dependencias.

### 4. Configurar Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# API Keys opcionales
REACT_APP_CALENDARIFIC_API_KEY=tu_api_key_aquí
```

### 5. Probar la Instalación

```bash
# Construir la aplicación
npm run build
```

Si la construcción es exitosa, verás un mensaje como:
```
Compiled successfully.
File sizes after gzip:
...
```

### 6. Ejecutar la Aplicación

#### Opción A: Modo Desarrollo (Recomendado para pruebas)
```bash
# Iniciar en modo desarrollo
npm start
```
Esto abrirá la aplicación en tu navegador web en `http://localhost:3000`

#### Opción B: Aplicación de Escritorio
```bash
# Iniciar como aplicación de escritorio
npm run electron-dev
```

#### Opción C: Construir Aplicación Standalone
```bash
# Construir aplicación de escritorio
npm run build-electron
```
La aplicación construida estará en la carpeta `dist/`

## Configuración Inicial

### 1. Configurar Horario Laboral

Al abrir la aplicación por primera vez:

1. Haz clic en el ícono de engranaje (⚙️) en la esquina superior derecha
2. Configura tu horario:
   - **Hora de inicio**: Por defecto 8:30 AM
   - **Hora de fin**: Por defecto 5:30 PM  
   - **Almuerzo**: Por defecto 1:00 PM - 2:00 PM
   - **Días laborales**: Selecciona Lunes a Viernes

### 2. Configurar Integraciones (Opcional)

#### Notion (Para Calendario de Reuniones)

1. Ve a [Notion Developers](https://www.notion.so/my-integrations)
2. Crear nueva integración:
   - Nombre: "Azure Hours Calculator"
   - Workspace: Tu workspace
   - Capacidades: Leer contenido
3. Copiar el "Internal Integration Token"
4. En tu base de datos de calendario en Notion:
   - Clic en "..." → "Add connections"
   - Seleccionar tu integración
5. Copiar el Database ID de la URL de tu base de datos
6. En la aplicación:
   - Pegar API Key en "API Key de Notion"
   - Pegar Database ID en "Database ID de Notion"
   - Hacer clic en "Probar Conexión"

#### Calendarific (Para Feriados Actualizados)

1. Ve a [Calendarific](https://calendarific.com/)
2. Crear cuenta gratuita
3. Copiar tu API Key
4. En la aplicación, pegar en "API Key de Calendarific"

**Nota**: Si no configuras Calendarific, la aplicación usará una lista predeterminada de feriados ecuatorianos.

## Uso Básico

1. **Ingresa las horas estimadas**: Número decimal (ej: 8.5 para 8 horas y 30 minutos)
2. **Selecciona fecha de inicio**: Fecha y hora cuando comenzarás la tarea
3. **Configura exclusiones**:
   - ✅ Excluir feriados ecuatorianos
   - ✅ Excluir tiempo de reuniones (si tienes Notion configurado)
4. **Haz clic en "Calcular Fechas"**

La aplicación te mostrará:
- Fecha estimada de finalización
- Días laborales utilizados
- Horas de trabajo efectivas
- Feriados que fueron excluidos
- Reuniones que fueron excluidas

## Solución de Problemas

### Error: "npm ERR! peer dep missing"
```bash
npm install --legacy-peer-deps
```

### Error: "Module not found"
```bash
# Limpiar caché y reinstalar
npm cache clean --force
rm -rf node_modules
npm install --legacy-peer-deps
```

### La aplicación no se ve en modo oscuro
- En macOS, asegúrate de tener el modo oscuro habilitado en Preferencias del Sistema
- La aplicación hereda automáticamente el tema del sistema

### Problemas con Notion
- Verifica que el Database ID sea correcto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- Asegúrate de que la integración tenga acceso a la base de datos
- La base de datos debe tener columnas llamadas "Date", "Title", y "Optional"

### Problemas con feriados
- Si no tienes API Key de Calendarific, la aplicación usará feriados predeterminados
- Los feriados predeterminados incluyen los principales feriados nacionales de Ecuador

## Contacto y Soporte

Si encuentras algún problema durante la instalación, verifica:

1. Que tienes la versión correcta de Node.js
2. Que ejecutaste `npm install --legacy-peer-deps`
3. Que el puerto 3000 no esté ocupado por otra aplicación
4. Que tienes permisos suficientes en tu sistema

Para problemas específicos, revisa los logs de error en la consola.