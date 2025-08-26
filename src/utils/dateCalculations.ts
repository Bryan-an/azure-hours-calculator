import { addMinutes, addDays, format, differenceInMinutes } from 'date-fns';
import { WorkSchedule, Holiday, Meeting, CalculationResult } from '../types';

/**
 * Parámetros para el cálculo de fecha de finalización de tareas
 *
 * Define todos los parámetros necesarios para calcular cuándo finalizará
 * una tarea considerando horarios laborales, festivos y reuniones.
 *
 * @example
 * ```typescript
 * const params: CalculateEndDateParams = {
 *   startDate: new Date('2024-01-15T09:00:00'),
 *   estimatedHours: 16,
 *   schedule: workSchedule,
 *   holidays: publicHolidays,
 *   meetings: teamMeetings,
 *   excludeHolidays: true,
 *   excludeMeetings: true
 * };
 * ```
 *
 * @public
 */
interface CalculateEndDateParams {
  /** Fecha y hora de inicio de la tarea */
  startDate: Date;
  /** Número de horas estimadas de trabajo para completar la tarea */
  estimatedHours: number;
  /** Configuración del horario laboral (días, horas, almuerzo) */
  schedule: WorkSchedule;
  /** Lista opcional de festivos a considerar en el cálculo */
  holidays?: Holiday[];
  /** Lista opcional de reuniones a considerar en el cálculo */
  meetings?: Meeting[];
  /** Si se deben excluir los festivos del tiempo laboral (default: true) */
  excludeHolidays?: boolean;
  /** Si se deben excluir las reuniones del tiempo laboral (default: true) */
  excludeMeetings?: boolean;
}

/**
 * Parámetros para el cálculo de horas laborales en un período específico
 *
 * Define los parámetros necesarios para calcular el total de horas laborales
 * disponibles entre dos fechas, considerando configuraciones y exclusiones.
 *
 * @example
 * ```typescript
 * const params: GetWorkingHoursParams = {
 *   startDate: new Date('2024-01-15T00:00:00'),
 *   endDate: new Date('2024-01-19T23:59:59'),
 *   schedule: standardSchedule,
 *   holidays: publicHolidays,
 *   excludeHolidays: true,
 *   excludeMeetings: true
 * };
 * ```
 *
 * @public
 */
interface GetWorkingHoursParams {
  /** Fecha de inicio del período a calcular */
  startDate: Date;
  /** Fecha de fin del período a calcular */
  endDate: Date;
  /** Configuración del horario laboral */
  schedule: WorkSchedule;
  /** Lista opcional de festivos a considerar */
  holidays?: Holiday[];
  /** Lista opcional de reuniones a considerar */
  meetings?: Meeting[];
  /** Si se deben excluir los festivos (default: true) */
  excludeHolidays?: boolean;
  /** Si se deben excluir las reuniones (default: true) */
  excludeMeetings?: boolean;
}

/**
 * Utilidades para cálculos de fechas y tiempos laborales en Azure DevOps
 *
 * Esta clase proporciona funcionalidades para:
 * - Calcular fechas de finalización de tareas considerando horarios laborales
 * - Determinar horas laborales en períodos específicos
 * - Manejar exclusiones de festivos y reuniones
 * - Formatear fechas para visualización
 *
 * @example
 * Calcular fecha de finalización para una tarea de 16 horas:
 * ```typescript
 * const result = DateCalculationsUtil.calculateEndDate({
 *   startDate: new Date('2024-01-15T09:00:00'),
 *   estimatedHours: 16,
 *   schedule: {
 *     startTime: '09:00',
 *     endTime: '18:00',
 *     lunchStart: '12:00',
 *     lunchEnd: '13:00',
 *     workDays: [1, 2, 3, 4, 5]
 *   },
 *   excludeHolidays: true
 * });
 * console.log(`Task ends: ${result.endDate}`);
 * ```
 *
 * @public
 */
export class DateCalculationsUtil {
  /**
   * Convierte una cadena de tiempo en formato "HH:mm" a minutos totales desde medianoche
   *
   * @param timeString - Tiempo en formato "HH:mm" (ej: "09:30", "14:15")
   * @returns Número total de minutos desde medianoche
   *
   * @example
   * ```typescript
   * const minutes = DateCalculationsUtil.parseTimeToMinutes("09:30");
   * console.log(minutes); // 570 (9*60 + 30)
   * ```
   *
   * @public
   */
  static parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Agrega una cantidad específica de minutos a una fecha
   *
   * Utiliza la biblioteca date-fns para realizar la adición de manera segura,
   * manejando automáticamente cambios de día, mes y año.
   *
   * @param date - Fecha base a la que se agregarán los minutos
   * @param minutes - Número de minutos a agregar (puede ser negativo para restar)
   * @returns Nueva fecha con los minutos agregados
   *
   * @example
   * ```typescript
   * const baseDate = new Date('2024-01-15T09:00:00');
   * const newDate = DateCalculationsUtil.addMinutesToDate(baseDate, 90);
   * console.log(newDate); // 2024-01-15T10:30:00
   * ```
   *
   * @example
   * Restar minutos usando valores negativos:
   * ```typescript
   * const baseDate = new Date('2024-01-15T09:00:00');
   * const earlierDate = DateCalculationsUtil.addMinutesToDate(baseDate, -30);
   * console.log(earlierDate); // 2024-01-15T08:30:00
   * ```
   *
   * @public
   */
  static addMinutesToDate(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  /**
   * Calcula el total de minutos de trabajo efectivos en un día laboral
   *
   * Toma en cuenta el horario de inicio y fin, descontando automáticamente
   * el tiempo de almuerzo configurado para obtener las horas netas de trabajo.
   *
   * @param schedule - Configuración del horario laboral con tiempos de inicio, fin y almuerzo
   * @returns Número total de minutos de trabajo efectivos por día
   *
   * @example
   * Horario estándar de oficina:
   * ```typescript
   * const schedule: WorkSchedule = {
   *   startTime: '09:00',
   *   endTime: '18:00',
   *   lunchStart: '12:00',
   *   lunchEnd: '13:00',
   *   workDays: [1, 2, 3, 4, 5]
   * };
   * const minutes = DateCalculationsUtil.getDailyWorkingMinutes(schedule);
   * console.log(minutes); // 480 (8 horas * 60 minutos)
   * ```
   *
   * @example
   * Horario con almuerzo corto:
   * ```typescript
   * const schedule: WorkSchedule = {
   *   startTime: '08:00',
   *   endTime: '17:00',
   *   lunchStart: '12:00',
   *   lunchEnd: '12:30',
   *   workDays: [1, 2, 3, 4, 5]
   * };
   * const minutes = DateCalculationsUtil.getDailyWorkingMinutes(schedule);
   * console.log(minutes); // 510 (8.5 horas * 60 minutos)
   * ```
   *
   * @remarks
   * El cálculo es: (hora_fin - hora_inicio) - (almuerzo_fin - almuerzo_inicio)
   *
   * @public
   */
  static getDailyWorkingMinutes(schedule: WorkSchedule): number {
    const startMinutes = this.parseTimeToMinutes(schedule.startTime);
    const endMinutes = this.parseTimeToMinutes(schedule.endTime);
    const lunchStartMinutes = this.parseTimeToMinutes(schedule.lunchStart);
    const lunchEndMinutes = this.parseTimeToMinutes(schedule.lunchEnd);

    const totalMinutes = endMinutes - startMinutes;
    const lunchMinutes = lunchEndMinutes - lunchStartMinutes;

    return totalMinutes - lunchMinutes;
  }

  /**
   * Determina si una fecha específica es un día laboral según la configuración del horario
   *
   * Verifica si el día de la semana de la fecha proporcionada está incluido
   * en la lista de días laborales definidos en el horario de trabajo.
   *
   * @param date - Fecha a verificar
   * @param schedule - Configuración del horario laboral que incluye los días de trabajo
   * @returns `true` si es día laboral, `false` si es fin de semana o día no laboral
   *
   * @example
   * Verificar un lunes (día laboral típico):
   * ```typescript
   * const monday = new Date('2024-01-15T10:00:00'); // Lunes
   * const schedule: WorkSchedule = {
   *   startTime: '09:00',
   *   endTime: '18:00',
   *   lunchStart: '12:00',
   *   lunchEnd: '13:00',
   *   workDays: [1, 2, 3, 4, 5] // Lunes a Viernes
   * };
   * const isWorking = DateCalculationsUtil.isWorkingDay(monday, schedule);
   * console.log(isWorking); // true
   * ```
   *
   * @example
   * Verificar un sábado (típicamente no laboral):
   * ```typescript
   * const saturday = new Date('2024-01-20T10:00:00'); // Sábado
   * const isWorking = DateCalculationsUtil.isWorkingDay(saturday, schedule);
   * console.log(isWorking); // false
   * ```
   *
   * @example
   * Horario personalizado incluyendo sábado:
   * ```typescript
   * const customSchedule: WorkSchedule = {
   *   startTime: '08:00',
   *   endTime: '14:00',
   *   lunchStart: '11:00',
   *   lunchEnd: '11:30',
   *   workDays: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
   * };
   * const saturday = new Date('2024-01-20T10:00:00');
   * const isWorking = DateCalculationsUtil.isWorkingDay(saturday, customSchedule);
   * console.log(isWorking); // true
   * ```
   *
   * @remarks
   * Los días de la semana se representan como números donde:
   * - 0 = Domingo
   * - 1 = Lunes
   * - 2 = Martes
   * - 3 = Miércoles
   * - 4 = Jueves
   * - 5 = Viernes
   * - 6 = Sábado
   *
   * @public
   */
  static isWorkingDay(date: Date, schedule: WorkSchedule): boolean {
    const dayOfWeek = date.getDay();
    return schedule.workDays.includes(dayOfWeek);
  }

  /**
   * Calcula la fecha y hora de finalización de una tarea considerando horarios laborales,
   * festivos y reuniones
   *
   * Esta función toma una fecha de inicio y horas estimadas, luego calcula cuándo
   * se completará la tarea considerando únicamente las horas laborales efectivas.
   * Puede excluir festivos y reuniones del tiempo disponible.
   *
   * @param params - Objeto con parámetros de configuración que incluye:
   *   - `startDate`: Fecha y hora de inicio de la tarea
   *   - `estimatedHours`: Horas estimadas de trabajo para completar la tarea
   *   - `schedule`: Configuración del horario laboral
   *   - `holidays`: Lista opcional de festivos a considerar
   *   - `meetings`: Lista opcional de reuniones a considerar
   *   - `excludeHolidays`: Si excluir festivos del cálculo (default: true)
   *   - `excludeMeetings`: Si excluir reuniones del cálculo (default: true)
   *
   * @returns Resultado del cálculo con fecha final, días laborales y exclusiones aplicadas
   *
   * @example
   * Cálculo básico sin exclusiones:
   * ```typescript
   * const result = DateCalculationsUtil.calculateEndDate({
   *   startDate: new Date('2024-01-15T09:00:00'),
   *   estimatedHours: 8,
   *   schedule: standardSchedule,
   *   excludeHolidays: false,
   *   excludeMeetings: false
   * });
   * ```
   *
   * @example
   * Cálculo completo con festivos y reuniones:
   * ```typescript
   * const result = DateCalculationsUtil.calculateEndDate({
   *   startDate: new Date('2024-01-15T14:30:00'),
   *   estimatedHours: 24,
   *   schedule: standardSchedule,
   *   holidays: publicHolidays,
   *   meetings: teamMeetings,
   *   excludeHolidays: true,
   *   excludeMeetings: true
   * });
   * console.log(`Task will end on: ${result.endDate}`);
   * console.log(`Working days required: ${result.workingDays}`);
   * console.log(`Holidays excluded: ${result.holidaysExcluded.length}`);
   * ```
   *
   * @public
   */
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

  /**
   * Verifica si una fecha específica coincide con algún festivo en la lista
   *
   * Compara la fecha proporcionada (en formato 'yyyy-MM-dd') con las fechas
   * de todos los festivos en la lista para determinar si hay coincidencia.
   *
   * @param date - Fecha a verificar contra la lista de festivos
   * @param holidays - Lista de festivos para comparar
   * @returns El objeto Holiday si la fecha es festivo, null si no lo es
   *
   * @internal
   */
  private static isHoliday(date: Date, holidays: Holiday[]): Holiday | null {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidays.find((holiday) => holiday.date === dateString) || null;
  }

  /**
   * Obtiene todas las reuniones programadas para un día específico
   *
   * Filtra la lista de reuniones y devuelve solo aquellas que ocurren
   * en la misma fecha que la proporcionada.
   *
   * @param date - Fecha para la cual obtener las reuniones
   * @param meetings - Lista completa de reuniones a filtrar
   * @returns Array de reuniones que ocurren en la fecha especificada
   *
   * @internal
   */
  private static getMeetingsForDay(date: Date, meetings: Meeting[]): Meeting[] {
    const dateString = format(date, 'yyyy-MM-dd');

    return meetings.filter((meeting) => {
      const meetingDateString = format(meeting.start, 'yyyy-MM-dd');
      return meetingDateString === dateString;
    });
  }

  /**
   * Obtiene las reuniones de un día que se superponen con el tiempo de trabajo restante
   *
   * Filtra las reuniones para incluir solo aquellas del mismo día que terminan
   * después de la hora actual especificada. Esto es útil para el primer día
   * de trabajo cuando se inicia a una hora específica.
   *
   * @param currentTime - Hora actual desde la cual considerar las reuniones
   * @param meetings - Lista completa de reuniones a filtrar
   * @returns Array de reuniones que se superponen con el tiempo de trabajo restante
   *
   * @internal
   */
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

  /**
   * Calcula la hora exacta de finalización considerando reuniones y almuerzo
   *
   * Determina cuándo exactamente terminará el trabajo en un día específico,
   * distribuyendo los minutos de trabajo a través de los intervalos disponibles
   * (evitando reuniones y almuerzo según la configuración).
   *
   * @param startOfDay - Hora de inicio del trabajo en el día
   * @param minutesToWork - Cantidad de minutos de trabajo que deben completarse
   * @param schedule - Configuración del horario laboral
   * @param meetings - Lista de reuniones del día
   * @param excludeMeetings - Si se deben excluir las reuniones del tiempo disponible
   * @returns Fecha y hora exacta cuando se completará el trabajo
   *
   * @internal
   */
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

  /**
   * Calcula los intervalos de tiempo disponibles para trabajar en un día específico
   *
   * Divide el día laboral en intervalos continuos de tiempo disponible,
   * excluyendo automáticamente el almuerzo y las reuniones especificadas.
   * Es fundamental para calcular cuándo exactamente se puede completar el trabajo.
   *
   * @param date - Fecha del día para calcular los intervalos
   * @param schedule - Configuración del horario laboral
   * @param meetings - Lista de reuniones que deben excluirse
   * @param actualStartTime - Hora de inicio real (opcional, usa horario del schedule por defecto)
   * @returns Array de intervalos de trabajo con hora de inicio y fin
   *
   * @example
   * Un día típico podría devolver intervalos como:
   * - 09:00-12:00 (antes del almuerzo)
   * - 13:00-15:00 (después del almuerzo, antes de reunión)
   * - 16:00-18:00 (después de reunión, fin del día)
   *
   * @internal
   */
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

  /**
   * Formatea una fecha para visualización considerando la configuración regional
   *
   * Detecta automáticamente el idioma del navegador para aplicar el formato
   * de fecha apropiado (MM/dd/yyyy para inglés, dd/MM/yyyy para otros idiomas)
   * e incluye la hora en formato de 12 horas con AM/PM.
   *
   * @param date - Fecha a formatear para mostrar al usuario
   * @returns Cadena formateada con fecha y hora según la configuración regional
   *
   * @example
   * En navegador configurado en inglés:
   * ```typescript
   * const date = new Date('2024-01-15T14:30:00');
   * const formatted = DateCalculationsUtil.formatDateForDisplay(date);
   * console.log(formatted); // "01/15/2024 2:30 PM"
   * ```
   *
   * @example
   * En navegador configurado en español:
   * ```typescript
   * const date = new Date('2024-01-15T14:30:00');
   * const formatted = DateCalculationsUtil.formatDateForDisplay(date);
   * console.log(formatted); // "15/01/2024 2:30 PM"
   * ```
   *
   * @remarks
   * La detección del idioma se basa en `navigator.language`. Si no está
   * disponible, se utiliza 'en-US' como valor por defecto.
   *
   * @public
   */
  static formatDateForDisplay(date: Date): string {
    const locale = navigator.language || 'en-US';
    const isEnglish = locale.startsWith('en');
    const datePattern = isEnglish ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

    return format(date, `${datePattern} h:mm a`);
  }

  /**
   * Formatea una fecha para visualización sin incluir información de hora
   *
   * Similar a {@link formatDateForDisplay} pero omite la hora y muestra
   * únicamente la fecha según la configuración regional del navegador.
   *
   * @param date - Fecha a formatear (la hora será ignorada)
   * @returns Cadena formateada con solo la fecha según la configuración regional
   *
   * @example
   * En navegador configurado en inglés:
   * ```typescript
   * const date = new Date('2024-01-15T14:30:00');
   * const formatted = DateCalculationsUtil.formatDateOnly(date);
   * console.log(formatted); // "01/15/2024"
   * ```
   *
   * @example
   * En navegador configurado en español:
   * ```typescript
   * const date = new Date('2024-01-15T14:30:00');
   * const formatted = DateCalculationsUtil.formatDateOnly(date);
   * console.log(formatted); // "15/01/2024"
   * ```
   *
   * @example
   * Útil para mostrar fechas de eventos o deadlines:
   * ```typescript
   * const deadline = new Date('2024-01-15T23:59:59');
   * const eventDate = new Date('2024-01-15T09:00:00');
   *
   * console.log(DateCalculationsUtil.formatDateOnly(deadline));  // "01/15/2024"
   * console.log(DateCalculationsUtil.formatDateOnly(eventDate)); // "01/15/2024"
   * // Ambas muestran la misma fecha independientemente de la hora
   * ```
   *
   * @see {@link formatDateForDisplay} Para formato que incluye hora
   *
   * @public
   */
  static formatDateOnly(date: Date): string {
    const locale = navigator.language || 'en-US';
    const isEnglish = locale.startsWith('en');
    const datePattern = isEnglish ? 'MM/dd/yyyy' : 'dd/MM/yyyy';

    return format(date, datePattern);
  }

  /**
   * Calcula el total de horas laborales disponibles en un período específico
   *
   * Analiza cada día del período especificado y suma las horas laborales efectivas,
   * considerando días de trabajo, festivos, reuniones y configuración del horario.
   * Es útil para determinar la capacidad total de trabajo disponible en un rango de fechas.
   *
   * @param params - Parámetros de configuración para el cálculo del período
   * @returns Total de horas laborales disponibles en el período (puede incluir decimales)
   *
   * @example
   * Calcular horas disponibles en una semana laboral:
   * ```typescript
   * const weekHours = DateCalculationsUtil.getWorkingHoursInPeriod({
   *   startDate: new Date('2024-01-15T00:00:00'), // Lunes
   *   endDate: new Date('2024-01-19T23:59:59'),   // Viernes
   *   schedule: {
   *     startTime: '09:00',
   *     endTime: '18:00',
   *     lunchStart: '12:00',
   *     lunchEnd: '13:00',
   *     workDays: [1, 2, 3, 4, 5]
   *   },
   *   excludeHolidays: false,
   *   excludeMeetings: false
   * });
   * console.log(weekHours); // 40 (5 días × 8 horas)
   * ```
   *
   * @example
   * Calcular horas considerando festivos y reuniones:
   * ```typescript
   * const availableHours = DateCalculationsUtil.getWorkingHoursInPeriod({
   *   startDate: new Date('2024-01-15T00:00:00'),
   *   endDate: new Date('2024-01-19T23:59:59'),
   *   schedule: standardSchedule,
   *   holidays: [
   *     { date: '2024-01-17', name: 'Holiday', type: 'public', country: 'US', global: true }
   *   ],
   *   meetings: [
   *     {
   *       id: '1',
   *       title: 'Team Meeting',
   *       start: new Date('2024-01-15T10:00:00'),
   *       end: new Date('2024-01-15T11:00:00'),
   *       isOptional: false
   *     }
   *   ],
   *   excludeHolidays: true,
   *   excludeMeetings: true
   * });
   * console.log(availableHours); // 31 (40 - 8 por feriado - 1 por reunión)
   * ```
   *
   * @example
   * Verificar capacidad para un proyecto:
   * ```typescript
   * const projectCapacity = DateCalculationsUtil.getWorkingHoursInPeriod({
   *   startDate: projectStart,
   *   endDate: projectDeadline,
   *   schedule: teamSchedule,
   *   holidays: companyHolidays,
   *   meetings: scheduledMeetings,
   *   excludeHolidays: true,
   *   excludeMeetings: true
   * });
   *
   * if (projectCapacity >= requiredHours) {
   *   console.log(`✅ Proyecto factible: ${projectCapacity} horas disponibles`);
   * } else {
   *   console.log(`⚠️ Insuficiente capacidad: faltan ${requiredHours - projectCapacity} horas`);
   * }
   * ```
   *
   * @remarks
   * - Solo cuenta días que están marcados como laborales en `schedule.workDays`
   * - Si `excludeHolidays` es `true`, los días festivos no contribuyen horas
   * - Si `excludeMeetings` es `true`, el tiempo de reuniones obligatorias se resta
   * - Las reuniones opcionales nunca se excluyen automáticamente
   * - El resultado puede tener decimales (ej: 7.5 horas por día con almuerzo de 30 min)
   *
   * @see {@link calculateEndDate} Para el cálculo inverso (de horas a fecha de finalización)
   *
   * @public
   */
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
