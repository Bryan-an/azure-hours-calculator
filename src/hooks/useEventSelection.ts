import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Meeting } from '../types';

interface UseEventSelectionProps {
  meetings: Meeting[];
  excludeMeetings: boolean;
  excludedMeetingIds: string[];
  onSelectionChange: (
    excludeMeetings: boolean,
    excludedMeetingIds: string[]
  ) => void;
  onClose: () => void;
}

export const useEventSelection = ({
  meetings,
  excludeMeetings,
  excludedMeetingIds,
  onSelectionChange,
  onClose,
}: UseEventSelectionProps) => {
  const [localExcludeMeetings, setLocalExcludeMeetings] =
    useState(excludeMeetings);

  const [localExcludedIds, setLocalExcludedIds] =
    useState<string[]>(excludedMeetingIds);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setLocalExcludeMeetings(excludeMeetings);

    if (!excludeMeetings) {
      setLocalExcludedIds([]);
    } else if (excludedMeetingIds.length === 0 && meetings.length > 0) {
      setLocalExcludedIds(meetings.map((m) => m.id));
    } else if (
      excludedMeetingIds.length === meetings.length &&
      meetings.length > 0
    ) {
      setLocalExcludedIds(meetings.map((m) => m.id));
    } else {
      setLocalExcludedIds(excludedMeetingIds);
    }
  }, [excludeMeetings, excludedMeetingIds, meetings]);

  const filteredMeetings = useMemo(
    () =>
      meetings.filter((meeting) =>
        meeting.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ),
    [meetings, debouncedSearchTerm]
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

  const handleMasterToggle = useCallback((checked: boolean) => {
    setLocalExcludeMeetings(checked);

    if (!checked) {
      // Si desactivamos la exclusión general, limpiamos las exclusiones específicas
      setLocalExcludedIds([]);
    }
  }, []);

  const handleEventToggle = useCallback(
    (meetingId: string) => {
      // Si localExcludedIds está vacío pero localExcludeMeetings es true,
      // significa que estamos en modo "excluir todos"
      if (localExcludedIds.length === 0 && localExcludeMeetings) {
        // Cambiar a modo específico: excluir todos MENOS el que se está desactivando
        const allOtherIds = meetings
          .filter((m) => m.id !== meetingId)
          .map((m) => m.id);

        setLocalExcludedIds(allOtherIds);
      } else if (localExcludedIds.includes(meetingId)) {
        // Modo normal: remover de la lista de excluidos
        const newExcludedIds = localExcludedIds.filter(
          (id) => id !== meetingId
        );

        setLocalExcludedIds(newExcludedIds);

        // Si no queda ningún evento excluido, desactivar el master toggle
        if (newExcludedIds.length === 0) {
          setLocalExcludeMeetings(false);
        }
      } else {
        // Modo normal: agregar a la lista de excluidos
        setLocalExcludedIds((prev) => [...prev, meetingId]);

        // Asegurar que el master toggle esté activado
        if (!localExcludeMeetings) {
          setLocalExcludeMeetings(true);
        }
      }
    },
    [localExcludedIds, localExcludeMeetings, meetings]
  );

  const handleSelectAll = useCallback(() => {
    const allIds = meetings.map((m) => m.id);
    setLocalExcludedIds(allIds);
    setLocalExcludeMeetings(true);
  }, [meetings]);

  const handleSelectNone = useCallback(() => {
    setLocalExcludedIds([]);
    setLocalExcludeMeetings(false);
  }, []);

  const handleSave = useCallback(() => {
    // Si todos los eventos están excluidos, pasar array vacío para indicar "excluir todos"
    const idsToSave =
      localExcludeMeetings && localExcludedIds.length === meetings.length
        ? []
        : localExcludedIds;

    onSelectionChange(localExcludeMeetings, idsToSave);
    onClose();
  }, [
    localExcludeMeetings,
    localExcludedIds,
    meetings.length,
    onSelectionChange,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    // Revertir cambios locales
    setLocalExcludeMeetings(excludeMeetings);
    setLocalExcludedIds(excludedMeetingIds);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    onClose();
  }, [excludeMeetings, excludedMeetingIds, onClose]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  const isEventExcluded = useCallback(
    (meeting: Meeting): boolean => {
      if (!localExcludeMeetings) {
        return false;
      }

      if (localExcludedIds.length === 0) {
        return true;
      }

      return localExcludedIds.includes(meeting.id);
    },
    [localExcludeMeetings, localExcludedIds]
  );

  const totalCount = meetings.length;

  const excludedCount = localExcludeMeetings
    ? localExcludedIds.length > 0
      ? localExcludedIds.length
      : totalCount
    : 0;

  return {
    localExcludeMeetings,
    localExcludedIds,
    searchTerm,
    debouncedSearchTerm,
    filteredMeetings,
    totalCount,
    excludedCount,
    setSearchTerm,
    formatEventDuration,
    formatEventTime,
    formatEventDate,
    isEventExcluded,
    handleMasterToggle,
    handleEventToggle,
    handleSelectAll,
    handleSelectNone,
    handleSave,
    handleCancel,
    handleClearSearch,
  };
};
