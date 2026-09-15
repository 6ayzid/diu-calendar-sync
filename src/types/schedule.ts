export type DayOfWeek =
  | 'SATURDAY'
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY';

export type ClassType = 'Theory' | 'Lab';

export interface RoutineClass {
  id: string;
  batch: string;          // e.g. "68"
  section: string;        // e.g. "D"
  sectionId: string;      // e.g. "68_D"
  subSection?: '1' | '2' | null; // e.g. '1' for D1, '2' for D2, null for all
  courseCode: string;     // e.g. "CSE228"
  courseTitle: string;    // e.g. "Software Engineering"
  teacherCode: string;    // e.g. "MIS"
  teacherName?: string;
  room: string;           // e.g. "KT-201" or "G1-002 (COM LAB)"
  dayOfWeek: DayOfWeek;
  startTime: string;      // e.g. "08:30" (24h or HH:mm)
  endTime: string;        // e.g. "10:00"
  type: ClassType;
  color?: string;         // optional UI accent
}

export interface SectionMeta {
  id: string;             // e.g. "68_D"
  batch: string;          // e.g. "Batch 68"
  batchNumber: number;    // e.g. 68
  sectionLetter: string;  // e.g. "D"
  displayName: string;    // e.g. "Batch 68 - Section D"
  hasSubSections: boolean;// true
  subSections: string[];  // ["D1", "D2"]
  classCount?: number;
}

export interface CalendarFeedOptions {
  sectionId: string;
  subSection?: '1' | '2' | 'all' | null; // filter by subSection 1 or 2
  timezone?: string;                     // defaults to 'Asia/Dhaka'
  includeAlarms?: boolean;
}
