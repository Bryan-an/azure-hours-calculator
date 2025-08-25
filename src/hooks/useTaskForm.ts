import { useState, useCallback } from 'react';
import { Holiday, Meeting } from '../types';

export const useTaskForm = () => {
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [excludeHolidays, setExcludeHolidays] = useState<boolean>(true);
  const [excludeMeetings, setExcludeMeetings] = useState<boolean>(true);
  const [excludedMeetingIds, setExcludedMeetingIds] = useState<string[]>([]);

  const [excludedHolidayDates, setExcludedHolidayDates] = useState<string[]>(
    []
  );

  const handleReset = useCallback(() => {
    setEstimatedHours('');
    setStartDate(new Date());
    setExcludedMeetingIds([]);
    setExcludedHolidayDates([]);
  }, []);

  const handleEventSelectionChange = useCallback(
    (newExcludeMeetings: boolean, newExcludedIds: string[]) => {
      setExcludeMeetings(newExcludeMeetings);
      setExcludedMeetingIds(newExcludedIds);
    },
    []
  );

  const handleMainExcludeMeetingsChange = useCallback((checked: boolean) => {
    setExcludeMeetings(checked);

    if (!checked) {
      setExcludedMeetingIds([]);
    }
  }, []);

  const handleHolidaySelectionChange = useCallback(
    (newExcludeHolidays: boolean, newExcludedDates: string[]) => {
      setExcludeHolidays(newExcludeHolidays);
      setExcludedHolidayDates(newExcludedDates);
    },
    []
  );

  const handleMainExcludeHolidaysChange = useCallback((checked: boolean) => {
    setExcludeHolidays(checked);

    if (!checked) {
      setExcludedHolidayDates([]);
    }
  }, []);

  const getHolidaySelectionLabel = useCallback(
    (holidays: Holiday[]) => {
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
    },
    [excludeHolidays, excludedHolidayDates]
  );

  const getEventSelectionLabel = useCallback(
    (meetings: Meeting[], calendarLabel: string) => {
      if (!excludeMeetings)
        return `Incluir tiempo de eventos (${calendarLabel})`;

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
    },
    [excludeMeetings, excludedMeetingIds]
  );

  const isFormValid = useCallback(() => {
    return estimatedHours && parseFloat(estimatedHours) > 0;
  }, [estimatedHours]);

  return {
    // State
    estimatedHours,
    startDate,
    excludeHolidays,
    excludeMeetings,
    excludedMeetingIds,
    excludedHolidayDates,

    // Setters
    setEstimatedHours,
    setStartDate,

    // Handlers
    handleReset,
    handleEventSelectionChange,
    handleMainExcludeMeetingsChange,
    handleHolidaySelectionChange,
    handleMainExcludeHolidaysChange,

    // Helpers
    getHolidaySelectionLabel,
    getEventSelectionLabel,
    isFormValid,
  };
};
