import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Holiday } from '../types';

interface UseHolidaySelectionProps {
  holidays: Holiday[];
  excludeHolidays: boolean;
  excludedHolidayDates: string[];
  onSelectionChange: (
    excludeHolidays: boolean,
    excludedHolidayDates: string[]
  ) => void;
  onClose: () => void;
}

export const useHolidaySelection = ({
  holidays,
  excludeHolidays,
  excludedHolidayDates,
  onSelectionChange,
  onClose,
}: UseHolidaySelectionProps) => {
  const [localExcludeHolidays, setLocalExcludeHolidays] =
    useState(excludeHolidays);

  const [localExcludedDates, setLocalExcludedDates] =
    useState<string[]>(excludedHolidayDates);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Debounce search term with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setLocalExcludeHolidays(excludeHolidays);

    if (!excludeHolidays) {
      setLocalExcludedDates([]);
    } else if (excludedHolidayDates.length === 0 && holidays.length > 0) {
      setLocalExcludedDates(holidays.map((h) => h.date));
    } else if (
      excludedHolidayDates.length === holidays.length &&
      holidays.length > 0
    ) {
      setLocalExcludedDates(holidays.map((h) => h.date));
    } else {
      setLocalExcludedDates(excludedHolidayDates);
    }
  }, [excludeHolidays, excludedHolidayDates, holidays]);

  const filteredHolidays = useMemo(
    () =>
      holidays.filter(
        (holiday) =>
          holiday.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          holiday.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ),
    [holidays, debouncedSearchTerm]
  );

  const getHolidaysForDate = useCallback(
    (date: Date): Holiday[] => {
      const dateString = format(date, 'yyyy-MM-dd');
      return holidays.filter((holiday) => holiday.date === dateString);
    },
    [holidays]
  );

  const isHolidayExcluded = useCallback(
    (holiday: Holiday): boolean => {
      if (!localExcludeHolidays) {
        return false;
      }

      if (localExcludedDates.length === 0) {
        return true;
      }

      return localExcludedDates.includes(holiday.date);
    },
    [localExcludeHolidays, localExcludedDates]
  );

  const handleMasterToggle = useCallback((checked: boolean) => {
    setLocalExcludeHolidays(checked);

    if (!checked) {
      setLocalExcludedDates([]);
    }
  }, []);

  const handleHolidayToggle = useCallback(
    (holidayDate: string) => {
      if (localExcludedDates.length === 0 && localExcludeHolidays) {
        const allOtherDates = holidays
          .filter((h) => h.date !== holidayDate)
          .map((h) => h.date);

        setLocalExcludedDates(allOtherDates);
      } else if (localExcludedDates.includes(holidayDate)) {
        setLocalExcludedDates((prev) =>
          prev.filter((date) => date !== holidayDate)
        );
      } else {
        setLocalExcludedDates((prev) => [...prev, holidayDate]);
      }
    },
    [localExcludedDates, localExcludeHolidays, holidays]
  );

  const handleSelectAll = useCallback(() => {
    const allDates = holidays.map((h) => h.date);
    setLocalExcludedDates(allDates);
    setLocalExcludeHolidays(true);
  }, [holidays]);

  const handleSelectNone = useCallback(() => {
    setLocalExcludedDates([]);
    setLocalExcludeHolidays(false);
  }, []);

  const handleSave = useCallback(() => {
    const datesToSave =
      localExcludeHolidays && localExcludedDates.length === holidays.length
        ? []
        : localExcludedDates;

    onSelectionChange(localExcludeHolidays, datesToSave);
    onClose();
  }, [
    localExcludeHolidays,
    localExcludedDates,
    holidays.length,
    onSelectionChange,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    setLocalExcludeHolidays(excludeHolidays);
    setLocalExcludedDates(excludedHolidayDates);
    setSearchTerm('');
    setDebouncedSearchTerm('');
    onClose();
  }, [excludeHolidays, excludedHolidayDates, onClose]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  const excludedCount = localExcludeHolidays
    ? localExcludedDates.length > 0
      ? localExcludedDates.length
      : holidays.length
    : 0;

  const totalCount = holidays.length;

  const selectedDateHolidays = selectedDate
    ? getHolidaysForDate(selectedDate)
    : [];

  return {
    // State
    localExcludeHolidays,
    localExcludedDates,
    searchTerm,
    debouncedSearchTerm,
    selectedDate,
    filteredHolidays,
    excludedCount,
    totalCount,
    selectedDateHolidays,

    // Setters
    setSearchTerm,
    setSelectedDate,

    // Computed values
    getHolidaysForDate,
    isHolidayExcluded,

    // Handlers
    handleMasterToggle,
    handleHolidayToggle,
    handleSelectAll,
    handleSelectNone,
    handleSave,
    handleCancel,
    handleClearSearch,
  };
};
