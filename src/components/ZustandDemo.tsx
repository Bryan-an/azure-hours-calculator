import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

export const ZustandDemo: React.FC = () => {
  // Settings store
  const {
    workSchedule,
    calendarificApiKey,
    calendarSource,
    setCalendarificApiKey,
    setCalendarSource,
    clearAllData,
  } = useSettingsStore();

  // UI store
  const {
    settingsOpen,
    notification,
    setSettingsOpen,
    showNotification,
    hideNotification,
  } = useUIStore();

  const handleTestPersistence = () => {
    const testApiKey = `test-key-${Date.now()}`;
    setCalendarificApiKey(testApiKey);
    showNotification(`API Key guardada: ${testApiKey}`, 'success');
  };

  const handleTestCalendarSource = () => {
    const newSource = calendarSource === 'google' ? 'ical' : 'google';
    setCalendarSource(newSource);
    showNotification(`Fuente de calendario cambiada a: ${newSource}`, 'info');
  };

  const handleClearData = () => {
    clearAllData();
    showNotification('Todos los datos han sido borrados', 'warning');
  };

  return (
    <Card sx={{ mt: 2, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🐻 Zustand State Management Demo
        </Typography>

        {notification && (
          <Alert
            severity={notification.severity}
            onClose={hideNotification}
            sx={{ mb: 2 }}
          >
            {notification.message}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Estado Actual:
          </Typography>
          <Typography variant="body2">
            • Horario de trabajo: {workSchedule.startTime} -{' '}
            {workSchedule.endTime}
          </Typography>
          <Typography variant="body2">
            • API Key: {calendarificApiKey || 'No configurada'}
          </Typography>
          <Typography variant="body2">
            • Fuente de calendario: {calendarSource}
          </Typography>
          <Typography variant="body2">
            • Settings dialog abierto: {settingsOpen ? 'Sí' : 'No'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleTestPersistence}>
            Test Persistencia
          </Button>

          <Button variant="outlined" onClick={handleTestCalendarSource}>
            Cambiar Fuente
          </Button>

          <Button
            variant="outlined"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            Toggle Settings Dialog
          </Button>

          <Button variant="outlined" color="warning" onClick={handleClearData}>
            Limpiar Datos
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Los datos se persisten automáticamente en localStorage. Recarga la
            página para verificar que el estado se mantiene.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
