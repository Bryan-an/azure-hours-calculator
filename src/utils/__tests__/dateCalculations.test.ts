import { describe, it, expect } from 'vitest';
import { DateCalculationsUtil } from '../dateCalculations';
import { WorkSchedule, Holiday, Meeting } from '../../types';

describe('DateCalculationsUtil', () => {
  // Helper para crear un schedule estándar
  const createStandardSchedule = (): WorkSchedule => ({
    startTime: '09:00',
    endTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
  });

  // Helper para crear holidays de prueba
  const createTestHolidays = (): Holiday[] => [
    {
      date: '2024-01-16', // Tuesday
      name: 'Test Holiday',
      type: 'public',
      country: 'US',
      global: false,
    },
    {
      date: '2024-01-18', // Thursday
      name: 'Another Holiday',
      type: 'public',
      country: 'US',
      global: true,
    },
  ];

  // Helper para crear meetings de prueba
  const createTestMeetings = (): Meeting[] => [
    {
      id: 'meeting-1',
      title: 'Team Meeting',
      start: new Date('2024-01-15T10:00:00'), // Monday 10:00-11:00
      end: new Date('2024-01-15T11:00:00'),
      isOptional: false,
    },
    {
      id: 'meeting-2',
      title: 'Optional Meeting',
      start: new Date('2024-01-15T15:00:00'), // Monday 15:00-16:00
      end: new Date('2024-01-15T16:00:00'),
      isOptional: true,
    },
    {
      id: 'meeting-3',
      title: 'Client Call',
      start: new Date('2024-01-17T14:00:00'), // Wednesday 14:00-15:30
      end: new Date('2024-01-17T15:30:00'),
      isOptional: false,
    },
  ];

  describe('parseTimeToMinutes', () => {
    it('should convert time string to minutes correctly', () => {
      expect(DateCalculationsUtil.parseTimeToMinutes('09:00')).toBe(540);
      expect(DateCalculationsUtil.parseTimeToMinutes('12:30')).toBe(750);
      expect(DateCalculationsUtil.parseTimeToMinutes('00:15')).toBe(15);
      expect(DateCalculationsUtil.parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('should handle edge cases', () => {
      expect(DateCalculationsUtil.parseTimeToMinutes('00:00')).toBe(0);
      expect(DateCalculationsUtil.parseTimeToMinutes('01:01')).toBe(61);
      expect(DateCalculationsUtil.parseTimeToMinutes('12:00')).toBe(720);
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

    it('should handle crossing day boundaries', () => {
      const baseDate = new Date('2024-01-15T23:30:00');
      const result = DateCalculationsUtil.addMinutesToDate(baseDate, 60);
      expect(result).toEqual(new Date('2024-01-16T00:30:00'));
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

    it('should calculate with no lunch break', () => {
      const schedule: WorkSchedule = {
        startTime: '09:00',
        endTime: '17:00',
        lunchStart: '12:00',
        lunchEnd: '12:00', // No lunch break
        workDays: [1, 2, 3, 4, 5],
      };

      const result = DateCalculationsUtil.getDailyWorkingMinutes(schedule);

      // 8 hours total (9:00 to 17:00) - 0 lunch = 8 hours = 480 minutes
      expect(result).toBe(480);
    });
  });

  describe('isWorkingDay', () => {
    const schedule = createStandardSchedule();

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

    it('should handle custom work days', () => {
      const customSchedule: WorkSchedule = {
        ...schedule,
        workDays: [0, 2, 4, 6], // Sunday, Tuesday, Thursday, Saturday
      };

      const sunday = new Date('2024-01-21T10:00:00'); // Sunday (0)
      const monday = new Date('2024-01-15T10:00:00'); // Monday (1)
      const tuesday = new Date('2024-01-16T10:00:00'); // Tuesday (2)

      expect(DateCalculationsUtil.isWorkingDay(sunday, customSchedule)).toBe(
        true
      );
      expect(DateCalculationsUtil.isWorkingDay(monday, customSchedule)).toBe(
        false
      );
      expect(DateCalculationsUtil.isWorkingDay(tuesday, customSchedule)).toBe(
        true
      );
    });
  });

  describe('calculateEndDate', () => {
    const schedule = createStandardSchedule();

    describe('basic calculations', () => {
      it('should calculate end date for same day work', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday 9 AM
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 4,
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBe(1);
        expect(result.actualWorkingHours).toBe(4);
        expect(result.endDate).toEqual(new Date('2024-01-15T14:00:00')); // 9 AM + 4 hours + 1 hour lunch
        expect(result.holidaysExcluded).toHaveLength(0);
        expect(result.meetingsExcluded).toHaveLength(0);
      });

      it('should calculate end date for multiple days', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday 9 AM
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 16, // 2 full working days
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBe(2);
        expect(result.actualWorkingHours).toBe(16);
        expect(result.endDate).toEqual(new Date('2024-01-16T18:00:00')); // End of Tuesday
      });

      it('should handle starting mid-day', () => {
        const startDate = new Date('2024-01-15T14:00:00'); // Monday 2 PM (after lunch)
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 8,
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBeGreaterThanOrEqual(1);
        expect(result.actualWorkingHours).toBe(8);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.endDate.getTime()).toBeGreaterThan(startDate.getTime());
      });

      it('should skip weekends', () => {
        const startDate = new Date('2024-01-19T15:00:00'); // Friday 3 PM
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 8,
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBeGreaterThanOrEqual(1);
        expect(result.actualWorkingHours).toBe(8);
        expect(result.endDate).toBeInstanceOf(Date);
        // Should end on Monday or later (skipping weekend)
        expect(result.endDate.getDay()).not.toBe(0); // Not Sunday
        expect(result.endDate.getDay()).not.toBe(6); // Not Saturday
      });
    });

    describe('with holidays', () => {
      it('should exclude holidays when excludeHolidays is true', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday
        const holidays = createTestHolidays();

        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 24, // 3 full days of work
          schedule,
          holidays,
          excludeHolidays: true,
          excludeMeetings: false,
        });

        // Should work Mon, skip Tue (holiday), work Wed, skip Thu (holiday), work Fri
        expect(result.workingDays).toBe(3);
        expect(result.holidaysExcluded).toHaveLength(2);
        expect(result.holidaysExcluded[0].name).toBe('Test Holiday');
        expect(result.holidaysExcluded[1].name).toBe('Another Holiday');
      });

      it('should include holidays when excludeHolidays is false', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday
        const holidays = createTestHolidays();

        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 16, // 2 full days of work
          schedule,
          holidays,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBe(2);
        expect(result.holidaysExcluded).toHaveLength(0);
        // Should end on Tuesday even though it's a holiday
        expect(result.endDate).toEqual(new Date('2024-01-16T18:00:00'));
      });
    });

    describe('with meetings', () => {
      it('should exclude mandatory meetings when excludeMeetings is true', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday
        const meetings = createTestMeetings();

        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 8,
          schedule,
          meetings,
          excludeHolidays: false,
          excludeMeetings: true,
        });

        expect(result.meetingsExcluded).toHaveLength(1);
        expect(result.meetingsExcluded[0].title).toBe('Team Meeting');
        // Should account for the 1-hour meeting, extending the end time
      });

      it('should include all meetings when excludeMeetings is false', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday
        const meetings = createTestMeetings();

        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 8,
          schedule,
          meetings,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.meetingsExcluded).toHaveLength(0);
      });

      it('should not exclude optional meetings', () => {
        const startDate = new Date('2024-01-15T09:00:00'); // Monday
        const meetings = createTestMeetings();

        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 4,
          schedule,
          meetings,
          excludeHolidays: false,
          excludeMeetings: true,
        });

        // Should only exclude mandatory meetings
        const excludedTitles = result.meetingsExcluded.map((m) => m.title);
        expect(excludedTitles).toContain('Team Meeting');
        expect(excludedTitles).not.toContain('Optional Meeting');
      });
    });

    describe('edge cases', () => {
      it('should handle starting on a non-working day', () => {
        const startDate = new Date('2024-01-20T10:00:00'); // Saturday
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 8,
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBe(1);
        // Should start from Monday
        expect(result.endDate).toEqual(new Date('2024-01-22T18:00:00')); // Monday end of day
      });

      it('should handle zero hours', () => {
        const startDate = new Date('2024-01-15T09:00:00');
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 0,
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.workingDays).toBe(0);
        expect(result.endDate).toEqual(startDate);
      });

      it('should handle very small time increments', () => {
        const startDate = new Date('2024-01-15T09:00:00');
        const result = DateCalculationsUtil.calculateEndDate({
          startDate,
          estimatedHours: 0.25, // 15 minutes
          schedule,
          excludeHolidays: false,
          excludeMeetings: false,
        });

        expect(result.actualWorkingHours).toBe(0.25);
        expect(result.endDate).toEqual(new Date('2024-01-15T09:15:00'));
      });
    });
  });

  describe('getWorkingHoursInPeriod', () => {
    const schedule = createStandardSchedule();

    it('should calculate working hours for a single day', () => {
      const startDate = new Date('2024-01-15T00:00:00'); // Monday
      const endDate = new Date('2024-01-15T23:59:59'); // Same Monday

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        excludeHolidays: false,
        excludeMeetings: false,
      });

      expect(result).toBe(8); // 8 hours of work (9-18 minus 1 hour lunch)
    });

    it('should calculate working hours for a work week', () => {
      const startDate = new Date('2024-01-15T00:00:00'); // Monday
      const endDate = new Date('2024-01-19T23:59:59'); // Friday

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        excludeHolidays: false,
        excludeMeetings: false,
      });

      expect(result).toBe(40); // 5 days * 8 hours
    });

    it('should exclude weekends', () => {
      const startDate = new Date('2024-01-15T00:00:00'); // Monday
      const endDate = new Date('2024-01-21T23:59:59'); // Sunday (full week)

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        excludeHolidays: false,
        excludeMeetings: false,
      });

      expect(result).toBe(40); // Still 5 working days * 8 hours
    });

    it('should exclude holidays when enabled', () => {
      const startDate = new Date('2024-01-15T00:00:00'); // Monday
      const endDate = new Date('2024-01-19T23:59:59'); // Friday
      const holidays = createTestHolidays();

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        holidays,
        excludeHolidays: true,
        excludeMeetings: false,
      });

      expect(result).toBe(24); // 5 days - 2 holidays = 3 days * 8 hours
    });

    it('should exclude meetings when enabled', () => {
      const startDate = new Date('2024-01-15T00:00:00'); // Monday
      const endDate = new Date('2024-01-17T23:59:59'); // Wednesday
      const meetings = createTestMeetings();

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        meetings,
        excludeHolidays: false,
        excludeMeetings: true,
      });

      // 3 days * 8 hours = 24 hours
      // - Team Meeting (1 hour on Monday)
      // - Client Call (1.5 hours on Wednesday)
      // = 21.5 hours
      expect(result).toBe(21.5);
    });

    it('should handle periods with no working days', () => {
      const startDate = new Date('2024-01-20T00:00:00'); // Saturday
      const endDate = new Date('2024-01-21T23:59:59'); // Sunday

      const result = DateCalculationsUtil.getWorkingHoursInPeriod({
        startDate,
        endDate,
        schedule,
        excludeHolidays: false,
        excludeMeetings: false,
      });

      expect(result).toBe(0);
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

    it('should handle different times of day', () => {
      const morningDate = new Date('2024-01-15T09:15:00');
      const eveningDate = new Date('2024-01-15T21:45:00');

      const morningResult =
        DateCalculationsUtil.formatDateForDisplay(morningDate);
      const eveningResult =
        DateCalculationsUtil.formatDateForDisplay(eveningDate);

      expect(morningResult).toMatch(/9:15|09:15/);
      expect(eveningResult).toMatch(/9:45|21:45/);
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

    it('should be consistent regardless of time', () => {
      const date1 = new Date('2024-01-15T00:00:00');
      const date2 = new Date('2024-01-15T23:59:59');

      const result1 = DateCalculationsUtil.formatDateOnly(date1);
      const result2 = DateCalculationsUtil.formatDateOnly(date2);

      expect(result1).toBe(result2); // Same date, different times should format the same
    });
  });
});
