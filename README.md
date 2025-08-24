# Azure Hours Calculator

Una aplicación de escritorio para calcular fechas de inicio y fin de tareas en Azure DevOps, considerando horarios laborales, feriados ecuatorianos y reuniones programadas.

## Características

- **Cálculo automático de fechas**: Calcula la fecha de fin basada en horas estimadas y fecha de inicio
- **Horario laboral configurable**: 8:30 AM - 5:30 PM por defecto, con hora de almuerzo
- **Feriados ecuatorianos**: Detección automática de feriados nacionales de Ecuador
- **Integración con Notion**: Sincronización con tu calendario de Notion para excluir reuniones
- **Modo oscuro**: Interfaz diseñada específicamente para desarrolladores
- **Multi-plataforma**: Funciona en macOS, Windows y Linux

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd azure-hours-calculator
```

2. Instala las dependencias:
```bash
npm install
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

#### Notion (Opcional)
Para integrar con tu calendario de Notion:
1. Crea una integración en [Notion Developers](https://www.notion.so/my-integrations)
2. Obtén tu API key
3. Comparte tu base de datos de calendario con la integración
4. Copia el Database ID de tu base de datos
5. Configúralos en la aplicación

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
   - Feriados ecuatorianos
   - Reuniones de Notion (si está configurado)
5. **Calcula**: Obtén la fecha estimada de finalización

## Arquitectura

- **Frontend**: React + TypeScript + Material-UI
- **Desktop**: Electron
- **APIs**: 
  - Calendarific (feriados)
  - Notion API (reuniones)
- **Almacenamiento**: LocalStorage

## Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run electron`: Ejecuta la aplicación Electron
- `npm run electron-dev`: Desarrollo con hot reload
- `npm run build-electron`: Construye la aplicación de escritorio

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
├── services/           # Servicios para APIs
├── types/              # Definiciones de TypeScript
├── utils/              # Utilidades y cálculos
└── App.tsx             # Componente principal
```

## Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.