import React, { useEffect } from 'react';
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
  IconButton,
  InputAdornment,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { CalendarSource } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useCalendarConnection } from '../hooks/useCalendarConnection';
import { useFieldVisibility } from '../hooks/useFieldVisibility';
import { useTimeUtils } from '../hooks/useTimeUtils';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
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
}) => {
  // Zustand stores
  const {
    googleAuth,
    setGoogleAuth,
    calendarSource,
    setCalendarSource,
    calendarificApiKey,
    setCalendarificApiKey,
    securitySettings,
    setSecuritySettings,
    clearAllData,
  } = useSettingsStore();

  // Custom hooks for business logic
  const {
    connectionStatus: googleConnectionStatus,
    availableCalendars,
    handleGoogleSignIn,
    handleGoogleSignOut,
    testConnection: testGoogleConnection,
    initializeSession,
  } = useGoogleAuth();

  const {
    icalConnectionStatus,
    testICalConnection,
    resetICalConnection,
    icalUrl,
    setICalUrl,
  } = useCalendarConnection();

  const {
    showGoogleClientId,
    showCalendarificApiKey,
    toggleGoogleClientIdVisibility,
    toggleCalendarificApiKeyVisibility,
  } = useFieldVisibility();

  const {
    workSchedule,
    parseTime,
    formatTime,
    handleWorkDayChange,
    updateWorkScheduleField,
  } = useTimeUtils();

  useEffect(() => {
    if (open) {
      initializeSession();
      resetICalConnection();
    }
  }, [open, initializeSession, resetICalConnection]);

  const handleSave = () => {
    // All changes are already saved to stores in real-time
    // Just close the dialog
    onClose();
  };

  const handleReset = () => {
    clearAllData();
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
                  value={parseTime(workSchedule.startTime)}
                  onChange={(newValue) =>
                    updateWorkScheduleField('startTime', formatTime(newValue))
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TimePicker
                  label="Hora de fin"
                  value={parseTime(workSchedule.endTime)}
                  onChange={(newValue) =>
                    updateWorkScheduleField('endTime', formatTime(newValue))
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TimePicker
                  label="Inicio de almuerzo"
                  value={parseTime(workSchedule.lunchStart)}
                  onChange={(newValue) =>
                    updateWorkScheduleField('lunchStart', formatTime(newValue))
                  }
                  slots={{
                    textField: (params) => <TextField {...params} fullWidth />,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TimePicker
                  label="Fin de almuerzo"
                  value={parseTime(workSchedule.lunchEnd)}
                  onChange={(newValue) =>
                    updateWorkScheduleField('lunchEnd', formatTime(newValue))
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
                      checked={workSchedule.workDays.includes(day.value)}
                      onChange={(e) =>
                        handleWorkDayChange(day.value, e.target.checked)
                      }
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
              Fuente de Calendario
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="calendar-source-label">
                Seleccionar fuente de calendario
              </InputLabel>

              <Select
                labelId="calendar-source-label"
                value={calendarSource}
                onChange={(e) =>
                  setCalendarSource(e.target.value as CalendarSource)
                }
                label="Seleccionar fuente de calendario"
              >
                <MenuItem value="none">Sin calendario</MenuItem>
                <MenuItem value="google">Google Calendar (OAuth)</MenuItem>
                <MenuItem value="ical">iCal URL Público</MenuItem>
              </Select>
            </FormControl>

            {calendarSource === 'google' && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Google Calendar (OAuth)
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Configuración Google OAuth:</strong>
                  <br />
                  1. Ve a{' '}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Cloud Console
                  </a>
                  <br />
                  2. Crea un proyecto nuevo o selecciona uno existente
                  <br />
                  3. Habilita la API de Google Calendar
                  <br />
                  4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente
                  OAuth 2.0"
                  <br />
                  5. Selecciona "Aplicación web" como tipo
                  <br />
                  6. Configurar URLs autorizadas:
                  <br />
                  &nbsp;&nbsp;<strong>Orígenes JavaScript:</strong>{' '}
                  http://localhost:3000
                  <br />
                  &nbsp;&nbsp;<strong>URIs de redirección:</strong>{' '}
                  http://localhost:3000/oauth-callback.html
                  <br />
                  7. Copia el Client ID generado aquí abajo
                  <br />
                  <strong>Nota:</strong> Usa Google Identity Services + fallback
                  OAuth para Electron
                </Alert>
              </>
            )}

            {calendarSource === 'ical' && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  iCal URL Público
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Alternativa simple que no requiere permisos corporativos. Solo
                  necesitas la URL pública de tu calendario.
                </Alert>
              </>
            )}

            <Grid container spacing={2}>
              {calendarSource === 'google' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Google Client ID"
                    type={showGoogleClientId ? 'text' : 'password'}
                    value={googleAuth.clientId || ''}
                    onChange={(e) =>
                      setGoogleAuth({ clientId: e.target.value })
                    }
                    placeholder="123456789012-abc...xyz.apps.googleusercontent.com"
                    helperText="Client ID de tu aplicación Google OAuth (Google Cloud Console)"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle visibility"
                            onClick={toggleGoogleClientIdVisibility}
                            edge="end"
                          >
                            {showGoogleClientId ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}

              {calendarSource === 'ical' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="iCal URL Público"
                      value={icalUrl || ''}
                      onChange={(e) => setICalUrl(e.target.value)}
                      placeholder="https://calendar.google.com/calendar/ical/tu-calendario/public/basic.ics"
                      helperText="URL pública del calendario en formato iCal (.ics)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={testICalConnection}
                      disabled={icalConnectionStatus === 'testing' || !icalUrl}
                    >
                      {icalConnectionStatus === 'testing'
                        ? 'Probando...'
                        : 'Probar Conexión'}
                    </Button>

                    {icalConnectionStatus === 'success' && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Conexión exitosa con iCal
                      </Alert>
                    )}

                    {icalConnectionStatus === 'error' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        Error de conexión. Verifica que la URL sea accesible y
                        válida.
                      </Alert>
                    )}
                  </Grid>
                </>
              )}

              {calendarSource === 'google' && !googleAuth.accessToken && (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleGoogleSignIn}
                    disabled={
                      googleConnectionStatus === 'authenticating' ||
                      !googleAuth.clientId
                    }
                    color="primary"
                  >
                    {googleConnectionStatus === 'authenticating'
                      ? 'Autenticando...'
                      : 'Conectar con Google Calendar'}
                  </Button>

                  {googleConnectionStatus === 'error' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Error de autenticación. Verifica tu Client ID y permisos.
                    </Alert>
                  )}
                </Grid>
              )}

              {calendarSource === 'google' && googleAuth.accessToken && (
                <>
                  <Grid item xs={12}>
                    {availableCalendars.length > 0 && (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="calendar-select-label">
                          Calendario a usar
                        </InputLabel>

                        <Select
                          labelId="calendar-select-label"
                          value={googleAuth.calendarId || 'primary'}
                          onChange={(e) =>
                            setGoogleAuth({ calendarId: e.target.value })
                          }
                          label="Calendario a usar"
                        >
                          <MenuItem value="primary">
                            Calendario Principal
                          </MenuItem>

                          {availableCalendars.map((calendar) => (
                            <MenuItem key={calendar.id} value={calendar.id}>
                              {calendar.summary}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={testGoogleConnection}
                        disabled={googleConnectionStatus === 'testing'}
                      >
                        {googleConnectionStatus === 'testing'
                          ? 'Probando...'
                          : 'Probar Conexión'}
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleGoogleSignOut}
                      >
                        Desconectar
                      </Button>
                    </Box>

                    {googleConnectionStatus === 'success' && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Conexión exitosa con Google Calendar
                      </Alert>
                    )}

                    {googleConnectionStatus === 'error' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        Error de conexión. Verifica tu configuración.
                      </Alert>
                    )}
                  </Grid>
                </>
              )}
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
              Calendarific (Feriados de Ecuador)
            </Typography>

            <TextField
              fullWidth
              label="API Key de Calendarific"
              type={showCalendarificApiKey ? 'text' : 'password'}
              value={calendarificApiKey || ''}
              onChange={(e) => setCalendarificApiKey(e.target.value)}
              placeholder="1234567890abcdef..."
              helperText="Opcional: Para obtener feriados actualizados. Si no se configura, se usarán feriados predeterminados."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle visibility"
                      onClick={toggleCalendarificApiKeyVisibility}
                      edge="end"
                    >
                      {showCalendarificApiKey ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Configuración de Seguridad */}
            <Typography variant="h6" gutterBottom>
              Configuración de Seguridad
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={securitySettings.autoLogoutEnabled}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          autoLogoutEnabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Habilitar cierre de sesión automático"
                />
              </Grid>

              {securitySettings.autoLogoutEnabled && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Timeout de sesión (minutos)"
                    type="number"
                    value={securitySettings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeoutMinutes: parseInt(e.target.value) || 480,
                      })
                    }
                    inputProps={{ min: 30, max: 1440, step: 30 }}
                    helperText="Tiempo antes de cerrar sesión automáticamente (30-1440 min)"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Los eventos de seguridad se registran localmente para
                  auditoría
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleReset} color="secondary">
            Restablecer
          </Button>

          <Button onClick={onClose}>Cancelar</Button>

          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
