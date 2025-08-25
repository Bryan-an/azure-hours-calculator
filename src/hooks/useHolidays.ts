import { useState, useEffect, useCallback, useMemo } from 'react';
import { Holiday } from '../types';
import { HolidayService } from '../services/holidayService';

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const holidayService = useMemo(() => new HolidayService(), []);

  const loadHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const currentYear = new Date().getFullYear();
      const holidayList = await holidayService.getEcuadorHolidays(currentYear);
      setHolidays(holidayList);
    } catch (error) {
      console.error('Error loading holidays:', error);
      setError('Error al cargar feriados ecuatorianos');
    } finally {
      setLoading(false);
    }
  }, [holidayService]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  return {
    holidays,
    loading,
    error,
    refetch: loadHolidays,
  };
};
