import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { EventSelectionDialog } from './EventSelectionDialog';
import { HolidaySelectionDialog } from './HolidaySelectionDialog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import EventIcon from '@mui/icons-material/Event';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Holiday, Meeting, CalculationResult } from '../types';
import { DateCalculationsUtil } from '../utils/dateCalculations';
import { HolidayService } from '../services/holidayService';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { ICalService } from '../services/iCalService';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

export const TaskCalculator: React.FC = () => {
  // Zustand stores
  const {
    workSchedule,
    calendarSource,
    googleAuth,
    icalUrl,
    clearExpiredSession,
    updateLastActivity,
    clearGoogleAuth,
  } = useSettingsStore();

  // UI Store (centralized UI state)
  const {
    isCalculating,
    holidaySelectionOpen,
    eventSelectionOpen,
    setCalculating,
    setHolidaySelectionOpen,
    setEventSelectionOpen,
    showToast,
  } = useUIStore();

  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [excludeHolidays, setExcludeHolidays] = useState<boolean>(true);
  const [excludeMeetings, setExcludeMeetings] = useState<boolean>(true);
  const [excludedMeetingIds, setExcludedMeetingIds] = useState<string[]>([]);

  const [excludedHolidayDates, setExcludedHolidayDates] = useState<string[]>(
    []
  );

  // Local component state (form data)
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Local error state (component-specific errors)
  const [calculationError, setCalculationError] = useState<string>('');

  const holidayService = useMemo(() => new HolidayService(), []);

  const loadHolidays = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const holidayList = await holidayService.getEcuadorHolidays(currentYear);
      setHolidays(holidayList);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  }, [holidayService]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const loadEvents = async (startDate: Date, endDate: Date) => {
    // Check and clear expired sessions
    clearExpiredSession();
    updateLastActivity();

    if (calendarSource === 'none') {
      return [];
    }

    if (calendarSource === 'google') {
      return await loadGoogleCalendarEvents(startDate, endDate);
    }

    if (calendarSource === 'ical') {
      return await loadICalEvents(startDate, endDate);
    }

    return [];
  };

  const loadGoogleCalendarEvents = async (startDate: Date, endDate: Date) => {
    const {
      accessToken: googleAccessToken,
      calendarId: googleCalendarId,
      tokenExpiresAt,
    } = googleAuth;

    if (!googleAccessToken) {
      return [];
    }

    try {
      const googleService = new GoogleCalendarService({
        accessToken: googleAccessToken,
        calendarId: googleCalendarId || 'primary',
        expiresAt: tokenExpiresAt || undefined,
      });

      return await googleService.getEvents(startDate, endDate);
    } catch (error) {
      console.error('Error loading Google Calendar events:', error);

      if (
        error instanceof Error &&
        (error.message.includes('Token') || error.message.includes('expirado'))
      ) {
        // Access token might be expired - system notification
        clearGoogleAuth();

        showToast(
          'Sesión de Google Calendar expirada. Por favor, vuelve a autenticarte en Configuración.',
          'warning'
        );
      }
      return [];
    }
  };

  const loadICalEvents = async (startDate: Date, endDate: Date) => {
    if (!icalUrl) {
      return [];
    }

    try {
      const icalService = new ICalService({ url: icalUrl });
      return await icalService.getEvents(startDate, endDate);
    } catch (error) {
      console.error('Error loading iCal events:', error);

      setCalculationError(
        'Error al cargar eventos del calendario iCal. Verifica la URL en Configuración.'
      );

      return [];
    }
  };

  const handleCalculate = async () => {
    if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
      setCalculationError(
        'Por favor ingresa un número válido de horas estimadas.'
      );

      return;
    }

    setCalculating(true);
    setCalculationError(''); // Clear local errors
    setResult(null);

    try {
      const hours = parseFloat(estimatedHours);

      // Primera estimación para determinar el rango de fechas para cargar reuniones
      const preliminaryResult = DateCalculationsUtil.calculateEndDate({
        startDate,
        estimatedHours: hours,
        schedule: workSchedule,
        holidays: excludeHolidays ? holidays : [],
        meetings: [],
        excludeHolidays,
        excludeMeetings: false,
      });

      // Cargar eventos de calendario en el rango de fechas estimado
      let eventList: Meeting[] = [];

      if (excludeMeetings) {
        eventList = await loadEvents(startDate, preliminaryResult.endDate);
        setMeetings(eventList);
      }

      // Filtrar meetings basado en la selección granular
      let effectiveMeetings: Meeting[] = [];

      if (excludeMeetings) {
        if (excludedMeetingIds.length > 0) {
          // Exclusión granular: solo excluir los eventos específicamente seleccionados
          effectiveMeetings = eventList.filter((m) =>
            excludedMeetingIds.includes(m.id)
          );
        } else {
          // Exclusión completa: excluir todos los eventos
          effectiveMeetings = eventList;
        }
      }
      // Si excludeMeetings es false, effectiveMeetings queda vacío (no excluir nada)

      // Filtrar holidays basado en la selección granular
      let effectiveHolidays: Holiday[] = [];

      if (excludeHolidays) {
        if (excludedHolidayDates.length > 0) {
          // Exclusión granular: solo excluir los feriados específicamente seleccionados
          effectiveHolidays = holidays.filter((h) =>
            excludedHolidayDates.includes(h.date)
          );
        } else {
          // Exclusión completa: excluir todos los feriados
          effectiveHolidays = holidays;
        }
      }
      // Si excludeHolidays es false, effectiveHolidays queda vacío (no excluir nada)

      // Cálculo final con eventos de calendario y feriados
      const finalResult = DateCalculationsUtil.calculateEndDate({
        startDate,
        estimatedHours: hours,
        schedule: workSchedule,
        holidays: effectiveHolidays,
        meetings: effectiveMeetings,
        excludeHolidays: effectiveHolidays.length > 0,
        excludeMeetings: true, // Siempre true cuando hay meetings a excluir
      });

      setResult(finalResult);
    } catch (error) {
      setCalculationError(
        'Error al calcular las fechas. Por favor verifica la configuración.'
      );

      console.error('Calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleReset = () => {
    setEstimatedHours('');
    setStartDate(new Date());
    setResult(null);
    setCalculationError(''); // Clear local errors
    setMeetings([]);
  };

  const getDailyWorkingHours = () => {
    const minutes = DateCalculationsUtil.getDailyWorkingMinutes(workSchedule);
    return (minutes / 60).toFixed(1);
  };

  const getCalendarSourceLabel = () => {
    switch (calendarSource) {
      case 'google':
        return 'Google Calendar';
      case 'ical':
        return 'iCal';
      case 'none':
      default:
        return 'calendario';
    }
  };

  const handleEventSelectionChange = (
    newExcludeMeetings: boolean,
    newExcludedIds: string[]
  ) => {
    setExcludeMeetings(newExcludeMeetings);
    setExcludedMeetingIds(newExcludedIds);
  };

  const handleMainExcludeMeetingsChange = (checked: boolean) => {
    setExcludeMeetings(checked);

    if (!checked) {
      // Limpiar selección granular cuando se desactiva la exclusión
      setExcludedMeetingIds([]);
    }
  };

  const handleHolidaySelectionChange = (
    newExcludeHolidays: boolean,
    newExcludedDates: string[]
  ) => {
    setExcludeHolidays(newExcludeHolidays);
    setExcludedHolidayDates(newExcludedDates);
  };

  const handleMainExcludeHolidaysChange = (checked: boolean) => {
    setExcludeHolidays(checked);

    if (!checked) {
      // Limpiar selección granular cuando se desactiva la exclusión
      setExcludedHolidayDates([]);
    }
  };

  const handleOpenHolidaySelection = () => {
    setHolidaySelectionOpen(true);
  };

  const getHolidaySelectionLabel = () => {
    if (!excludeHolidays) return 'Incluir feriados ecuatorianos';

    const totalHolidays = holidays.length;
    if (totalHolidays === 0) return 'Excluir feriados ecuatorianos';

    if (excludedHolidayDates.length === 0) {
      return 'Excluir todos los feriados ecuatorianos';
    } else if (excludedHolidayDates.length === totalHolidays) {
      return 'Excluir todos los feriados ecuatorianos';
    } else {
      return `Excluir ${excludedHolidayDates.length} de ${totalHolidays} feriados ecuatorianos`;
    }
  };

  const handleOpenEventSelection = () => {
    setEventSelectionOpen(true);
  };

  const getEventSelectionLabel = () => {
    const calendarLabel = getCalendarSourceLabel();
    if (!excludeMeetings) return `Incluir tiempo de eventos (${calendarLabel})`;

    const totalEvents = meetings.length;

    if (totalEvents === 0)
      return `Excluir tiempo de eventos (${calendarLabel})`;

    if (excludedMeetingIds.length === 0) {
      return `Excluir todos los eventos (${calendarLabel})`;
    } else if (excludedMeetingIds.length === totalEvents) {
      return `Excluir todos los eventos (${calendarLabel})`;
    } else {
      return `Excluir ${excludedMeetingIds.length} de ${totalEvents} eventos (${calendarLabel})`;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Calculadora de Fechas - Azure DevOps
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Horas laborales configuradas: {getDailyWorkingHours()} horas por día
            ({workSchedule.startTime} - {workSchedule.endTime})
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Horas estimadas"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                inputProps={{
                  step: 0.25,
                  min: 0.25,
                  placeholder: '8.5',
                }}
                helperText="Ingresa las horas decimales estimadas (ej: 8.5)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Fecha y hora de inicio"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
                ampm={false}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={excludeHolidays}
                    onChange={(e) =>
                      handleMainExcludeHolidaysChange(e.target.checked)
                    }
                  />
                }
                label={getHolidaySelectionLabel()}
                sx={{ flexGrow: 1 }}
              />

              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenHolidaySelection}
                disabled={!excludeHolidays}
                sx={{ ml: 2, minWidth: 'auto', textTransform: 'none' }}
              >
                Configurar
              </Button>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={excludeMeetings}
                    onChange={(e) =>
                      handleMainExcludeMeetingsChange(e.target.checked)
                    }
                  />
                }
                label={getEventSelectionLabel()}
                sx={{ flexGrow: 1 }}
              />

              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenEventSelection}
                disabled={!excludeMeetings}
                sx={{ ml: 2, minWidth: 'auto', textTransform: 'none' }}
              >
                Configurar
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={isCalculating || !estimatedHours}
              startIcon={
                isCalculating ? (
                  <CircularProgress size={20} />
                ) : (
                  <AccessTimeIcon />
                )
              }
              sx={{ mr: 2 }}
            >
              {isCalculating ? 'Calculando...' : 'Calcular Fechas'}
            </Button>

            <Button variant="outlined" onClick={handleReset}>
              Limpiar
            </Button>
          </Box>

          {/* Local error display - component-specific errors */}
          {calculationError && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              onClose={() => setCalculationError('')}
            >
              {calculationError}
            </Alert>
          )}

          {result && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Resultado del Cálculo
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de inicio:
                    </Typography>

                    <Typography variant="h6">
                      {DateCalculationsUtil.formatDateForDisplay(
                        result.startDate
                      )}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha estimada de finalización:
                    </Typography>

                    <Typography variant="h6">
                      {DateCalculationsUtil.formatDateForDisplay(
                        result.endDate
                      )}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Días laborales utilizados:
                    </Typography>

                    <Typography variant="h6">
                      {result.workingDays} días
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Horas de trabajo efectivas:
                    </Typography>

                    <Typography variant="h6">
                      {result.actualWorkingHours.toFixed(2)} horas
                    </Typography>
                  </Grid>
                </Grid>

                {result.holidaysExcluded.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle1" gutterBottom>
                      <HolidayVillageIcon
                        sx={{ mr: 1, verticalAlign: 'middle' }}
                      />
                      Feriados Excluidos ({result.holidaysExcluded.length})
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {result.holidaysExcluded.map((holiday, index) => (
                        <Chip
                          key={index}
                          label={`${DateCalculationsUtil.formatDateOnly(new Date(holiday.date))} - ${holiday.name}`}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {result.meetingsExcluded.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle1" gutterBottom>
                      <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Eventos Excluidos ({result.meetingsExcluded.length})
                    </Typography>

                    <List dense>
                      {result.meetingsExcluded
                        .slice(0, 5)
                        .map((meeting, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <EventIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={meeting.title}
                              secondary={`${DateCalculationsUtil.formatDateForDisplay(meeting.start)} - ${DateCalculationsUtil.formatDateForDisplay(meeting.end)}`}
                            />
                          </ListItem>
                        ))}

                      {result.meetingsExcluded.length > 5 && (
                        <ListItem>
                          <ListItemText
                            secondary={`... y ${result.meetingsExcluded.length - 5} eventos más`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de selección granular de eventos */}
      <EventSelectionDialog
        open={eventSelectionOpen}
        onClose={() => setEventSelectionOpen(false)}
        meetings={meetings}
        excludeMeetings={excludeMeetings}
        excludedMeetingIds={excludedMeetingIds}
        onSelectionChange={handleEventSelectionChange}
        calendarSource={getCalendarSourceLabel()}
      />

      {/* Diálogo de selección granular de feriados */}
      <HolidaySelectionDialog
        open={holidaySelectionOpen}
        onClose={() => setHolidaySelectionOpen(false)}
        holidays={holidays}
        excludeHolidays={excludeHolidays}
        excludedHolidayDates={excludedHolidayDates}
        onSelectionChange={handleHolidaySelectionChange}
      />
    </LocalizationProvider>
  );
};
