import { DayOfWeek, RoutineClass, ActiveRoutineTarget, FreeTimeSlot } from '@/types/schedule';
import { timeToMinutes, formatTime12 } from './time-utils';
import { TIMELINE_START_HOUR, TIMELINE_TOTAL_MINUTES } from './timeline-layout';
import { getFacultyByCode } from '@/data/faculty';
import { getSectionById } from '@/data/sections';

export const DAYS_ORDER: DayOfWeek[] = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
];

// Standard DIU academic class window: 08:30 AM (510 min) to 05:30 PM (1050 min)
export const ACADEMIC_DAY_START_MINUTES = 8 * 60 + 30; // 510 = 08:30 AM
export const ACADEMIC_DAY_END_MINUTES = 17 * 60 + 30;  // 1050 = 05:30 PM

/**
 * Returns clean short and full display labels for any target entity (Section or Faculty)
 */
export function getTargetLabel(target: ActiveRoutineTarget | null | undefined): {
  short: string;
  badge: string;
  full: string;
  type: 'section' | 'faculty';
} {
  if (!target) {
    return {
      short: 'None',
      badge: 'None',
      full: 'None',
      type: 'section',
    };
  }
  if (target.type === 'faculty') {
    return {
      short: target.faculty.code,
      badge: target.faculty.code,
      full: target.faculty.name,
      type: 'faculty',
    };
  }

  const subLabel = target.subSection !== 'all' ? ` • Lab ${target.subSection}` : '';
  return {
    short: `${target.section.id}${subLabel}`,
    badge: target.section.id,
    full: `${target.section.displayName}${subLabel}`,
    type: 'section',
  };
}

/**
 * Checks if two routine targets are identical
 */
export function areTargetsEqual(
  a: ActiveRoutineTarget | null | undefined,
  b: ActiveRoutineTarget | null | undefined
): boolean {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'faculty' && b.type === 'faculty') {
    return a.faculty.code.toUpperCase() === b.faculty.code.toUpperCase();
  }
  if (a.type === 'section' && b.type === 'section') {
    return a.section.id === b.section.id && a.subSection === b.subSection;
  }
  return false;
}

/**
 * Helper to convert minutes from midnight to "HH:mm" 24h string
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats a start and end minute range into a human-readable 12-hour string
 * e.g. (690, 780) -> "11:30 AM – 1:00 PM"
 */
export function formatMinutesRange(startMins: number, endMins: number): string {
  return `${formatTime12(minutesToTimeString(startMins))} – ${formatTime12(minutesToTimeString(endMins))}`;
}

/**
 * Calculates top percent and height percent on the 8 AM - 6 PM timeline grid
 */
export function getTimelinePercentForInterval(startMinutes: number, endMinutes: number): {
  topPercent: number;
  heightPercent: number;
} {
  const timelineStartMins = TIMELINE_START_HOUR * 60; // 480
  const clampedStart = Math.max(timelineStartMins, startMinutes);
  const clampedEnd = Math.min(timelineStartMins + TIMELINE_TOTAL_MINUTES, endMinutes);

  const topPercent = Math.max(0, ((clampedStart - timelineStartMins) / TIMELINE_TOTAL_MINUTES) * 100);
  const heightPercent = Math.max(1, ((clampedEnd - clampedStart) / TIMELINE_TOTAL_MINUTES) * 100);

  return { topPercent, heightPercent };
}

/**
 * Calculates common free windows between two class schedules across the academic week.
 * Only intervals of at least 30 minutes during official class hours (08:30 - 17:30) are returned.
 */
export function calculateSharedFreeTime(
  classesA: RoutineClass[],
  classesB: RoutineClass[],
  minDurationMinutes: number = 30
): Record<DayOfWeek, FreeTimeSlot[]> {
  const result: Record<DayOfWeek, FreeTimeSlot[]> = {
    SATURDAY: [],
    SUNDAY: [],
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
  };

  for (const day of DAYS_ORDER) {
    const dayClassesA = classesA.filter((c) => c.dayOfWeek === day);
    const dayClassesB = classesB.filter((c) => c.dayOfWeek === day);

    // Free slots on offdays or days with no classes for ANY group should not be shown.
    // It is an off day for that group rather than a mutual class break.
    if (dayClassesA.length === 0 || dayClassesB.length === 0) {
      result[day] = [];
      continue;
    }

    // 1. Gather all busy class intervals for both entities
    const rawIntervals: { start: number; end: number }[] = [];

    for (const c of dayClassesA) {
      const s = Math.max(ACADEMIC_DAY_START_MINUTES, timeToMinutes(c.startTime));
      const e = Math.min(ACADEMIC_DAY_END_MINUTES, timeToMinutes(c.endTime));
      if (e > s) rawIntervals.push({ start: s, end: e });
    }

    for (const c of dayClassesB) {
      const s = Math.max(ACADEMIC_DAY_START_MINUTES, timeToMinutes(c.startTime));
      const e = Math.min(ACADEMIC_DAY_END_MINUTES, timeToMinutes(c.endTime));
      if (e > s) rawIntervals.push({ start: s, end: e });
    }

    // 2. Sort and merge overlapping or contiguous busy intervals
    rawIntervals.sort((a, b) => a.start - b.start);
    const mergedBusy: { start: number; end: number }[] = [];
    let current = { ...rawIntervals[0] };

    for (let i = 1; i < rawIntervals.length; i++) {
      const next = rawIntervals[i];
      if (next.start <= current.end) {
        current.end = Math.max(current.end, next.end);
      } else {
        mergedBusy.push(current);
        current = { ...next };
      }
    }
    mergedBusy.push(current);

    // 3. Compute complement intervals (free windows)
    let pointer = ACADEMIC_DAY_START_MINUTES;
    const freeSlots: FreeTimeSlot[] = [];

    for (const busy of mergedBusy) {
      if (busy.start > pointer) {
        const duration = busy.start - pointer;
        if (duration >= minDurationMinutes) {
          freeSlots.push({
            dayOfWeek: day,
            startMinutes: pointer,
            endMinutes: busy.start,
            startTime: minutesToTimeString(pointer),
            endTime: minutesToTimeString(busy.start),
            durationMinutes: duration,
            formattedRange: formatMinutesRange(pointer, busy.start),
          });
        }
      }
      pointer = Math.max(pointer, busy.end);
    }

    // Check tail after the last class until end of academic day (17:30)
    if (pointer < ACADEMIC_DAY_END_MINUTES) {
      const duration = ACADEMIC_DAY_END_MINUTES - pointer;
      if (duration >= minDurationMinutes) {
        freeSlots.push({
          dayOfWeek: day,
          startMinutes: pointer,
          endMinutes: ACADEMIC_DAY_END_MINUTES,
          startTime: minutesToTimeString(pointer),
          endTime: minutesToTimeString(ACADEMIC_DAY_END_MINUTES),
          durationMinutes: duration,
          formattedRange: formatMinutesRange(pointer, ACADEMIC_DAY_END_MINUTES),
        });
      }
    }

    result[day] = freeSlots;
  }

  return result;
}

/**
 * Calculates total shared free hours across the week
 */
export function getTotalSharedFreeHours(freeSlotsMap: Record<DayOfWeek, FreeTimeSlot[]>): {
  totalMinutes: number;
  formattedHours: string;
  slotCount: number;
} {
  let totalMinutes = 0;
  let slotCount = 0;

  for (const day of DAYS_ORDER) {
    const slots = freeSlotsMap[day] || [];
    for (const s of slots) {
      totalMinutes += s.durationMinutes;
      slotCount++;
    }
  }

  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  return {
    totalMinutes,
    formattedHours: `${hours}h`,
    slotCount,
  };
}

/**
 * Parses a target string (e.g. from URL parameter "compare=MSR" or "compare=68_D" or "compare=section:68_D:1")
 */
export function parseTargetParam(param: string | null | undefined): ActiveRoutineTarget | null {
  if (!param) return null;
  const raw = param.trim();
  if (!raw) return null;

  if (raw.toLowerCase().startsWith('faculty:') || raw.toLowerCase().startsWith('teacher:')) {
    const code = raw.split(':')[1];
    const fac = getFacultyByCode(code);
    return fac ? { type: 'faculty', faculty: fac } : null;
  }

  if (raw.toLowerCase().startsWith('section:')) {
    const parts = raw.split(':');
    const secId = parts[1];
    const sub = (parts[2] === '1' || parts[2] === '2' ? parts[2] : 'all') as '1' | '2' | 'all';
    const sec = getSectionById(secId);
    return sec ? { type: 'section', section: sec, subSection: sub } : null;
  }

  // Auto-detect: faculty initial first
  const facultyHit = getFacultyByCode(raw);
  if (facultyHit) {
    return { type: 'faculty', faculty: facultyHit };
  }

  // Section with optional subsection e.g. "68_D", "68_D_1", or "68_D:1"
  const secParts = raw.split(/[:_]/);
  const secHit = getSectionById(raw) || (secParts.length >= 2 ? getSectionById(`${secParts[0]}_${secParts[1]}`) : null);
  if (secHit) {
    let sub: '1' | '2' | 'all' = 'all';
    if (raw.endsWith(':1') || raw.endsWith('-1')) sub = '1';
    if (raw.endsWith(':2') || raw.endsWith('-2')) sub = '2';
    return { type: 'section', section: secHit, subSection: sub };
  }

  return null;
}

/**
 * Encodes target into a clean URL parameter value
 */
export function targetToParamString(target: ActiveRoutineTarget): string {
  if (target.type === 'faculty') {
    return target.faculty.code;
  }
  if (target.subSection !== 'all') {
    return `${target.section.id}:${target.subSection}`;
  }
  return target.section.id;
}

export interface DayOffStatus {
  isOffDay: boolean;
  offEntity: 'none' | 'both' | 'primary' | 'secondary';
  label: string;
}

/**
 * Returns precise off-day information for a given day across primary and optional compared routine
 */
export function getDayOffStatus(
  day: DayOfWeek,
  classesPrimary: RoutineClass[],
  classesSecondary: RoutineClass[],
  isComparing: boolean,
  primaryTarget?: ActiveRoutineTarget | null,
  secondaryTarget?: ActiveRoutineTarget | null
): DayOffStatus {
  const pClasses = classesPrimary.filter((c) => c.dayOfWeek === day);
  const pLabel = primaryTarget ? getTargetLabel(primaryTarget).badge : 'Class';

  if (!isComparing) {
    if (pClasses.length === 0) {
      return {
        isOffDay: true,
        offEntity: 'primary',
        label: `Off day for ${pLabel}`,
      };
    }
    return {
      isOffDay: false,
      offEntity: 'none',
      label: '',
    };
  }

  const sClasses = classesSecondary.filter((c) => c.dayOfWeek === day);
  const sLabel = secondaryTarget ? getTargetLabel(secondaryTarget).badge : 'Compared Class';

  if (pClasses.length === 0 && sClasses.length === 0) {
    return {
      isOffDay: true,
      offEntity: 'both',
      label: `Off day for ${pLabel} & ${sLabel}`,
    };
  }
  if (pClasses.length === 0) {
    return {
      isOffDay: true,
      offEntity: 'primary',
      label: `Off day for ${pLabel}`,
    };
  }
  if (sClasses.length === 0) {
    return {
      isOffDay: true,
      offEntity: 'secondary',
      label: `Off day for ${sLabel}`,
    };
  }

  return {
    isOffDay: false,
    offEntity: 'none',
    label: '',
  };
}

