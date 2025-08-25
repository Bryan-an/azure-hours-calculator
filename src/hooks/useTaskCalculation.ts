import { useState, useCallback } from 'react';
import { Holiday, Meeting, CalculationResult } from '../types';
import { DateCalculationsUtil } from '../utils/dateCalculations';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';

interface CalculationParams {
  estimatedHours: number;
  startDate: Date;
  excludeHolidays: boolean;
  excludeMeetings: boolean;
  holidays: Holiday[];
  excludedHolidayDates: string[];
  excludedMeetingIds: string[];
  loadEvents: (startDate: Date, endDate: Date) => Promise<Meeting[]>;
}

export const useTaskCalculation = () => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationError, setCalculationError] = useState<string>('');

  const { workSchedule } = useSettingsStore();
  const { isCalculating, setCalculating } = useUIStore();

  const calculateTask = useCallback(
    async ({
      estimatedHours,
      startDate,
      excludeHolidays,
      excludeMeetings,
      holidays,
      excludedHolidayDates,
      excludedMeetingIds,
      loadEvents,
    }: CalculationParams) => {
      if (estimatedHours <= 0) {
        setCalculationError(
          'Por favor ingresa un número válido de horas estimadas.'
        );

        return;
      }

      setCalculating(true);
      setCalculationError('');
      setResult(null);

      try {
        // Primera estimación para determinar el rango de fechas para cargar reuniones
        const preliminaryResult = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours,
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

        // Cálculo final con eventos de calendario y feriados
        const finalResult = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours,
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
    },
    [workSchedule, setCalculating]
  );

  const resetCalculation = useCallback(() => {
    setResult(null);
    setCalculationError('');
  }, []);

  const getDailyWorkingHours = useCallback(() => {
    const minutes = DateCalculationsUtil.getDailyWorkingMinutes(workSchedule);
    return (minutes / 60).toFixed(1);
  }, [workSchedule]);

  return {
    result,
    calculationError,
    isCalculating,
    calculateTask,
    resetCalculation,
    getDailyWorkingHours,
    setCalculationError,
  };
};
