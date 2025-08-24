export interface WorkSchedule {
  startTime: string; // "08:30"
  endTime: string; // "17:30"
  lunchStart: string; // "13:00"
  lunchEnd: string; // "14:00"
  workDays: number[]; // [1,2,3,4,5] (0=Sunday, 1=Monday, etc)
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
  country: string;
  global: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isOptional: boolean;
}

export interface TaskCalculation {
  estimatedHours: number;
  startDate: Date;
  endDate?: Date;
  excludeHolidays: boolean;
  excludeMeetings: boolean;
  excludedMeetingIds?: string[]; // IDs de eventos específicamente excluidos
  excludedHolidayDates?: string[]; // Fechas de feriados específicamente excluidos (formato: "YYYY-MM-DD")
  holidays: Holiday[];
  meetings: Meeting[];
}

export interface CalculationResult {
  startDate: Date;
  endDate: Date;
  workingDays: number;
  actualWorkingHours: number;
  holidaysExcluded: Holiday[];
  meetingsExcluded: Meeting[];
}
