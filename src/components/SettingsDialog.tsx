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
import { StorageUtil, CalendarSource } from '../utils/storage';
import { GoogleCalendarService, GoogleAuthHelper } from '../services/googleCalendarService';
import { ICalService } from '../services/iCalService';

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
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [calendarificApiKey, setCalendarificApiKey] = useState('');
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'authenticating'>('idle');
  const [availableCalendars, setAvailableCalendars] = useState<Array<{id: string, summary: string}>>([]);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<number>(480);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState<boolean>(true);
  const [calendarSource, setCalendarSource] = useState<CalendarSource>('none');
  const [icalUrl, setIcalUrl] = useState<string>('');
  const [icalConnectionStatus, setIcalConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (open) {
      setLocalSchedule(workSchedule);
      setGoogleClientId(StorageUtil.loadGoogleClientId() || '');
      setGoogleAccessToken(StorageUtil.loadGoogleAccessToken() || '');
      setGoogleCalendarId(StorageUtil.loadGoogleCalendarId() || '');
      setCalendarificApiKey(StorageUtil.loadCalendarificApiKey() || '');
      
      // Load calendar configuration
      setCalendarSource(StorageUtil.loadCalendarSource());
      setIcalUrl(StorageUtil.loadICalUrl() || '');
      
      // Load security settings
      const securitySettings = StorageUtil.loadSecuritySettings();
      setSessionTimeout(securitySettings.sessionTimeoutMinutes);
      setAutoLogoutEnabled(securitySettings.autoLogoutEnabled);
      
      // Check if user is signed in to Google and session is not expired
      StorageUtil.clearExpiredSession();
      setIsGoogleSignedIn(!!StorageUtil.loadGoogleAccessToken());
      
      // Load available calendars if already authenticated
      if (StorageUtil.loadGoogleAccessToken()) {
        loadAvailableCalendars();
      }
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

  const loadAvailableCalendars = async () => {
    const accessToken = StorageUtil.loadGoogleAccessToken();
    if (!accessToken) return;

    try {
      const googleService = new GoogleCalendarService({ accessToken });
      const calendars = await googleService.getCalendarList();
      setAvailableCalendars(calendars);
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  };

  const validateGoogleClientId = (clientId: string): boolean => {
    // Basic Google Client ID validation
    const clientIdPattern = /^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/;
    return clientIdPattern.test(clientId);
  };

  const handleGoogleSignIn = async () => {
    if (!googleClientId || !googleClientId.trim()) {
      alert('Por favor ingresa tu Google Client ID antes de autenticar.');
      return;
    }

    const trimmedClientId = googleClientId.trim();
    if (!validateGoogleClientId(trimmedClientId)) {
      alert('El formato del Client ID parece incorrecto. Debe ser como: 123456789-abc123def.apps.googleusercontent.com');
      return;
    }

    setGoogleConnectionStatus('authenticating');
    
    try {
      GoogleAuthHelper.setClientId(googleClientId.trim());
      
      // Run diagnosis before attempting to sign in
      console.log('Running Google API diagnosis before sign-in...');
      GoogleAuthHelper.diagnoseGoogleAPI();
      
      const accessToken = await GoogleAuthHelper.signIn();
      
      setGoogleAccessToken(accessToken);
      setIsGoogleSignedIn(true);
      
      // Test connection and load calendars
      const googleService = new GoogleCalendarService({ accessToken });
      const isConnected = await googleService.testConnection();
      
      if (isConnected) {
        setGoogleConnectionStatus('success');
        await loadAvailableCalendars();
      } else {
        setGoogleConnectionStatus('error');
        alert('No se pudo conectar con Google Calendar. Verifica los permisos de tu aplicación.');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setGoogleConnectionStatus('error');
      
      // Show specific error message to user
      const errorMessage = error.message || 'Error de autenticación desconocido';
      alert(`Error de autenticación: ${errorMessage}`);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await GoogleAuthHelper.signOut();
      setGoogleAccessToken('');
      setGoogleCalendarId('');
      setIsGoogleSignedIn(false);
      setAvailableCalendars([]);
      setGoogleConnectionStatus('idle');
      StorageUtil.clearGoogleAuth();
    } catch (error) {
      console.error('Google sign-out error:', error);
    }
  };

  const testGoogleConnection = async () => {
    if (!googleAccessToken) {
      setGoogleConnectionStatus('error');
      return;
    }

    setGoogleConnectionStatus('testing');
    const googleService = new GoogleCalendarService({ 
      accessToken: googleAccessToken,
      calendarId: googleCalendarId || 'primary'
    });
    const isConnected = await googleService.testConnection();
    setGoogleConnectionStatus(isConnected ? 'success' : 'error');
  };

  const testICalConnection = async () => {
    if (!icalUrl || !icalUrl.trim()) {
      setIcalConnectionStatus('error');
      return;
    }

    setIcalConnectionStatus('testing');
    const icalService = new ICalService({ url: icalUrl });
    const isConnected = await icalService.testConnection();
    setIcalConnectionStatus(isConnected ? 'success' : 'error');
  };

  const handleSave = () => {
    // Guardar configuración laboral
    onWorkScheduleChange(localSchedule);
    StorageUtil.saveWorkSchedule(localSchedule);

    // Guardar configuraciones de APIs
    StorageUtil.saveGoogleClientId(googleClientId);
    StorageUtil.saveGoogleAccessToken(googleAccessToken);
    StorageUtil.saveGoogleCalendarId(googleCalendarId);
    StorageUtil.saveCalendarificApiKey(calendarificApiKey);
    
    // Save calendar configuration
    StorageUtil.saveCalendarSource(calendarSource);
    StorageUtil.saveICalUrl(icalUrl);

    // Save security settings
    StorageUtil.saveSecuritySettings({
      sessionTimeoutMinutes: sessionTimeout,
      lastActivityTimestamp: Date.now(),
      autoLogoutEnabled: autoLogoutEnabled
    });

    onClose();
  };

  const handleReset = () => {
    const defaultSchedule = StorageUtil.getDefaultWorkSchedule();
    setLocalSchedule(defaultSchedule);
    setGoogleClientId('');
    setGoogleAccessToken('');
    setGoogleCalendarId('');
    setCalendarificApiKey('');
    setGoogleConnectionStatus('idle');
    setIsGoogleSignedIn(false);
    setAvailableCalendars([]);
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
              Fuente de Calendario
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Seleccionar fuente de calendario</InputLabel>
              <Select
                value={calendarSource}
                onChange={(e) => setCalendarSource(e.target.value as CalendarSource)}
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
                  <strong>Configuración Google OAuth (Google Identity Services):</strong><br/>
                  1. Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a><br/>
                  2. Crea un proyecto nuevo o selecciona uno existente<br/>
                  3. Habilita la API de Google Calendar<br/>
                  4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"<br/>
                  5. Selecciona "Aplicación web" como tipo<br/>
                  6. En "Orígenes de JavaScript autorizados" agrega:<br/>
                  &nbsp;&nbsp;• http://localhost:3000 (desarrollo)<br/>
                  &nbsp;&nbsp;• Tu dominio de producción (si aplica)<br/>
                  7. Copia el Client ID generado aquí abajo<br/>
                  <strong>Nota:</strong> Ahora usa Google Identity Services (nueva API)
                </Alert>
              </>
            )}

            {calendarSource === 'ical' && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  iCal URL Público
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  💡 Alternativa simple que no requiere permisos corporativos. Solo necesitas la URL pública de tu calendario.
                </Alert>
              </>
            )}
            <Grid container spacing={2}>
              {calendarSource === 'google' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Google Client ID"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="123456789012-abc...xyz.apps.googleusercontent.com"
                    helperText="Client ID de tu aplicación Google OAuth (Google Cloud Console)"
                  />
                </Grid>
              )}
              
              {calendarSource === 'ical' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="iCal URL Público"
                      value={icalUrl}
                      onChange={(e) => setIcalUrl(e.target.value)}
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
                      {icalConnectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
                    </Button>
                    {icalConnectionStatus === 'success' && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        ✅ Conexión exitosa con iCal
                      </Alert>
                    )}
                    {icalConnectionStatus === 'error' && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        ❌ Error de conexión. Verifica que la URL sea accesible y válida.
                      </Alert>
                    )}
                  </Grid>
                </>
              )}
              
              {calendarSource === 'google' && !isGoogleSignedIn && (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleGoogleSignIn}
                    disabled={googleConnectionStatus === 'authenticating' || !googleClientId}
                    color="primary"
                  >
                    {googleConnectionStatus === 'authenticating' ? 'Autenticando...' : 'Conectar con Google Calendar'}
                  </Button>
                  {googleConnectionStatus === 'error' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      Error de autenticación. Verifica tu Client ID y permisos.
                    </Alert>
                  )}
                </Grid>
              )}
              
              {calendarSource === 'google' && isGoogleSignedIn && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      ✅ Conectado exitosamente a Google Calendar
                    </Alert>
                    
                    {availableCalendars.length > 0 && (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Calendario a usar</InputLabel>
                        <Select
                          value={googleCalendarId || 'primary'}
                          onChange={(e) => setGoogleCalendarId(e.target.value)}
                          label="Calendario a usar"
                        >
                          <MenuItem value="primary">Calendario Principal</MenuItem>
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
                        {googleConnectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
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
              type="password"
              value={calendarificApiKey}
              onChange={(e) => setCalendarificApiKey(e.target.value)}
              placeholder="1234567890abcdef..."
              helperText="Opcional: Para obtener feriados actualizados. Si no se configura, se usarán feriados predeterminados."
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
                      checked={autoLogoutEnabled}
                      onChange={(e) => setAutoLogoutEnabled(e.target.checked)}
                    />
                  }
                  label="Habilitar cierre de sesión automático"
                />
              </Grid>
              
              {autoLogoutEnabled && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Timeout de sesión (minutos)"
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 480)}
                    inputProps={{ min: 30, max: 1440, step: 30 }}
                    helperText="Tiempo antes de cerrar sesión automáticamente (30-1440 min)"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  🛡️ Los eventos de seguridad se registran localmente para auditoría corporativa
                </Alert>
              </Grid>
            </Grid>
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