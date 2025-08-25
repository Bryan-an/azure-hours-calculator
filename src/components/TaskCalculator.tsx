import React from 'react';
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
  IconButton,
  Tooltip,
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DateCalculationsUtil } from '../utils/dateCalculations';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useHolidays } from '../hooks/useHolidays';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useTaskCalculation } from '../hooks/useTaskCalculation';
import { useTaskForm } from '../hooks/useTaskForm';
import { useClipboard } from '../hooks/useClipboard';

export const TaskCalculator: React.FC = () => {
  // Zustand stores
  const { workSchedule } = useSettingsStore();

  // UI Store (centralized UI state)
  const {
    holidaySelectionOpen,
    eventSelectionOpen,
    setHolidaySelectionOpen,
    setEventSelectionOpen,
  } = useUIStore();

  // Custom hooks for business logic
  const { holidays } = useHolidays();
  const { meetings, loadEvents, getCalendarSourceLabel } = useCalendarEvents();

  const {
    result,
    calculationError,
    isCalculating,
    calculateTask,
    resetCalculation,
    getDailyWorkingHours,
    setCalculationError,
  } = useTaskCalculation();

  const {
    estimatedHours,
    startDate,
    excludeHolidays,
    excludeMeetings,
    excludedMeetingIds,
    excludedHolidayDates,
    setEstimatedHours,
    setStartDate,
    handleReset: resetForm,
    handleEventSelectionChange,
    handleMainExcludeMeetingsChange,
    handleHolidaySelectionChange,
    handleMainExcludeHolidaysChange,
    getHolidaySelectionLabel,
    getEventSelectionLabel,
    isFormValid,
  } = useTaskForm();

  // Clipboard functionality
  const { copyToClipboard } = useClipboard();

  const handleCalculate = async () => {
    try {
      await calculateTask({
        estimatedHours: parseFloat(estimatedHours),
        startDate,
        excludeHolidays,
        excludeMeetings,
        holidays,
        excludedHolidayDates,
        excludedMeetingIds,
        loadEvents,
      });
    } catch (error) {
      if (error instanceof Error) {
        setCalculationError(error.message);
      }
    }
  };

  const handleReset = () => {
    resetForm();
    resetCalculation();
  };

  const handleOpenHolidaySelection = () => {
    setHolidaySelectionOpen(true);
  };

  const handleOpenEventSelection = () => {
    setEventSelectionOpen(true);
  };

  const handleCopyStartDate = () => {
    if (result?.startDate) {
      const formattedDate = DateCalculationsUtil.formatDateForDisplay(
        result.startDate
      );

      copyToClipboard(formattedDate, 'Fecha de inicio copiada al portapapeles');
    }
  };

  const handleCopyEndDate = () => {
    if (result?.endDate) {
      const formattedDate = DateCalculationsUtil.formatDateForDisplay(
        result.endDate
      );

      copyToClipboard(
        formattedDate,
        'Fecha de finalización copiada al portapapeles'
      );
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
                label={getHolidaySelectionLabel(holidays)}
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
                label={getEventSelectionLabel(
                  meetings,
                  getCalendarSourceLabel()
                )}
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
              disabled={isCalculating || !isFormValid()}
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
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fecha de inicio:
                        </Typography>

                        <Typography variant="h6">
                          {DateCalculationsUtil.formatDateForDisplay(
                            result.startDate
                          )}
                        </Typography>
                      </Box>

                      <Tooltip title="Copiar fecha de inicio">
                        <IconButton
                          size="small"
                          onClick={handleCopyStartDate}
                          sx={{ mt: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fecha estimada de finalización:
                        </Typography>

                        <Typography variant="h6">
                          {DateCalculationsUtil.formatDateForDisplay(
                            result.endDate
                          )}
                        </Typography>
                      </Box>

                      <Tooltip title="Copiar fecha de finalización">
                        <IconButton
                          size="small"
                          onClick={handleCopyEndDate}
                          sx={{ mt: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
