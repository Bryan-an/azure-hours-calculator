import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Box,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { TaskCalculator } from './components/TaskCalculator';
import { SettingsDialog } from './components/SettingsDialog';
import { ElectronTitleBar } from './components/ElectronTitleBar';
import { WorkSchedule } from './types';
import { StorageUtil } from './utils/storage';
import { darkTheme } from './theme';

function App() {
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(
    StorageUtil.getDefaultWorkSchedule()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Detectar si estamos en Electron
  const isElectron = !!(window as any).require;

  useEffect(() => {
    // Cargar configuración guardada al inicio
    const savedSchedule = StorageUtil.loadWorkSchedule();
    if (savedSchedule) {
      setWorkSchedule(savedSchedule);
    }

    // Configurar clase CSS para Electron
    if (isElectron) {
      document.body.classList.add('electron-app');
    }
  }, [isElectron]);

  const handleWorkScheduleChange = (newSchedule: WorkSchedule) => {
    setWorkSchedule(newSchedule);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        {/* Barra de título para Electron */}
        {isElectron && (
          <ElectronTitleBar onSettingsClick={() => setSettingsOpen(true)} />
        )}

        {/* AppBar solo para web */}
        {!isElectron && (
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Azure Hours Calculator
              </Typography>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="configuración"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Contenido principal - scrollable en Electron */}
        <div className={isElectron ? 'main-content' : ''}>
          <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                align="center"
              >
                Calculadora de Fechas para Azure DevOps
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                align="center"
                sx={{ mb: 4 }}
              >
                Calcula automáticamente las fechas de inicio y fin de tus tareas
                considerando tu horario laboral, feriados ecuatorianos y
                reuniones programadas.
              </Typography>
            </Box>

            <TaskCalculator workSchedule={workSchedule} />
          </Container>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workSchedule={workSchedule}
          onWorkScheduleChange={handleWorkScheduleChange}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
