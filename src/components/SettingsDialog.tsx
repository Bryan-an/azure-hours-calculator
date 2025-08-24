import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { WorkSchedule } from '../types';
import { StorageUtil } from '../utils/storage';
import { NotionService } from '../services/notionService';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  workSchedule: WorkSchedule;
  onWorkScheduleChange: (schedule: WorkSchedule) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  workSchedule,
  onWorkScheduleChange,
}) => {
  const [localSchedule, setLocalSchedule] = useState<WorkSchedule>(workSchedule);
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [calendarificApiKey, setCalendarificApiKey] = useState('');
  const [notionConnectionStatus, setNotionConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (open) {
      setLocalSchedule(workSchedule);
      setNotionApiKey(StorageUtil.loadNotionApiKey() || '');
      setNotionDatabaseId(StorageUtil.loadNotionDatabaseId() || '');
      setCalendarificApiKey(StorageUtil.loadCalendarificApiKey() || '');
    }
  }, [open, workSchedule]);

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '09:00';
    return date.toTimeString().slice(0, 5);
  };

  const handleWorkDayChange = (day: number, checked: boolean) => {
    const newWorkDays = checked
      ? [...localSchedule.workDays, day].sort()
      : localSchedule.workDays.filter(d => d !== day);

    setLocalSchedule({ ...localSchedule, workDays: newWorkDays });
  };

  const testNotionConnection = async () => {
    if (!notionApiKey || !notionDatabaseId) {
      setNotionConnectionStatus('error');
      return;
    }

    setNotionConnectionStatus('testing');
    const notionService = new NotionService(notionApiKey, notionDatabaseId);
    const isConnected = await notionService.testConnection();
    setNotionConnectionStatus(isConnected ? 'success' : 'error');
  };

  const handleSave = () => {
    // Guardar configuración laboral
    onWorkScheduleChange(localSchedule);
    StorageUtil.saveWorkSchedule(localSchedule);

    // Guardar configuraciones de APIs
    StorageUtil.saveNotionApiKey(notionApiKey);
    StorageUtil.saveNotionDatabaseId(notionDatabaseId);
    StorageUtil.saveCalendarificApiKey(calendarificApiKey);

    onClose();
  };

  const handleReset = () => {
    const defaultSchedule = StorageUtil.getDefaultWorkSchedule();
    setLocalSchedule(defaultSchedule);
    setNotionApiKey('');
    setNotionDatabaseId('');
    setCalendarificApiKey('');
    setNotionConnectionStatus('idle');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Configuración</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Configuración de Horario Laboral */}
            <Typography variant="h6" gutterBottom>
              Horario Laboral
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TimePicker
                  label="Hora de inicio"
                  value={parseTime(localSchedule.startTime)}
                  onChange={(newValue) =>
                    setLocalSchedule({
                      ...localSchedule,
                      startTime: formatTime(newValue),
                    })
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="Hora de fin"
                  value={parseTime(localSchedule.endTime)}
                  onChange={(newValue) =>
                    setLocalSchedule({
                      ...localSchedule,
                      endTime: formatTime(newValue),
                    })
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="Inicio de almuerzo"
                  value={parseTime(localSchedule.lunchStart)}
                  onChange={(newValue) =>
                    setLocalSchedule({
                      ...localSchedule,
                      lunchStart: formatTime(newValue),
                    })
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="Fin de almuerzo"
                  value={parseTime(localSchedule.lunchEnd)}
                  onChange={(newValue) =>
                    setLocalSchedule({
                      ...localSchedule,
                      lunchEnd: formatTime(newValue),
                    })
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Días laborales
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DAYS_OF_WEEK.map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={localSchedule.workDays.includes(day.value)}
                      onChange={(e) => handleWorkDayChange(day.value, e.target.checked)}
                    />
                  }
                  label={day.label}
                />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Configuración de APIs */}
            <Typography variant="h6" gutterBottom>
              Integraciones
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Notion (Calendario de Reuniones)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key de Notion"
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="secret_..."
                  helperText="Token de integración de Notion para acceder a tu calendario"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Database ID de Notion"
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  placeholder="12345678-1234-1234-1234-123456789abc"
                  helperText="ID de la base de datos donde tienes tus reuniones"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={testNotionConnection}
                  disabled={notionConnectionStatus === 'testing' || !notionApiKey || !notionDatabaseId}
                >
                  {notionConnectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
                </Button>
                {notionConnectionStatus === 'success' && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Conexión exitosa con Notion
                  </Alert>
                )}
                {notionConnectionStatus === 'error' && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Error de conexión. Verifica tus credenciales.
                  </Alert>
                )}
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
              Calendarific (Feriados de Ecuador)
            </Typography>
            <TextField
              fullWidth
              label="API Key de Calendarific"
              type="password"
              value={calendarificApiKey}
              onChange={(e) => setCalendarificApiKey(e.target.value)}
              placeholder="1234567890abcdef..."
              helperText="Opcional: Para obtener feriados actualizados. Si no se configura, se usarán feriados predeterminados."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} color="secondary">
            Restablecer
          </Button>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};