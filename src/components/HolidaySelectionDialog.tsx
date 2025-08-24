import React, { useState, useEffect } from 'react';
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
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CalendarMonth as CalendarMonthIcon,
  Public as PublicIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Holiday } from '../types';

interface HolidaySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  holidays: Holiday[];
  excludeHolidays: boolean;
  excludedHolidayDates: string[];
  onSelectionChange: (excludeHolidays: boolean, excludedHolidayDates: string[]) => void;
}

// Componente personalizado para mostrar días con feriados
const HolidayDay = React.forwardRef<HTMLButtonElement, PickersDayProps<Date> & { 
  holidaysOnDay?: Holiday[];
  isExcluded?: boolean;
}>(({ holidaysOnDay = [], isExcluded = false, ...other }, ref) => {
  const hasHolidays = holidaysOnDay.length > 0;
  
  if (!hasHolidays) {
    return <PickersDay {...other} ref={ref} />;
  }

  return (
    <Badge
      key={other.day.toString()}
      overlap="circular"
      badgeContent={
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isExcluded ? 'error.main' : 'primary.main',
            border: '1px solid',
            borderColor: 'background.paper'
          }}
        />
      }
    >
      <PickersDay
        {...other}
        ref={ref}
        sx={{
          ...other.sx,
          ...(hasHolidays && {
            backgroundColor: isExcluded ? 'error.light' : 'primary.light',
            color: isExcluded ? 'error.contrastText' : 'primary.contrastText',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: isExcluded ? 'error.main' : 'primary.main',
            },
            '&.Mui-selected': {
              backgroundColor: isExcluded ? 'error.dark' : 'primary.dark',
            }
          })
        }}
      />
    </Badge>
  );
});

HolidayDay.displayName = 'HolidayDay';

export const HolidaySelectionDialog: React.FC<HolidaySelectionDialogProps> = ({
  open,
  onClose,
  holidays,
  excludeHolidays,
  excludedHolidayDates,
  onSelectionChange
}) => {
  const [localExcludeHolidays, setLocalExcludeHolidays] = useState(excludeHolidays);
  const [localExcludedDates, setLocalExcludedDates] = useState<string[]>(excludedHolidayDates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());

  useEffect(() => {
    setLocalExcludeHolidays(excludeHolidays);
    // Si excludeHolidays es true pero no hay fechas específicas, significa "excluir todos"
    if (excludeHolidays && excludedHolidayDates.length === 0 && holidays.length > 0) {
      setLocalExcludedDates(holidays.map(h => h.date));
    } else {
      setLocalExcludedDates(excludedHolidayDates);
    }
  }, [excludeHolidays, excludedHolidayDates, holidays]);

  const filteredHolidays = holidays.filter(holiday =>
    holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holiday.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHolidaysForDate = (date: Date): Holiday[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidays.filter(holiday => holiday.date === dateString);
  };

  const isHolidayExcluded = (holiday: Holiday): boolean => {
    return localExcludedDates.includes(holiday.date);
  };

  const handleMasterToggle = (checked: boolean) => {
    setLocalExcludeHolidays(checked);
    if (!checked) {
      // Si desactivamos la exclusión general, limpiamos las exclusiones específicas
      setLocalExcludedDates([]);
    }
  };

  const handleHolidayToggle = (holidayDate: string) => {
    if (localExcludedDates.includes(holidayDate)) {
      setLocalExcludedDates(prev => prev.filter(date => date !== holidayDate));
    } else {
      setLocalExcludedDates(prev => [...prev, holidayDate]);
    }
  };

  const handleSelectAll = () => {
    const allVisibleDates = filteredHolidays.map(h => h.date);
    setLocalExcludedDates(allVisibleDates);
    setLocalExcludeHolidays(true);
  };

  const handleSelectNone = () => {
    setLocalExcludedDates([]);
  };

  const handleSave = () => {
    onSelectionChange(localExcludeHolidays, localExcludedDates);
    onClose();
  };

  const handleCancel = () => {
    // Revertir cambios locales
    setLocalExcludeHolidays(excludeHolidays);
    setLocalExcludedDates(excludedHolidayDates);
    setSearchTerm('');
    onClose();
  };

  const excludedCount = localExcludeHolidays 
    ? (localExcludedDates.length > 0 
       ? localExcludedDates.length 
       : holidays.length) // Si no hay fechas específicas, excluir todos
    : 0;
  const totalCount = holidays.length;

  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
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
                  'aria-describedby': 'master-toggle-description'
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
                    : 'Todos los feriados se incluyen en el cálculo'
                  }
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
                      onMonthChange={(newDate) => setViewDate(newDate)}
                      slots={{
                        day: HolidayDay as any,
                      }}
                      slotProps={{
                        day: (ownerState: any) => ({
                          holidaysOnDay: getHolidaysForDate(ownerState.day),
                          isExcluded: getHolidaysForDate(ownerState.day).some(h => 
                            localExcludedDates.includes(h.date)
                          ),
                        }) as any,
                      }}
                      sx={{
                        width: '100%',
                        '& .MuiDayCalendar-weekDayLabel': {
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Información del día seleccionado */}
                {selectedDateHolidays.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Feriados el {format(selectedDate!, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}:
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
                          backgroundColor: 'primary.main'
                        }}
                      />
                      <Typography variant="caption">Feriado incluido</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: 'error.main'
                        }}
                      />
                      <Typography variant="caption">Feriado excluido</Typography>
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
                            onClick={() => setSearchTerm('')}
                            aria-label="Limpiar búsqueda"
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    inputProps={{
                      'aria-label': 'Buscar feriados por nombre o tipo'
                    }}
                    sx={{ mb: 2 }}
                  />

                  <Box display="flex" gap={1} mb={2}>
                    <Tooltip title="Excluir todos los feriados visibles">
                      <Button
                        size="small"
                        startIcon={<CheckBoxIcon />}
                        onClick={handleSelectAll}
                        disabled={filteredHolidays.length === 0}
                      >
                        Excluir todos
                      </Button>
                    </Tooltip>
                    <Tooltip title="Incluir todos los feriados">
                      <Button
                        size="small"
                        startIcon={<CheckBoxOutlineBlankIcon />}
                        onClick={handleSelectNone}
                        disabled={localExcludedDates.length === 0}
                      >
                        Incluir todos
                      </Button>
                    </Tooltip>
                    <Chip 
                      label={`${excludedCount} excluidos`} 
                      size="small" 
                      color={excludedCount > 0 ? "primary" : "default"}
                    />
                  </Box>
                </Box>

                {/* Lista de feriados */}
                {filteredHolidays.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No se encontraron feriados que coincidan con la búsqueda' : 'No hay feriados disponibles'}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {filteredHolidays
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((holiday) => {
                        const isExcluded = isHolidayExcluded(holiday);
                        const holidayDate = parseISO(holiday.date);
                        
                        return (
                          <ListItem key={holiday.date} disablePadding>
                            <ListItemIcon>
                              <IconButton
                                onClick={() => handleHolidayToggle(holiday.date)}
                                aria-label={`${isExcluded ? 'Incluir' : 'Excluir'} feriado: ${holiday.name}`}
                              >
                                {isExcluded ? <CheckBoxIcon color="primary" /> : <CheckBoxOutlineBlankIcon />}
                              </IconButton>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      textDecoration: isExcluded ? 'line-through' : 'none',
                                      opacity: isExcluded ? 0.7 : 1
                                    }}
                                  >
                                    {holiday.name}
                                  </Typography>
                                  {holiday.global && (
                                    <Chip 
                                      label="Nacional" 
                                      size="small" 
                                      color="primary"
                                      icon={<PublicIcon />}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {format(holidayDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" color="text.secondary">
                                    Tipo: {holiday.type}
                                  </Typography>
                                </Box>
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
              Los feriados se cargan desde la API de Calendarific.
              Verifica la configuración de la API si no aparecen feriados.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          autoFocus
        >
          Aplicar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};