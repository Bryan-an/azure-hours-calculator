import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Event as EventIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Meeting } from '../types';

interface EventSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  meetings: Meeting[];
  excludeMeetings: boolean;
  excludedMeetingIds: string[];
  onSelectionChange: (excludeMeetings: boolean, excludedMeetingIds: string[]) => void;
  calendarSource: string;
}

export const EventSelectionDialog: React.FC<EventSelectionDialogProps> = ({
  open,
  onClose,
  meetings,
  excludeMeetings,
  excludedMeetingIds,
  onSelectionChange,
  calendarSource
}) => {
  const [localExcludeMeetings, setLocalExcludeMeetings] = useState(excludeMeetings);
  const [localExcludedIds, setLocalExcludedIds] = useState<string[]>(excludedMeetingIds);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLocalExcludeMeetings(excludeMeetings);
    // Si excludeMeetings es true pero no hay IDs específicos, significa "excluir todos"
    if (excludeMeetings && excludedMeetingIds.length === 0 && meetings.length > 0) {
      setLocalExcludedIds(meetings.map(m => m.id));
    } else {
      setLocalExcludedIds(excludedMeetingIds);
    }
  }, [excludeMeetings, excludedMeetingIds, meetings]);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatEventDuration = (meeting: Meeting): string => {
    const duration = differenceInMinutes(meeting.end, meeting.start);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatEventTime = (meeting: Meeting): string => {
    return `${format(meeting.start, 'HH:mm', { locale: es })} - ${format(meeting.end, 'HH:mm', { locale: es })}`;
  };

  const formatEventDate = (date: Date): string => {
    return format(date, 'dd MMM yyyy', { locale: es });
  };

  const handleMasterToggle = (checked: boolean) => {
    setLocalExcludeMeetings(checked);
    if (!checked) {
      // Si desactivamos la exclusión general, limpiamos las exclusiones específicas
      setLocalExcludedIds([]);
    }
  };

  const handleEventToggle = (meetingId: string) => {
    if (localExcludedIds.includes(meetingId)) {
      setLocalExcludedIds(prev => prev.filter(id => id !== meetingId));
    } else {
      setLocalExcludedIds(prev => [...prev, meetingId]);
    }
  };

  const handleSelectAll = () => {
    const allVisibleIds = filteredMeetings.map(m => m.id);
    setLocalExcludedIds(allVisibleIds);
    setLocalExcludeMeetings(true);
  };

  const handleSelectNone = () => {
    setLocalExcludedIds([]);
  };

  const handleSave = () => {
    onSelectionChange(localExcludeMeetings, localExcludedIds);
    onClose();
  };

  const handleCancel = () => {
    // Revertir cambios locales
    setLocalExcludeMeetings(excludeMeetings);
    setLocalExcludedIds(excludedMeetingIds);
    setSearchTerm('');
    onClose();
  };

  // Lógica corregida para el conteo
  const totalCount = meetings.length;
  const excludedCount = localExcludeMeetings 
    ? (localExcludedIds.length > 0 
       ? localExcludedIds.length 
       : totalCount) // Si no hay IDs específicos, excluir todos
    : 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
      aria-labelledby="event-selection-dialog-title"
      aria-describedby="event-selection-dialog-description"
    >
      <DialogTitle id="event-selection-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon />
          <Typography variant="h6" component="span">
            Selección de Eventos - {calendarSource}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography 
          id="event-selection-dialog-description" 
          variant="body2" 
          color="text.secondary" 
          gutterBottom
          sx={{ mb: 3 }}
        >
          Controla qué eventos del calendario deben excluirse del cálculo de horas laborales.
          Los eventos excluidos no contarán como tiempo disponible para el trabajo.
        </Typography>

        {/* Control principal */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Switch
              checked={localExcludeMeetings}
              onChange={(e) => handleMasterToggle(e.target.checked)}
              color="primary"
              inputProps={{
                'aria-describedby': 'master-toggle-description'
              }}
            />
            <Box flexGrow={1}>
              <Typography variant="subtitle1" component="div">
                Excluir eventos del cálculo
              </Typography>
              <Typography 
                id="master-toggle-description"
                variant="body2" 
                color="text.secondary"
              >
                {localExcludeMeetings 
                  ? `Excluyendo ${excludedCount} de ${totalCount} eventos`
                  : 'Todos los eventos se incluyen en el cálculo'
                }
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Controles granulares */}
        {localExcludeMeetings && totalCount > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            
            {/* Barra de búsqueda y controles masivos */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar eventos..."
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
                    'aria-label': 'Buscar eventos por título'
                  }}
                />
              </Box>

              <Box display="flex" gap={1} mb={2}>
                <Tooltip title="Excluir todos los eventos visibles">
                  <Button
                    size="small"
                    startIcon={<CheckBoxIcon />}
                    onClick={handleSelectAll}
                    disabled={filteredMeetings.length === 0}
                  >
                    Excluir todos
                  </Button>
                </Tooltip>
                <Tooltip title="Incluir todos los eventos">
                  <Button
                    size="small"
                    startIcon={<CheckBoxOutlineBlankIcon />}
                    onClick={handleSelectNone}
                    disabled={localExcludedIds.length === 0}
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

            {/* Lista de eventos */}
            {filteredMeetings.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No se encontraron eventos que coincidan con la búsqueda' : 'No hay eventos disponibles'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredMeetings.map((meeting) => {
                  const isExcluded = localExcludedIds.includes(meeting.id);
                  
                  return (
                    <ListItem key={meeting.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleEventToggle(meeting.id)}
                        aria-label={`${isExcluded ? 'Incluir' : 'Excluir'} evento: ${meeting.title}`}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={isExcluded}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{
                              'aria-labelledby': `event-${meeting.id}-label`
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          id={`event-${meeting.id}-label`}
                          primary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Typography 
                                variant="subtitle2"
                                component="span"
                                sx={{ 
                                  textDecoration: isExcluded ? 'line-through' : 'none',
                                  opacity: isExcluded ? 0.7 : 1
                                }}
                              >
                                {meeting.title}
                              </Typography>
                              {meeting.isOptional && (
                                <Chip 
                                  label="Opcional" 
                                  size="small" 
                                  variant="outlined" 
                                  color="secondary"
                                />
                              )}
                            </span>
                          }
                          secondary={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ScheduleIcon fontSize="small" />
                              <Typography variant="caption" component="span">
                                {formatEventDate(meeting.start)} • {formatEventTime(meeting)} • {formatEventDuration(meeting)}
                              </Typography>
                            </span>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </>
        )}

        {totalCount === 0 && (
          <Box textAlign="center" py={4}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" gutterBottom>
              No hay eventos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los eventos se cargan automáticamente cuando realizas un cálculo.
              Para configurar la exclusión específica, primero calcula las fechas.
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