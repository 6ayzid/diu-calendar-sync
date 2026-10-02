import { DayOfWeek } from './schedule';

export type EventOverrideType =
  | 'quiz'
  | 'ct'
  | 'assignment'
  | 'presentation'
  | 'cancelled'
  | 'rescheduled'
  | 'makeup'
  | 'custom';

export interface ClassEventOverride {
  id: string;
  sectionId: string;       // e.g. "66_O"
  date: string;            // "2026-10-08" (YYYY-MM-DD)
  dayOfWeek?: DayOfWeek;   // e.g. "THURSDAY"
  startTime?: string;      // e.g. "13:00" (HH:mm)
  endTime?: string;        // e.g. "14:30" (HH:mm)
  courseCode: string;      // e.g. "CSE326"
  type: EventOverrideType;
  title: string;           // e.g. "Quiz 1"
  description?: string;    // e.g. "Social & Ethics (CSE326) Class Quiz. Room KT-223."
  room?: string;           // e.g. "KT-223"
  status?: 'CONFIRMED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}
