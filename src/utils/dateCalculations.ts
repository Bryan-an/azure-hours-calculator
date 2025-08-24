import { addMinutes, addDays, format, differenceInMinutes } from 'date-fns';
import { WorkSchedule, Holiday, Meeting, CalculationResult } from '../types';

interface CalculateEndDateParams {
  startDate: Date;
  estimatedHours: number;
  schedule: WorkSchedule;
  holidays?: Holiday[];
  meetings?: Meeting[];
  excludeHolidays?: boolean;
  excludeMeetings?: boolean;
}

interface GetWorkingHoursParams {
  startDate: Date;
  endDate: Date;
  schedule: WorkSchedule;
  holidays?: Holiday[];
  meetings?: Meeting[];
  excludeHolidays?: boolean;
  excludeMeetings?: boolean;
}

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

  static calculateEndDate(params: CalculateEndDateParams): CalculationResult {
    const {
      startDate,
      estimatedHours,
      schedule,
      holidays = [],
      meetings = [],
      excludeHolidays = true,
      excludeMeetings = true,
    } = params;

    const dailyWorkingMinutes = this.getDailyWorkingMinutes(schedule);
    const totalMinutesNeeded = estimatedHours * 60;
    let currentDate = new Date(startDate);

    // Normalizar segundos y milisegundos para evitar desajustes
    currentDate.setSeconds(0, 0);
    let remainingMinutes = totalMinutesNeeded;
    let workingDays = 0;
    const holidaysExcluded: Holiday[] = [];
    const meetingsExcluded: Meeting[] = [];
    let isFirstDay = true;

    // Configuración del horario laboral
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);

    while (remainingMinutes > 0) {
      // Para días subsecuentes, establecer hora de inicio del horario laboral
      if (!isFirstDay) {
        currentDate.setHours(startHour, startMinute, 0, 0);
      }

      // Verificar si es día laboral
      if (!this.isWorkingDay(currentDate, schedule)) {
        currentDate = addDays(currentDate, 1);
        isFirstDay = false;
        continue;
      }

      // Verificar si es feriado
      if (excludeHolidays) {
        const holiday = this.isHoliday(currentDate, holidays);

        if (holiday) {
          holidaysExcluded.push(holiday);
          currentDate = addDays(currentDate, 1);
          isFirstDay = false;
          continue;
        }
      }

      workingDays++;

      // Calcular minutos disponibles en el día actual
      let availableMinutesInDay: number;

      if (isFirstDay) {
        // En el primer día, calcular desde la hora de inicio hasta el final del día laboral
        const endOfWorkDay = new Date(currentDate);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        endOfWorkDay.setHours(endHour, endMinute, 0, 0);

        // Calcular minutos totales desde hora de inicio hasta final del día
        const totalMinutesFromStart = differenceInMinutes(
          endOfWorkDay,
          currentDate
        );

        // Restar almuerzo si está dentro del período
        const [lunchStartHour, lunchStartMinute] = schedule.lunchStart
          .split(':')
          .map(Number);

        const [lunchEndHour, lunchEndMinute] = schedule.lunchEnd
          .split(':')
          .map(Number);

        const lunchStart = new Date(currentDate);
        lunchStart.setHours(lunchStartHour, lunchStartMinute, 0, 0);

        const lunchEnd = new Date(currentDate);
        lunchEnd.setHours(lunchEndHour, lunchEndMinute, 0, 0);

        let lunchMinutesToSubtract = 0;

        if (currentDate < lunchEnd) {
          // El almuerzo está después de la hora de inicio
          const lunchStartTime =
            currentDate < lunchStart ? lunchStart : currentDate;

          lunchMinutesToSubtract = differenceInMinutes(
            lunchEnd,
            lunchStartTime
          );
        }

        availableMinutesInDay = totalMinutesFromStart - lunchMinutesToSubtract;
      } else {
        // En días completos, usar el cálculo normal
        availableMinutesInDay = dailyWorkingMinutes;
      }

      // Restar tiempo de reuniones si está habilitado
      if (excludeMeetings) {
        const dayMeetings = isFirstDay
          ? this.getMeetingsForDayAfterTime(currentDate, meetings)
          : this.getMeetingsForDay(currentDate, meetings);

        dayMeetings.forEach((meeting) => {
          if (!meeting.isOptional) {
            const meetingDuration = differenceInMinutes(
              meeting.end,
              meeting.start
            );

            availableMinutesInDay -= meetingDuration;

            // Solo agregar a la lista si no está ya incluido (evitar duplicados)
            if (!meetingsExcluded.some((m) => m.id === meeting.id)) {
              meetingsExcluded.push(meeting);
            }
          }
        });
      }

      // Si hay minutos negativos en el día, pasar al siguiente día
      if (availableMinutesInDay <= 0) {
        currentDate = addDays(currentDate, 1);
        isFirstDay = false;
        continue;
      }

      // Usar los minutos disponibles
      if (remainingMinutes <= availableMinutesInDay) {
        // Termina en este día - calcular el tiempo final considerando interrupciones
        const endTime = this.calculateEndTimeWithMeetings(
          currentDate,
          remainingMinutes,
          schedule,
          meetings,
          excludeMeetings
        );

        remainingMinutes = 0;

        return {
          startDate,
          endDate: endTime,
          workingDays,
          actualWorkingHours: totalMinutesNeeded / 60,
          holidaysExcluded,
          meetingsExcluded,
        };
      } else {
        // Usar todo el día y continuar
        remainingMinutes -= availableMinutesInDay;
        currentDate = addDays(currentDate, 1);
        isFirstDay = false;
      }
    }

    return {
      startDate,
      endDate: currentDate,
      workingDays,
      actualWorkingHours: totalMinutesNeeded / 60,
      holidaysExcluded,
      meetingsExcluded,
    };
  }

  private static isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidays.find((holiday) => holiday.date === dateString) || null;
  }

  private static getMeetingsForDay(date: Date, meetings: Meeting[]): Meeting[] {
    const dateString = format(date, 'yyyy-MM-dd');

    return meetings.filter((meeting) => {
      const meetingDateString = format(meeting.start, 'yyyy-MM-dd');
      return meetingDateString === dateString;
    });
  }

  private static getMeetingsForDayAfterTime(
    currentTime: Date,
    meetings: Meeting[]
  ): Meeting[] {
    const dateString = format(currentTime, 'yyyy-MM-dd');

    return meetings.filter((meeting) => {
      const meetingDateString = format(meeting.start, 'yyyy-MM-dd');
      // Solo incluir meetings del mismo día que se superpongan con el tiempo de trabajo
      // Un meeting se superpone si termina después de currentTime
      return meetingDateString === dateString && meeting.end > currentTime;
    });
  }

  private static calculateEndTimeWithMeetings(
    startOfDay: Date,
    minutesToWork: number,
    schedule: WorkSchedule,
    meetings: Meeting[],
    excludeMeetings: boolean
  ): Date {
    if (!excludeMeetings) {
      // Sin exclusión de reuniones, pero sí excluir almuerzo
      const workIntervals = this.getWorkIntervalsForDay(
        startOfDay,
        schedule,
        [],
        startOfDay
      );

      let remainingMinutes = minutesToWork;

      for (const interval of workIntervals) {
        const intervalDuration = differenceInMinutes(
          interval.end,
          interval.start
        );

        if (remainingMinutes <= intervalDuration) {
          return this.addMinutesToDate(interval.start, remainingMinutes);
        } else {
          remainingMinutes -= intervalDuration;
        }
      }

      const lastInterval = workIntervals[workIntervals.length - 1];

      return lastInterval
        ? lastInterval.end
        : this.addMinutesToDate(startOfDay, minutesToWork);
    }

    const dayMeetings = this.getMeetingsForDayAfterTime(startOfDay, meetings)
      .filter((meeting) => !meeting.isOptional)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let remainingMinutes = minutesToWork;

    // Crear intervalos de trabajo disponibles considerando reuniones y almuerzo
    const workIntervals = this.getWorkIntervalsForDay(
      startOfDay,
      schedule,
      dayMeetings,
      startOfDay
    );

    for (const interval of workIntervals) {
      const intervalDuration = differenceInMinutes(
        interval.end,
        interval.start
      );

      if (remainingMinutes <= intervalDuration) {
        // El trabajo termina en este intervalo
        return this.addMinutesToDate(interval.start, remainingMinutes);
      } else {
        // Usar todo el intervalo y continuar
        remainingMinutes -= intervalDuration;
      }
    }

    // Si llegamos aquí, necesitamos más tiempo del disponible en el día
    // Retornar el final del último intervalo de trabajo
    const lastInterval = workIntervals[workIntervals.length - 1];

    return lastInterval
      ? lastInterval.end
      : this.addMinutesToDate(startOfDay, minutesToWork);
  }

  private static getWorkIntervalsForDay(
    date: Date,
    schedule: WorkSchedule,
    meetings: Meeting[],
    actualStartTime?: Date
  ): Array<{ start: Date; end: Date }> {
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    const [lunchStartHour, lunchStartMinute] = schedule.lunchStart
      .split(':')
      .map(Number);

    const [lunchEndHour, lunchEndMinute] = schedule.lunchEnd
      .split(':')
      .map(Number);

    const dayStart = actualStartTime
      ? new Date(actualStartTime)
      : new Date(date);

    if (!actualStartTime) {
      dayStart.setHours(startHour, startMinute, 0, 0);
    }

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    const lunchStart = new Date(date);
    lunchStart.setHours(lunchStartHour, lunchStartMinute, 0, 0);

    const lunchEnd = new Date(date);
    lunchEnd.setHours(lunchEndHour, lunchEndMinute, 0, 0);

    // Crear lista de todos los períodos no disponibles (almuerzo + reuniones)
    const unavailableIntervals: Array<{ start: Date; end: Date }> = [
      { start: lunchStart, end: lunchEnd },
    ];

    // Agregar reuniones del día
    meetings.forEach((meeting) => {
      unavailableIntervals.push({
        start: new Date(meeting.start),
        end: new Date(meeting.end),
      });
    });

    // Ordenar intervalos no disponibles por hora de inicio
    unavailableIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Calcular intervalos de trabajo disponibles
    const workIntervals: Array<{ start: Date; end: Date }> = [];
    let currentStart = dayStart;

    for (const unavailable of unavailableIntervals) {
      // Si hay tiempo disponible antes de este período no disponible
      if (currentStart < unavailable.start) {
        workIntervals.push({
          start: new Date(currentStart),
          end: new Date(unavailable.start),
        });
      }

      // Mover el inicio actual al final del período no disponible
      if (unavailable.end > currentStart) {
        currentStart = unavailable.end;
      }
    }

    // Agregar el último intervalo si queda tiempo después del último período no disponible
    if (currentStart < dayEnd) {
      workIntervals.push({
        start: new Date(currentStart),
        end: new Date(dayEnd),
      });
    }

    return workIntervals.filter((interval) => interval.start < interval.end);
  }

  static formatDateForDisplay(date: Date): string {
    const locale = navigator.language || 'en-US';
    const isEnglish = locale.startsWith('en');
    const datePattern = isEnglish ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

    return format(date, `${datePattern} h:mm a`);
  }

  static formatDateOnly(date: Date): string {
    const locale = navigator.language || 'en-US';
    const isEnglish = locale.startsWith('en');
    const datePattern = isEnglish ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

    return format(date, datePattern);
  }

  static getWorkingHoursInPeriod(params: GetWorkingHoursParams): number {
    const {
      startDate,
      endDate,
      schedule,
      holidays = [],
      meetings = [],
      excludeHolidays = true,
      excludeMeetings = true,
    } = params;

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

        dayMeetings.forEach((meeting) => {
          if (!meeting.isOptional) {
            const meetingDuration = differenceInMinutes(
              meeting.end,
              meeting.start
            );

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
