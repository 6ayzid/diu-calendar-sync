import { DayOfWeek } from '@/types/schedule';

/**
 * Converts a 24-hour time string ("08:30", "13:00", "14:30") to 12-hour format ("8:30 AM", "1:00 PM", "2:30 PM").
 */
export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.trim().split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const m = mStr ? mStr.padStart(2, '0') : '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

/**
 * Returns total minutes from midnight for a time string (e.g. "08:30" -> 510).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.trim().split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

export interface DhakaClockState {
  day: DayOfWeek | null;
  isFriday: boolean;
  totalMinutes: number; // Minute with fractional second (e.g. 645.5 = 10:45:30)
  minuteInt: number;    // Integer minutes from midnight
  formatted12: string;  // e.g. "6:38 PM"
  formatted24: string;  // e.g. "18:38"
}

const DHAKA_DAY_MAP: Record<string, DayOfWeek> = {
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
};

/**
 * Computes minute-precise Bangladesh Standard Time (Asia/Dhaka, UTC+6).
 */
export function getDhakaClock(): DhakaClockState {
  try {
    const now = new Date();
    const parts12 = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).formatToParts(now);

    const parts24 = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const weekday = parts12.find((p) => p.type === 'weekday')?.value?.toUpperCase() || '';
    const h12 = parts12.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts12.find((p) => p.type === 'minute')?.value?.padStart(2, '0') || '00';
    const second = parts12.find((p) => p.type === 'second')?.value?.padStart(2, '0') || '00';
    const dayPeriod = parts12.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || 'AM';

    const h24 = parseInt(parts24.find((p) => p.type === 'hour')?.value || '0', 10);
    const mNum = parseInt(minute, 10);
    const sNum = parseInt(second, 10);

    return {
      day: DHAKA_DAY_MAP[weekday] || null,
      isFriday: weekday === 'FRIDAY',
      totalMinutes: h24 * 60 + mNum + sNum / 60,
      minuteInt: h24 * 60 + mNum,
      formatted12: `${h12}:${minute} ${dayPeriod}`,
      formatted24: `${String(h24).padStart(2, '0')}:${minute}`,
    };
  } catch {
    return {
      day: null,
      isFriday: false,
      totalMinutes: 0,
      minuteInt: 0,
      formatted12: '',
      formatted24: '',
    };
  }
}

export interface UpcomingDay {
  dayKey: DayOfWeek | 'FRIDAY';
  dayLabel: string;
  dayShort: string;
  dayNumber: string;
  monthShort: string;
  monthLong: string;
  formattedDate: string;
  fullFormatted: string;
  isToday: boolean;
  isTomorrow: boolean;
  isFriday: boolean;
  relativeLabel: string;
}

export interface WeekScheduleDay {
  dayKey: DayOfWeek;
  dayLabel: string;
  dayShort: string;
  dayNumber: string;
  monthShort: string;
  monthLong: string;
  year: number;
  formattedDate: string;
  fullFormatted: string;
  isToday: boolean;
}

/**
 * Returns the 6 academic days (Saturday to Thursday) of the current week in Asia/Dhaka.
 */
export function getCurrentWeekScheduleDays(): WeekScheduleDay[] {
  try {
    const now = new Date();
    const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // "YYYY-MM-DD"

    const [year, month, day] = dhakaDateStr.split('-').map(Number);
    const todayDhaka = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    const weekdayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
    }).format(todayDhaka); // "Sat", "Sun", "Mon", etc.

    const dayOffsets: Record<string, number> = {
      Sat: 0,
      Sun: 1,
      Mon: 2,
      Tue: 3,
      Wed: 4,
      Thu: 5,
      Fri: 6,
    };
    const offsetFromSat = dayOffsets[weekdayStr] ?? 0;
    const saturdayMs = todayDhaka.getTime() - offsetFromSat * 24 * 60 * 60 * 1000;

    const daysOfWeek: DayOfWeek[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

    return daysOfWeek.map((dayKey, i) => {
      const stepDate = new Date(saturdayMs + i * 24 * 60 * 60 * 1000);
      const dayNum = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
      }).format(stepDate);

      const monthShort = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
      }).format(stepDate);

      const monthLong = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'long',
      }).format(stepDate);

      const stepYear = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', year: 'numeric' }).format(stepDate),
        10
      );

      const weekdayLong = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
      }).format(stepDate);

      const isToday = offsetFromSat === i && weekdayStr !== 'Fri';

      return {
        dayKey,
        dayLabel: weekdayLong,
        dayShort: weekdayLong.slice(0, 3),
        dayNumber: dayNum,
        monthShort,
        monthLong,
        year: stepYear,
        formattedDate: `${monthShort} ${dayNum}`,
        fullFormatted: `${weekdayLong}, ${monthShort} ${dayNum}`,
        isToday,
      };
    });
  } catch {
    const fallbacks: DayOfWeek[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];
    return fallbacks.map((k) => ({
      dayKey: k,
      dayLabel: k.charAt(0) + k.slice(1).toLowerCase(),
      dayShort: k.slice(0, 3),
      dayNumber: '1',
      monthShort: 'Sep',
      monthLong: 'September',
      year: 2026,
      formattedDate: 'Sep 1',
      fullFormatted: `${k.charAt(0) + k.slice(1).toLowerCase()}, Sep 1`,
      isToday: false,
    }));
  }
}

/**
 * Returns the upcoming rolling days (default 7 days) starting from today in Asia/Dhaka.
 */
export function getUpcomingDays(count = 7): UpcomingDay[] {
  try {
    const result: UpcomingDay[] = [];
    const now = new Date();

    const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // "YYYY-MM-DD"

    const [year, month, day] = dhakaDateStr.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    for (let i = 0; i < count; i++) {
      const stepDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);

      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
      }).format(stepDate).toUpperCase();

      const monthShort = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
      }).format(stepDate);

      const monthLong = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'long',
      }).format(stepDate);

      const dayNum = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
      }).format(stepDate);

      const isToday = i === 0;
      const isTomorrow = i === 1;
      const isFriday = weekday === 'FRIDAY';
      const dayLabel = weekday.charAt(0) + weekday.slice(1).toLowerCase();

      const relativeLabel = isToday
        ? 'Today'
        : isTomorrow
        ? 'Tomorrow'
        : dayLabel;

      result.push({
        dayKey: weekday as DayOfWeek | 'FRIDAY',
        dayLabel,
        dayShort: weekday.slice(0, 3),
        dayNumber: dayNum,
        monthShort,
        monthLong,
        formattedDate: `${monthShort} ${dayNum}`,
        fullFormatted: `${dayLabel}, ${monthShort} ${dayNum}`,
        isToday,
        isTomorrow,
        isFriday,
        relativeLabel,
      });
    }

    return result;
  } catch {
    return [];
  }
}


