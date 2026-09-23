import { DayOfWeek, RoutineClass } from '@/types/schedule';
import { timeToMinutes, formatTime12 } from './time-utils';
import { getFacultyByCode } from '@/data/faculty';
import { getCourseName } from './courses';

export interface DayGap {
  start: string;
  end: string;
  durationMinutes: number;
  formattedDuration: string;
  isLongGap: boolean;
}

export interface DayWorkload {
  day: DayOfWeek;
  dayLabel: string;
  dayShort: string;
  isOffDay: boolean;
  classCount: number;
  totalMinutes: number;
  formattedHours: string;
  earliestClass?: string;
  latestClass?: string;
  spanMinutes: number;
  formattedSpan: string;
  gaps: DayGap[];
  loadLevel: 'off' | 'light' | 'moderate' | 'heavy' | 'overloaded';
  classes: RoutineClass[];
}

export interface TeacherCourseSlot {
  day: DayOfWeek;
  dayShort: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface TeacherCourseItem {
  courseCode: string;
  courseTitle: string;
  type: 'Theory' | 'Lab';
  slots: TeacherCourseSlot[];
}

export interface SectionTeacherItem {
  teacherCode: string;
  teacherName: string;
  designation?: string;
  room?: string;
  email?: string;
  phone?: string;
  courses: TeacherCourseItem[];
}

export interface RoutineHighlight {
  type: 'pro' | 'con' | 'info';
  text: string;
}

export interface RoutineQualityAnalysis {
  score: number; // 0 to 100
  grade: 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  gradeColor: 'emerald' | 'blue' | 'amber' | 'rose';

  // Key totals
  totalClasses: number;
  totalMinutes: number;
  totalHours: string;
  activeDaysCount: number;
  offDaysCount: number;
  offDays: DayOfWeek[];

  // Dead time & gaps
  totalGapMinutes: number;
  totalGapHours: string;
  longGapsCount: number;
  maxGapMinutes: number;
  maxGapDetail?: {
    day: DayOfWeek;
    start: string;
    end: string;
    formattedDuration: string;
  };

  // Timings
  earliestStart: string;
  latestEnd: string;
  earlyMorningStartsCount: number;

  // Workload extremes
  heaviestDay?: {
    day: DayOfWeek;
    classCount: number;
    totalMinutes: number;
    formattedHours: string;
  };

  // Days breakdown (Saturday to Thursday)
  dailyWorkload: DayWorkload[];

  // Bullet insights
  highlights: RoutineHighlight[];

  // Teachers teaching this section
  teachers: SectionTeacherItem[];
}

const WEEK_DAYS: { day: DayOfWeek; label: string; short: string }[] = [
  { day: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { day: 'SUNDAY', label: 'Sunday', short: 'Sun' },
  { day: 'MONDAY', label: 'Monday', short: 'Mon' },
  { day: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { day: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { day: 'THURSDAY', label: 'Thursday', short: 'Thu' },
];

const DAY_SHORT_MAP: Record<DayOfWeek, string> = {
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
};

function formatDurationMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Evaluates routine quality metrics, dead gaps, off days, and daily workload distribution.
 * Also extracts all teachers taking classes with their courses and rooms.
 */
export function analyzeRoutineQuality(
  classes: RoutineClass[],
  targetSubSection: '1' | '2' | 'all' = 'all'
): RoutineQualityAnalysis {
  // If target is 'all', filter for SubSection 1 perspective to model a student's real schedule
  // without double-counting overlapping Lab 1 and Lab 2 slots.
  const studentClasses =
    targetSubSection === '2'
      ? classes.filter((c) => !c.subSection || c.subSection === '2')
      : classes.filter((c) => !c.subSection || c.subSection === '1');

  const dailyWorkload: DayWorkload[] = [];
  const offDays: DayOfWeek[] = [];

  let totalClassesCount = 0;
  let totalClassMinutes = 0;
  let totalGapMinutes = 0;
  let longGapsCount = 0;
  let maxGapMinutes = 0;
  let maxGapDetail: RoutineQualityAnalysis['maxGapDetail'] = undefined;
  let earlyMorningStartsCount = 0;
  let globalEarliestStartMinutes = 24 * 60;
  let globalLatestEndMinutes = 0;
  let globalEarliestStart = '08:30';
  let globalLatestEnd = '16:00';

  let heaviestDayCandidate: RoutineQualityAnalysis['heaviestDay'] = undefined;

  for (const { day, label, short } of WEEK_DAYS) {
    const dayClasses = studentClasses
      .filter((c) => c.dayOfWeek === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (dayClasses.length === 0) {
      offDays.push(day);
      dailyWorkload.push({
        day,
        dayLabel: label,
        dayShort: short,
        isOffDay: true,
        classCount: 0,
        totalMinutes: 0,
        formattedHours: '0h',
        spanMinutes: 0,
        formattedSpan: '0h',
        gaps: [],
        loadLevel: 'off',
        classes: [],
      });
      continue;
    }

    totalClassesCount += dayClasses.length;

    let dayClassMinutes = 0;
    const dayGaps: DayGap[] = [];

    // Calculate class minutes
    for (const c of dayClasses) {
      const s = timeToMinutes(c.startTime);
      const e = timeToMinutes(c.endTime);
      dayClassMinutes += Math.max(0, e - s);

      if (s < globalEarliestStartMinutes) {
        globalEarliestStartMinutes = s;
        globalEarliestStart = c.startTime;
      }
      if (e > globalLatestEndMinutes) {
        globalLatestEndMinutes = e;
        globalLatestEnd = c.endTime;
      }
    }

    totalClassMinutes += dayClassMinutes;

    // Check early start (8:30 AM or earlier)
    const firstClassStart = timeToMinutes(dayClasses[0].startTime);
    if (firstClassStart <= 510) {
      earlyMorningStartsCount++;
    }

    const lastClassEnd = timeToMinutes(dayClasses[dayClasses.length - 1].endTime);
    const daySpanMinutes = Math.max(0, lastClassEnd - firstClassStart);

    // Calculate gaps between consecutive classes
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const prevEnd = timeToMinutes(dayClasses[i].endTime);
      const nextStart = timeToMinutes(dayClasses[i + 1].startTime);
      const gapMins = nextStart - prevEnd;

      if (gapMins > 0) {
        totalGapMinutes += gapMins;
        const isLong = gapMins >= 90; // 1.5 hours or more
        if (isLong) longGapsCount++;

        const formatted = formatDurationMinutes(gapMins);
        dayGaps.push({
          start: dayClasses[i].endTime,
          end: dayClasses[i + 1].startTime,
          durationMinutes: gapMins,
          formattedDuration: formatted,
          isLongGap: isLong,
        });

        if (gapMins > maxGapMinutes) {
          maxGapMinutes = gapMins;
          maxGapDetail = {
            day,
            start: dayClasses[i].endTime,
            end: dayClasses[i + 1].startTime,
            formattedDuration: formatted,
          };
        }
      }
    }

    // Determine load level
    let loadLevel: DayWorkload['loadLevel'] = 'moderate';
    if (dayClassMinutes >= 330 || dayClasses.length >= 4) {
      loadLevel = 'overloaded';
    } else if (dayClassMinutes >= 240 || dayClasses.length === 3) {
      loadLevel = 'heavy';
    } else if (dayClassMinutes <= 90) {
      loadLevel = 'light';
    }

    // Check heaviest day
    if (
      !heaviestDayCandidate ||
      dayClassMinutes > heaviestDayCandidate.totalMinutes ||
      (dayClassMinutes === heaviestDayCandidate.totalMinutes &&
        dayClasses.length > heaviestDayCandidate.classCount)
    ) {
      heaviestDayCandidate = {
        day,
        classCount: dayClasses.length,
        totalMinutes: dayClassMinutes,
        formattedHours: `${(dayClassMinutes / 60).toFixed(1)}h`,
      };
    }

    dailyWorkload.push({
      day,
      dayLabel: label,
      dayShort: short,
      isOffDay: false,
      classCount: dayClasses.length,
      totalMinutes: dayClassMinutes,
      formattedHours: `${(dayClassMinutes / 60).toFixed(1)}h`,
      earliestClass: dayClasses[0].startTime,
      latestClass: dayClasses[dayClasses.length - 1].endTime,
      spanMinutes: daySpanMinutes,
      formattedSpan: formatDurationMinutes(daySpanMinutes),
      gaps: dayGaps,
      loadLevel,
      classes: dayClasses,
    });
  }

  const offDaysCount = offDays.length;
  const activeDaysCount = 6 - offDaysCount;

  // -------------------------------------------------------------
  // Scoring Model (Base 70, adjust for off-days, gaps, workload)
  // -------------------------------------------------------------
  let score = 70;

  // Off Days impact
  if (offDaysCount >= 3) score += 20;
  else if (offDaysCount === 2) score += 15;
  else if (offDaysCount === 1) score += 7;
  else score -= 12; // 0 off-days is draining

  // Gaps impact
  if (totalGapMinutes === 0 && totalClassesCount > 0) {
    score += 12; // 100% compact
  } else if (longGapsCount === 0 && totalGapMinutes <= 60) {
    score += 6; // only short breaks
  } else {
    score -= longGapsCount * 6; // -6 per long gap
    if (totalGapMinutes >= 180) score -= 8; // high dead time
  }

  // Early 8:30 AM starts impact
  if (earlyMorningStartsCount === 0) {
    score += 8; // Sleep-in friendly
  } else if (earlyMorningStartsCount === 1) {
    score += 2;
  } else if (earlyMorningStartsCount >= 3) {
    score -= 7;
  }

  // Daily balance
  const hasOverloadedDay = dailyWorkload.some((d) => d.loadLevel === 'overloaded');
  if (hasOverloadedDay) {
    score -= 8;
  } else if (heaviestDayCandidate && heaviestDayCandidate.totalMinutes <= 210) {
    score += 6; // well distributed
  }

  // Clamp score
  const finalScore = Math.max(25, Math.min(98, Math.round(score)));

  let grade: RoutineQualityAnalysis['grade'] = 'B';
  let gradeLabel = 'Well Balanced';
  let gradeColor: RoutineQualityAnalysis['gradeColor'] = 'blue';

  if (finalScore >= 88) {
    grade = 'A';
    gradeLabel = 'Excellent Schedule';
    gradeColor = 'emerald';
  } else if (finalScore >= 75) {
    grade = 'B';
    gradeLabel = 'Well Balanced';
    gradeColor = 'blue';
  } else if (finalScore >= 60) {
    grade = 'C';
    gradeLabel = 'Moderate Routine';
    gradeColor = 'amber';
  } else {
    grade = 'D';
    gradeLabel = 'Demanding Routine';
    gradeColor = 'rose';
  }

  // -------------------------------------------------------------
  // Dynamic Highlights (Pros & Cons)
  // -------------------------------------------------------------
  const highlights: RoutineHighlight[] = [];

  // Off days highlights
  if (offDaysCount >= 2) {
    highlights.push({
      type: 'pro',
      text: `${offDaysCount} Off Days (${offDays.map((d) => DAY_SHORT_MAP[d]).join(', ')})`,
    });
  } else if (offDaysCount === 1) {
    highlights.push({
      type: 'pro',
      text: `1 Off Day (${DAY_SHORT_MAP[offDays[0]]})`,
    });
  } else {
    highlights.push({
      type: 'con',
      text: '6-day academic week (No off days)',
    });
  }

  // Gaps highlights
  if (totalGapMinutes === 0 && totalClassesCount > 0) {
    highlights.push({
      type: 'pro',
      text: 'Zero dead gaps (Back-to-back classes)',
    });
  } else if (longGapsCount === 0 && totalGapMinutes <= 90) {
    highlights.push({
      type: 'pro',
      text: 'Compact schedule (Short breaks only, no long gaps)',
    });
  } else if (maxGapDetail) {
    highlights.push({
      type: 'con',
      text: `${maxGapDetail.formattedDuration} gap on ${DAY_SHORT_MAP[maxGapDetail.day]} (${formatTime12(maxGapDetail.start)} – ${formatTime12(maxGapDetail.end)})`,
    });
  }

  // Early mornings
  if (earlyMorningStartsCount === 0 && totalClassesCount > 0) {
    highlights.push({
      type: 'pro',
      text: `No 8:30 AM early morning starts (starts ${formatTime12(globalEarliestStart)} or later)`,
    });
  } else if (earlyMorningStartsCount >= 3) {
    highlights.push({
      type: 'con',
      text: `${earlyMorningStartsCount}x early 8:30 AM morning classes`,
    });
  }

  // Workload highlights
  if (heaviestDayCandidate && heaviestDayCandidate.classCount >= 4) {
    highlights.push({
      type: 'con',
      text: `Heavy load on ${DAY_SHORT_MAP[heaviestDayCandidate.day]} (${heaviestDayCandidate.classCount} classes, ${heaviestDayCandidate.formattedHours})`,
    });
  } else if (!hasOverloadedDay && activeDaysCount >= 3) {
    highlights.push({
      type: 'pro',
      text: 'Evenly distributed daily workload',
    });
  }

  // Timings
  if (globalLatestEndMinutes <= 930 && totalClassesCount > 0) {
    highlights.push({
      type: 'pro',
      text: `Early dismissal (All classes done by ${formatTime12(globalLatestEnd)})`,
    });
  } else if (globalLatestEndMinutes >= 1050) {
    highlights.push({
      type: 'info',
      text: `Late afternoon / evening classes up to ${formatTime12(globalLatestEnd)}`,
    });
  }

  // -------------------------------------------------------------
  // Teachers Taking Classes Breakdown
  // -------------------------------------------------------------
  const teacherMap = new Map<string, SectionTeacherItem>();

  for (const c of classes) {
    const rawTeacher = (c.teacherCode || '').trim().toUpperCase();
    if (!rawTeacher || rawTeacher === 'TBA' || rawTeacher === 'NONE') continue;

    const cleanCourse = c.courseCode.split('(')[0].trim();
    const courseTitle = c.courseTitle || getCourseName(cleanCourse);

    if (!teacherMap.has(rawTeacher)) {
      const fac = getFacultyByCode(rawTeacher);
      teacherMap.set(rawTeacher, {
        teacherCode: rawTeacher,
        teacherName: fac?.name || c.teacherName || rawTeacher,
        designation: fac?.designation,
        room: fac?.room || (c.room ? c.room.split('(')[0].trim() : undefined),
        email: fac?.email,
        phone: fac?.phone,
        courses: [],
      });
    }

    const teacherEntry = teacherMap.get(rawTeacher)!;

    let courseEntry = teacherEntry.courses.find((item) => item.courseCode === cleanCourse);
    if (!courseEntry) {
      courseEntry = {
        courseCode: cleanCourse,
        courseTitle,
        type: c.type || (cleanCourse.includes('Lab') ? 'Lab' : 'Theory'),
        slots: [],
      };
      teacherEntry.courses.push(courseEntry);
    }

    // Add slot if not duplicate
    const slotExists = courseEntry.slots.some(
      (s) => s.day === c.dayOfWeek && s.startTime === c.startTime
    );
    if (!slotExists) {
      courseEntry.slots.push({
        day: c.dayOfWeek,
        dayShort: DAY_SHORT_MAP[c.dayOfWeek] || c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        room: c.room.split('(')[0].trim(),
      });
    }
  }

  const teachersList = Array.from(teacherMap.values()).sort((a, b) =>
    a.teacherName.localeCompare(b.teacherName)
  );

  return {
    score: finalScore,
    grade,
    gradeLabel,
    gradeColor,
    totalClasses: totalClassesCount,
    totalMinutes: totalClassMinutes,
    totalHours: `${(totalClassMinutes / 60).toFixed(1)}h`,
    activeDaysCount,
    offDaysCount,
    offDays,
    totalGapMinutes,
    totalGapHours: `${(totalGapMinutes / 60).toFixed(1)}h`,
    longGapsCount,
    maxGapMinutes,
    maxGapDetail,
    earliestStart: globalEarliestStart,
    latestEnd: globalLatestEnd,
    earlyMorningStartsCount,
    heaviestDay: heaviestDayCandidate,
    dailyWorkload,
    highlights,
    teachers: teachersList,
  };
}
