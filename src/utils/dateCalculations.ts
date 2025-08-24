import { addMinutes, addDays, format, differenceInMinutes } from 'date-fns';
import { WorkSchedule, Holiday, Meeting, TaskCalculation, CalculationResult } from '../types';

export class DateCalculationsUtil {
  static parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static addMinutesToDate(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  static getDailyWorkingMinutes(schedule: WorkSchedule): number {
    const startMinutes = this.parseTimeToMinutes(schedule.startTime);
    const endMinutes = this.parseTimeToMinutes(schedule.endTime);
    const lunchStartMinutes = this.parseTimeToMinutes(schedule.lunchStart);
    const lunchEndMinutes = this.parseTimeToMinutes(schedule.lunchEnd);

    const totalMinutes = endMinutes - startMinutes;
    const lunchMinutes = lunchEndMinutes - lunchStartMinutes;

    return totalMinutes - lunchMinutes;
  }

  static isWorkingDay(date: Date, schedule: WorkSchedule): boolean {
    const dayOfWeek = date.getDay();
    return schedule.workDays.includes(dayOfWeek);
  }

  static calculateEndDate(
    startDate: Date,
    estimatedHours: number,
    schedule: WorkSchedule,
    holidays: Holiday[] = [],
    meetings: Meeting[] = [],
    excludeHolidays: boolean = true,
    excludeMeetings: boolean = true
  ): CalculationResult {
    const dailyWorkingMinutes = this.getDailyWorkingMinutes(schedule);
    const totalMinutesNeeded = estimatedHours * 60;
    
    let currentDate = new Date(startDate);
    let remainingMinutes = totalMinutesNeeded;
    let workingDays = 0;
    const holidaysExcluded: Holiday[] = [];
    const meetingsExcluded: Meeting[] = [];

    // Establecer hora de inicio del día laboral
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    currentDate.setHours(startHour, startMinute, 0, 0);

    while (remainingMinutes > 0) {
      // Verificar si es día laboral
      if (!this.isWorkingDay(currentDate, schedule)) {
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(startHour, startMinute, 0, 0);
        continue;
      }

      // Verificar si es feriado
      if (excludeHolidays) {
        const holiday = this.isHoliday(currentDate, holidays);
        if (holiday) {
          holidaysExcluded.push(holiday);
          currentDate = addDays(currentDate, 1);
          currentDate.setHours(startHour, startMinute, 0, 0);
          continue;
        }
      }

      workingDays++;

      // Calcular minutos disponibles en el día actual
      let availableMinutesInDay = dailyWorkingMinutes;

      // Restar tiempo de reuniones si está habilitado
      if (excludeMeetings) {
        const dayMeetings = this.getMeetingsForDay(currentDate, meetings);
        dayMeetings.forEach(meeting => {
          if (!meeting.isOptional) {
            const meetingDuration = differenceInMinutes(meeting.end, meeting.start);
            availableMinutesInDay -= meetingDuration;
            meetingsExcluded.push(meeting);
          }
        });
      }

      // Si hay minutos negativos en el día, pasar al siguiente día
      if (availableMinutesInDay <= 0) {
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(startHour, startMinute, 0, 0);
        continue;
      }

      // Usar los minutos disponibles
      if (remainingMinutes <= availableMinutesInDay) {
        // Termina en este día
        const endTime = this.addMinutesToDate(currentDate, remainingMinutes);
        remainingMinutes = 0;
        
        return {
          startDate,
          endDate: endTime,
          workingDays,
          actualWorkingHours: totalMinutesNeeded / 60,
          holidaysExcluded,
          meetingsExcluded
        };
      } else {
        // Usar todo el día y continuar
        remainingMinutes -= availableMinutesInDay;
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(startHour, startMinute, 0, 0);
      }
    }

    return {
      startDate,
      endDate: currentDate,
      workingDays,
      actualWorkingHours: totalMinutesNeeded / 60,
      holidaysExcluded,
      meetingsExcluded
    };
  }

  private static isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidays.find(holiday => holiday.date === dateString) || null;
  }

  private static getMeetingsForDay(date: Date, meetings: Meeting[]): Meeting[] {
    const dateString = format(date, 'yyyy-MM-dd');
    return meetings.filter(meeting => {
      const meetingDateString = format(meeting.start, 'yyyy-MM-dd');
      return meetingDateString === dateString;
    });
  }

  static formatDateForDisplay(date: Date): string {
    return format(date, 'dd/MM/yyyy HH:mm');
  }

  static formatDateOnly(date: Date): string {
    return format(date, 'dd/MM/yyyy');
  }

  static getWorkingHoursInPeriod(
    startDate: Date,
    endDate: Date,
    schedule: WorkSchedule,
    holidays: Holiday[] = [],
    meetings: Meeting[] = [],
    excludeHolidays: boolean = true,
    excludeMeetings: boolean = true
  ): number {
    const dailyWorkingMinutes = this.getDailyWorkingMinutes(schedule);
    let currentDate = new Date(startDate);
    let totalWorkingMinutes = 0;

    while (currentDate <= endDate) {
      if (!this.isWorkingDay(currentDate, schedule)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      if (excludeHolidays && this.isHoliday(currentDate, holidays)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      let dayWorkingMinutes = dailyWorkingMinutes;

      if (excludeMeetings) {
        const dayMeetings = this.getMeetingsForDay(currentDate, meetings);
        dayMeetings.forEach(meeting => {
          if (!meeting.isOptional) {
            const meetingDuration = differenceInMinutes(meeting.end, meeting.start);
            dayWorkingMinutes -= meetingDuration;
          }
        });
      }

      totalWorkingMinutes += Math.max(0, dayWorkingMinutes);
      currentDate = addDays(currentDate, 1);
    }

    return totalWorkingMinutes / 60;
  }
}