import React, { useEffect } from 'react';
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
import { darkTheme } from './theme';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { initializeStores } from './stores';

function App() {
  // Zustand stores
  const updateLastActivity = useSettingsStore(
    (state) => state.updateLastActivity
  );

  const clearExpiredSession = useSettingsStore(
    (state) => state.clearExpiredSession
  );

  const settingsOpen = useUIStore((state) => state.settingsOpen);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);

  // Detectar si estamos en Electron
  const isElectron = !!(window as any).require;

  useEffect(() => {
    // Initialize Zustand stores
    initializeStores();

    // Configurar clase CSS para Electron
    if (isElectron) {
      document.body.classList.add('electron-app');
    }

    // Set up activity tracking for security
    const handleActivity = () => {
      updateLastActivity();
    };

    // Track user activity for security purposes
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup event listeners
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isElectron, updateLastActivity, clearExpiredSession]);

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

            <TaskCalculator />
          </Container>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
