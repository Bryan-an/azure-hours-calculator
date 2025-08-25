import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CalendarMonth as CalendarMonthIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Holiday } from '../types';
import { HolidayDay } from './HolidayDay';
import { useHolidaySelection } from '../hooks/useHolidaySelection';

interface HolidaySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  holidays: Holiday[];
  excludeHolidays: boolean;
  excludedHolidayDates: string[];
  onSelectionChange: (
    excludeHolidays: boolean,
    excludedHolidayDates: string[]
  ) => void;
}

export const HolidaySelectionDialog: React.FC<HolidaySelectionDialogProps> = ({
  open,
  onClose,
  holidays,
  excludeHolidays,
  excludedHolidayDates,
  onSelectionChange,
}) => {
  const {
    localExcludeHolidays,
    searchTerm,
    debouncedSearchTerm,
    selectedDate,
    filteredHolidays,
    excludedCount,
    totalCount,
    selectedDateHolidays,
    setSearchTerm,
    setSelectedDate,
    getHolidaysForDate,
    isHolidayExcluded,
    handleMasterToggle,
    handleHolidayToggle,
    handleSelectAll,
    handleSelectNone,
    handleSave,
    handleCancel,
    handleClearSearch,
  } = useHolidaySelection({
    holidays,
    excludeHolidays,
    excludedHolidayDates,
    onSelectionChange,
    onClose,
  });

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      disableRestoreFocus
      aria-labelledby="holiday-selection-dialog-title"
      aria-describedby="holiday-selection-dialog-description"
    >
      <DialogTitle id="holiday-selection-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarMonthIcon />

          <Typography variant="h6" component="span">
            Selección de Feriados Ecuatorianos
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          id="holiday-selection-dialog-description"
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 3 }}
        >
          Controla qué feriados deben excluirse del cálculo de horas laborales.
          Los feriados excluidos no contarán como días de trabajo disponibles.
        </Typography>

        {/* Control principal */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localExcludeHolidays}
                onChange={(e) => handleMasterToggle(e.target.checked)}
                color="primary"
                inputProps={{
                  'aria-describedby': 'master-toggle-description',
                }}
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" component="div">
                  Excluir feriados del cálculo
                </Typography>

                <Typography
                  id="master-toggle-description"
                  variant="body2"
                  color="text.secondary"
                >
                  {localExcludeHolidays
                    ? `Excluyendo ${excludedCount} de ${totalCount} feriados`
                    : 'Todos los feriados se incluyen en el cálculo'}
                </Typography>
              </Box>
            }
          />
        </Box>

        {/* Controles granulares */}
        {localExcludeHolidays && totalCount > 0 && (
          <>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Columna izquierda: Calendario */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Calendario de Feriados
                </Typography>

                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <DateCalendar
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      slots={{
                        day: HolidayDay as any,
                      }}
                      slotProps={{
                        day: (ownerState: any) =>
                          ({
                            holidaysOnDay: getHolidaysForDate(ownerState.day),
                            isExcluded: getHolidaysForDate(ownerState.day).some(
                              (h) => isHolidayExcluded(h)
                            ),
                          }) as any,
                      }}
                      sx={{
                        width: '100%',
                        '& .MuiDayCalendar-weekDayLabel': {
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Información del día seleccionado */}
                {selectedDateHolidays.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Feriados el{' '}
                      {format(selectedDate!, "dd 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                      :
                    </Typography>

                    {selectedDateHolidays.map((holiday, index) => (
                      <Typography key={index} variant="body2">
                        • {holiday.name} ({holiday.type})
                      </Typography>
                    ))}
                  </Alert>
                )}

                {/* Leyenda */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Leyenda:
                  </Typography>

                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />

                      <Typography variant="caption">
                        Feriado incluido
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'error.main',
                        }}
                      />

                      <Typography variant="caption">
                        Feriado excluido
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Columna derecha: Lista de feriados */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Lista de Feriados
                </Typography>

                {/* Barra de búsqueda y controles masivos */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar feriados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={handleClearSearch}
                            aria-label="Limpiar búsqueda"
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      'aria-label': 'Buscar feriados por nombre o tipo',
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" gap={1} mb={2}>
                    <Tooltip title="Excluir todos los feriados visibles">
                      <Button
                        size="small"
                        startIcon={<CheckBoxIcon />}
                        onClick={handleSelectAll}
                        disabled={
                          holidays.length === 0 ||
                          (localExcludeHolidays &&
                            excludedCount === holidays.length)
                        }
                      >
                        Excluir todos
                      </Button>
                    </Tooltip>

                    <Tooltip title="Incluir todos los feriados">
                      <Button
                        size="small"
                        startIcon={<CheckBoxOutlineBlankIcon />}
                        onClick={handleSelectNone}
                        disabled={!localExcludeHolidays}
                      >
                        Incluir todos
                      </Button>
                    </Tooltip>

                    <Chip
                      label={`${excludedCount} excluidos`}
                      size="small"
                      color={excludedCount > 0 ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>

                {/* Lista de feriados */}
                {filteredHolidays.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      {debouncedSearchTerm
                        ? 'No se encontraron feriados que coincidan con la búsqueda'
                        : 'No hay feriados disponibles'}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {filteredHolidays
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((holiday) => {
                        const isExcluded = isHolidayExcluded(holiday);
                        const holidayDate = parseISO(holiday.date);

                        return (
                          <ListItem key={holiday.date} disablePadding>
                            <ListItemIcon>
                              <IconButton
                                onClick={() =>
                                  handleHolidayToggle(holiday.date)
                                }
                                aria-label={`${isExcluded ? 'Incluir' : 'Excluir'} feriado: ${holiday.name}`}
                              >
                                {isExcluded ? (
                                  <CheckBoxIcon color="primary" />
                                ) : (
                                  <CheckBoxOutlineBlankIcon />
                                )}
                              </IconButton>
                            </ListItemIcon>

                            <ListItemText
                              primary={
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    component="span"
                                    sx={{
                                      textDecoration: isExcluded
                                        ? 'line-through'
                                        : 'none',
                                      opacity: isExcluded ? 0.7 : 1,
                                    }}
                                  >
                                    {holiday.name}
                                  </Typography>

                                  {holiday.global && (
                                    <Chip
                                      label="Global"
                                      size="small"
                                      color="primary"
                                      icon={<PublicIcon />}
                                    />
                                  )}
                                </span>
                              }
                              secondary={
                                <span>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    component="span"
                                  >
                                    {format(
                                      holidayDate,
                                      "EEEE, dd 'de' MMMM 'de' yyyy",
                                      { locale: es }
                                    )}
                                  </Typography>

                                  <br />

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    component="span"
                                  >
                                    Tipo: {holiday.type}
                                  </Typography>
                                </span>
                              }
                            />
                          </ListItem>
                        );
                      })}
                  </List>
                )}
              </Grid>
            </Grid>
          </>
        )}

        {totalCount === 0 && (
          <Box textAlign="center" py={4}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />

            <Typography color="text.secondary" gutterBottom>
              No hay feriados disponibles
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Los feriados se cargan desde la API de Calendarific. Verifica la
              configuración de la API si no aparecen feriados.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel}>Cancelar</Button>

        <Button onClick={handleSave} variant="contained" autoFocus>
          Aplicar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};
