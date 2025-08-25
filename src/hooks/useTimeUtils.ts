import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export const useTimeUtils = () => {
  const { workSchedule, setWorkSchedule } = useSettingsStore();

  const parseTime = useCallback((timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  const formatTime = useCallback((date: Date | null): string => {
    if (!date) return '09:00';
    return date.toTimeString().slice(0, 5);
  }, []);

  const handleWorkDayChange = useCallback(
    (day: number, checked: boolean) => {
      const newWorkDays = checked
        ? [...workSchedule.workDays, day].sort()
        : workSchedule.workDays.filter((d) => d !== day);

      setWorkSchedule({ ...workSchedule, workDays: newWorkDays });
    },
    [workSchedule, setWorkSchedule]
  );

  const updateWorkScheduleField = useCallback(
    (field: keyof typeof workSchedule, value: any) => {
      setWorkSchedule({
        ...workSchedule,
        [field]: value,
      });
    },
    [workSchedule, setWorkSchedule]
  );

  return {
    workSchedule,
    parseTime,
    formatTime,
    handleWorkDayChange,
    updateWorkScheduleField,
  };
};
