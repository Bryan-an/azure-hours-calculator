import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
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
import { WorkSchedule } from './types';
import { StorageUtil } from './utils/storage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        },
      },
    },
  },
});

function App() {
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(StorageUtil.getDefaultWorkSchedule());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada al inicio
    const savedSchedule = StorageUtil.loadWorkSchedule();
    if (savedSchedule) {
      setWorkSchedule(savedSchedule);
    }
  }, []);

  const handleWorkScheduleChange = (newSchedule: WorkSchedule) => {
    setWorkSchedule(newSchedule);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
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

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Calculadora de Fechas para Azure DevOps
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
              Calcula automáticamente las fechas de inicio y fin de tus tareas considerando tu horario laboral,
              feriados ecuatorianos y reuniones programadas.
            </Typography>
          </Box>

          <TaskCalculator workSchedule={workSchedule} />
        </Container>

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