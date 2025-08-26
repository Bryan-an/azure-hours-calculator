import { describe, it, expect } from 'vitest';
import { DateCalculationsUtil } from '../dateCalculations';
import { WorkSchedule } from '../../types';

describe('DateCalculationsUtil', () => {
  describe('parseTimeToMinutes', () => {
    it('should convert time string to minutes correctly', () => {
      expect(DateCalculationsUtil.parseTimeToMinutes('09:00')).toBe(540);
      expect(DateCalculationsUtil.parseTimeToMinutes('12:30')).toBe(750);
      expect(DateCalculationsUtil.parseTimeToMinutes('00:15')).toBe(15);
      expect(DateCalculationsUtil.parseTimeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('addMinutesToDate', () => {
    it('should add minutes to a date correctly', () => {
      const baseDate = new Date('2024-01-15T09:00:00');
      const result = DateCalculationsUtil.addMinutesToDate(baseDate, 30);
      expect(result).toEqual(new Date('2024-01-15T09:30:00'));
    });

    it('should handle negative minutes', () => {
      const baseDate = new Date('2024-01-15T09:00:00');
      const result = DateCalculationsUtil.addMinutesToDate(baseDate, -30);
      expect(result).toEqual(new Date('2024-01-15T08:30:00'));
    });
  });

  describe('getDailyWorkingMinutes', () => {
    it('should calculate daily working minutes correctly', () => {
      const schedule: WorkSchedule = {
        startTime: '09:00',
        endTime: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        workDays: [1, 2, 3, 4, 5], // Monday to Friday
      };

      const result = DateCalculationsUtil.getDailyWorkingMinutes(schedule);

      // 9 hours total (9:00 to 18:00) - 1 hour lunch = 8 hours = 480 minutes
      expect(result).toBe(480);
    });

    it('should calculate working minutes with different lunch periods', () => {
      const schedule: WorkSchedule = {
        startTime: '08:00',
        endTime: '17:00',
        lunchStart: '12:00',
        lunchEnd: '12:30',
        workDays: [1, 2, 3, 4, 5],
      };

      const result = DateCalculationsUtil.getDailyWorkingMinutes(schedule);

      // 9 hours total (8:00 to 17:00) - 0.5 hour lunch = 8.5 hours = 510 minutes
      expect(result).toBe(510);
    });
  });

  describe('isWorkingDay', () => {
    const schedule: WorkSchedule = {
      startTime: '09:00',
      endTime: '18:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
    };

    it('should return true for working days', () => {
      // Monday (1)
      const monday = new Date('2024-01-15T10:00:00'); // Monday
      expect(DateCalculationsUtil.isWorkingDay(monday, schedule)).toBe(true);

      // Friday (5)
      const friday = new Date('2024-01-19T10:00:00'); // Friday
      expect(DateCalculationsUtil.isWorkingDay(friday, schedule)).toBe(true);
    });

    it('should return false for non-working days', () => {
      // Saturday (6)
      const saturday = new Date('2024-01-20T10:00:00'); // Saturday
      expect(DateCalculationsUtil.isWorkingDay(saturday, schedule)).toBe(false);

      // Sunday (0)
      const sunday = new Date('2024-01-21T10:00:00'); // Sunday
      expect(DateCalculationsUtil.isWorkingDay(sunday, schedule)).toBe(false);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date for display', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = DateCalculationsUtil.formatDateForDisplay(date);

      // El resultado depende del locale del navegador, pero debe incluir fecha y hora
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/01|15/);
      expect(result).toMatch(/2:30|14:30/);
    });
  });

  describe('formatDateOnly', () => {
    it('should format date without time', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = DateCalculationsUtil.formatDateOnly(date);

      // El resultado depende del locale del navegador
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/01|15/);
      expect(result).not.toMatch(/:/); // No debe incluir tiempo
    });
  });
});
