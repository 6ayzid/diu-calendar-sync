import ical, {
  ICalAlarmType,
  ICalCalendar,
  ICalEventRepeatingFreq,
  ICalWeekday,
} from 'ical-generator';
import { DayOfWeek, RoutineClass, FacultyMeta } from '@/types/schedule';
import { ClassEventOverride } from '@/types/events';
import { getSectionById } from '@/data/sections';
import { getFacultyByCode } from '@/data/faculty';
import { getCourseShortTitle } from '@/lib/course-utils';
import { COURSE_CATALOG } from '@/lib/courses';

// First occurrence dates of the semester effective week (Effective: Sept 09, 2026)
const WEEKDAY_DATE_MAP: Record<DayOfWeek, string> = {
  WEDNESDAY: '2026-09-09',
  THURSDAY: '2026-09-10',
  SATURDAY: '2026-09-12',
  SUNDAY: '2026-09-13',
  MONDAY: '2026-09-14',
  TUESDAY: '2026-09-15',
};

const ICAL_WEEKDAY_MAP: Record<DayOfWeek, ICalWeekday> = {
  SATURDAY: ICalWeekday.SA,
  SUNDAY: ICalWeekday.SU,
  MONDAY: ICalWeekday.MO,
  TUESDAY: ICalWeekday.TU,
  WEDNESDAY: ICalWeekday.WE,
  THURSDAY: ICalWeekday.TH,
};

// RFC 5545 standard VTIMEZONE block for Asia/Dhaka (UTC+6, no DST)
const DHAKA_VTIMEZONE = `BEGIN:VTIMEZONE
TZID:Asia/Dhaka
LAST-MODIFIED:20260101T000000Z
TZURL:http://tzurl.org/zoneinfo-outlook/Asia/Dhaka
X-LIC-LOCATION:Asia/Dhaka
BEGIN:STANDARD
TZNAME:BST
TZOFFSETFROM:+0600
TZOFFSETTO:+0600
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE`;

// End of Semester (Fall/Autumn term ending Jan 31, 2027, in UTC for RFC 5545 UNTIL compliance)
const SEMESTER_END_DATE = new Date(Date.UTC(2027, 0, 31, 17, 59, 59));

export interface BuildCalendarOptions {
  sectionId?: string;
  subSection?: '1' | '2' | 'all' | null;
  faculty?: FacultyMeta;
  timezone?: string;
  sourceDomain?: string;
  routineVersion?: string;
  overrides?: ClassEventOverride[];
}

/**
 * Builds an RFC 5545 compliant iCalendar feed from routine classes.
 * 
 * Key Specifications:
 * - Timezone: Asia/Dhaka (UTC+6)
 * - Deterministic UID: Allows calendar clients (Google, Apple, Outlook) to update existing
 *   events on auto-refresh instead of creating duplicates.
 * - Auto-Refresh TTL: 1 hour (PT1H) published header for compatible client sync.
 */
export function buildCalendarFeed(
  classes: RoutineClass[],
  options: BuildCalendarOptions
): ICalCalendar {
  const {
    sectionId,
    subSection,
    faculty,
    timezone = 'Asia/Dhaka',
    sourceDomain = 'schedule.campus.edu',
    routineVersion = 'v2.2',
    overrides = [],
  } = options;

  let calendarName = 'DIU Routine';
  let calendarDesc = 'DIU CSE Class Schedule Feed';

  if (faculty) {
    calendarName = `DIU Routine — ${faculty.code}`;
    calendarDesc = `Teaching routine for ${faculty.name} (${faculty.code}), Dept. of CSE, DIU.`;
  } else if (sectionId) {
    const sectionMeta = getSectionById(sectionId);
    let subLabel = '';
    if (subSection === '1') {
      const letter = sectionMeta?.sectionLetter || sectionId.split('_')[1] || '';
      subLabel = ` (${letter}1)`;
    } else if (subSection === '2') {
      const letter = sectionMeta?.sectionLetter || sectionId.split('_')[1] || '';
      subLabel = ` (${letter}2)`;
    }
    calendarName = `DIU Routine — ${sectionId}${subLabel}`;
    calendarDesc = `Class routine feed for ${sectionId}${subLabel}, Dept. of CSE, DIU.`;
  }

  // Do not set timezone on the top-level calendar options, because ical-generator
  // strips the mandatory 'Z' from DTSTAMP and RRULE:UNTIL when top-level timezone is present.
  // Instead, we set timezone on each event and inject the RFC 5545 VTIMEZONE component into the serialized output.
  const calendar = ical({
    name: calendarName,
    description: calendarDesc,
    ttl: 3600, // 1 hour refresh interval (X-PUBLISHED-TTL:PT1H & REFRESH-INTERVAL)
    prodId: {
      company: 'DIU CSE (@6ayzid)',
      product: 'Routine Feed Generator',
      language: 'EN',
    },
  });

  const verMatch = routineVersion.match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
  const formattedVersion = verMatch ? `v${verMatch[1]}` : (routineVersion.startsWith('v') ? routineVersion : `v${routineVersion}`);

  for (const item of classes) {
    const baseDate = WEEKDAY_DATE_MAP[item.dayOfWeek];
    if (!baseDate) continue;

    // Parse date and time into individual components:
    // e.g. baseDate = "2026-09-15", item.startTime = "08:30"
    const [year, month, day] = baseDate.split('-').map(Number);
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);

    // Using new Date(year, monthIndex, day, hour, min):
    // In ical-generator, when timezone is set on the event, it calls m.getHours() and m.getMinutes().
    // new Date(year, month-1, day, hour, min) ensures getHours() === hour and getMinutes() === min
    // on ALL runtime environments (local Node, Docker, or Vercel serverless running in UTC).
    const startDate = new Date(year, month - 1, day, startH, startM, 0);
    const endDate = new Date(year, month - 1, day, endH, endM, 0);

    // Deterministic UID:
    // Consistent across routine changes for identical slots so calendar engines replace/update in-place
    const subIdentifier = item.subSection ? `sub${item.subSection}` : 'common';
    const cleanCourseCode = item.courseCode.split('(')[0].trim().toUpperCase();
    const cleanRoom = item.room.split('(')[0].trim();
    const sectionBadge = item.sectionId
      ? (item.subSection ? `${item.sectionId}${item.subSection}` : item.sectionId)
      : (item.batch && item.section ? `${item.batch}_${item.section}` : 'All');

    const deterministicUid = faculty
      ? `slot-faculty-${faculty.code}-${cleanCourseCode}-${sectionBadge}-${item.dayOfWeek}-${item.startTime.replace(':', '')}@${sourceDomain}`
      : `slot-${item.sectionId}-${item.courseCode.replace(/[^a-zA-Z0-9]/g, '')}-${subIdentifier}-${item.dayOfWeek}-${item.startTime.replace(':', '')}@${sourceDomain}`;

    // 1. Title format: Site short title then course code. Nothing else.
    // e.g., "SAD (CSE227)" or "SAD CSE227"
    const isLab = item.type === 'Lab' || item.courseCode.toLowerCase().includes('lab') || item.courseTitle.toLowerCase().includes('lab');
    const siteTitle = getCourseShortTitle(cleanCourseCode, item.courseTitle, isLab);
    const summary = `${siteTitle} (${cleanCourseCode})`;

    // 2. Instructor display: Instructor name should be first in description
    const teacherMeta = item.teacherCode ? getFacultyByCode(item.teacherCode) : undefined;
    const instructorName = teacherMeta
      ? `${teacherMeta.name} (${item.teacherCode})`
      : item.teacherName
      ? `${item.teacherName} (${item.teacherCode})`
      : item.teacherCode || (faculty ? `${faculty.name} (${faculty.code})` : 'TBA');

    // 3. Full course title
    const catalogEntry = COURSE_CATALOG[cleanCourseCode];
    const fullCourseTitle = (item.courseTitle && !item.courseTitle.toLowerCase().endsWith('course'))
      ? item.courseTitle
      : catalogEntry?.name || item.courseTitle || cleanCourseCode;

    const sectionDisplay = item.subSection
      ? `${item.sectionId} (Subsection ${item.section || ''}${item.subSection})`
      : item.sectionId || sectionBadge;

    // 4. Description block structure:
    // Instructor name first, followed by full course title, then details, routine version, and synced line
    const description = [
      `Instructor: ${instructorName}`,
      `Course: ${fullCourseTitle} (${cleanCourseCode})`,
      `Section: ${sectionDisplay}`,
      `Room: ${item.room}`,
      `Type: ${item.type}`,
      `Routine Version: ${formattedVersion}`,
      ``,
      `synced from diucal.vercel.app`,
    ].join('\n');

    const event = calendar.createEvent({
      id: deterministicUid,
      start: startDate,
      end: endDate,
      timezone,
      summary,
      description,
      location: item.room,
      repeating: {
        freq: ICalEventRepeatingFreq.WEEKLY,
        byDay: [ICAL_WEEKDAY_MAP[item.dayOfWeek]],
        until: SEMESTER_END_DATE,
      },
    });

    // 15-minute popup notification
    event.createAlarm({
      type: ICalAlarmType.display,
      trigger: 900, // 15 mins
      description: `Class Reminder: ${cleanCourseCode} in Room ${cleanRoom}`,
    });
  }

  // Process Event Overrides (e.g. Quizzes, class tests, assignments, cancellations, makeup classes)
  if (overrides && overrides.length > 0) {
    for (const override of overrides) {
      if (override.status === 'CANCELLED') continue;

      const [oYear, oMonth, oDay] = override.date.split('-').map(Number);
      if (!oYear || !oMonth || !oDay) continue;

      // Determine day of week from override date in Asia/Dhaka
      const testDate = new Date(Date.UTC(oYear, oMonth - 1, oDay, 12, 0, 0));
      const weekdayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
      }).format(testDate).toUpperCase();

      const oCleanCourse = override.courseCode.split('(')[0].trim().toUpperCase();

      // Find matching recurring class in classes
      const matchingClass = classes.find((c) => {
        const cCleanCode = c.courseCode.split('(')[0].trim().toUpperCase();
        if (cCleanCode !== oCleanCourse) return false;
        if (c.dayOfWeek !== weekdayStr) return false;
        if (override.startTime && c.startTime !== override.startTime) return false;
        return true;
      });

      const startTimeStr = override.startTime || matchingClass?.startTime || '08:30';
      const endTimeStr = override.endTime || matchingClass?.endTime || '10:00';
      const [startH, startM] = startTimeStr.split(':').map(Number);
      const [endH, endM] = endTimeStr.split(':').map(Number);

      const startDate = new Date(oYear, oMonth - 1, oDay, startH, startM, 0);
      const endDate = new Date(oYear, oMonth - 1, oDay, endH, endM, 0);

      const typeTag = override.type.toUpperCase();
      const typeBadge =
        override.type === 'quiz' || override.type === 'ct'
          ? '📝 [QUIZ]'
          : override.type === 'assignment'
          ? '📑 [ASSIGNMENT]'
          : override.type === 'presentation'
          ? '🎤 [PRESENTATION]'
          : `📢 [${typeTag}]`;

      const targetRoom = override.room || matchingClass?.room || 'Campus';
      const cleanRoom = targetRoom.split('(')[0].trim();

      if (matchingClass) {
        // Occurrence exception for an existing recurring slot via RECURRENCE-ID
        const subIdentifier = matchingClass.subSection ? `sub${matchingClass.subSection}` : 'common';
        const cleanCourseCode = matchingClass.courseCode.split('(')[0].trim().toUpperCase();
        const sectionBadge = matchingClass.sectionId
          ? (matchingClass.subSection ? `${matchingClass.sectionId}${matchingClass.subSection}` : matchingClass.sectionId)
          : (matchingClass.batch && matchingClass.section ? `${matchingClass.batch}_${matchingClass.section}` : 'All');

        const deterministicUid = faculty
          ? `slot-faculty-${faculty.code}-${cleanCourseCode}-${sectionBadge}-${matchingClass.dayOfWeek}-${matchingClass.startTime.replace(':', '')}@${sourceDomain}`
          : `slot-${matchingClass.sectionId}-${matchingClass.courseCode.replace(/[^a-zA-Z0-9]/g, '')}-${subIdentifier}-${matchingClass.dayOfWeek}-${matchingClass.startTime.replace(':', '')}@${sourceDomain}`;

        const isLab = matchingClass.type === 'Lab' || matchingClass.courseCode.toLowerCase().includes('lab') || matchingClass.courseTitle.toLowerCase().includes('lab');
        const siteTitle = getCourseShortTitle(cleanCourseCode, matchingClass.courseTitle, isLab);

        const summary = `${typeBadge} ${siteTitle} (${cleanCourseCode})${override.title && !override.title.toLowerCase().includes(override.type.toLowerCase()) ? ` - ${override.title}` : ''}`;

        const teacherMeta = matchingClass.teacherCode ? getFacultyByCode(matchingClass.teacherCode) : undefined;
        const instructorName = teacherMeta
          ? `${teacherMeta.name} (${matchingClass.teacherCode})`
          : matchingClass.teacherName
          ? `${matchingClass.teacherName} (${matchingClass.teacherCode})`
          : matchingClass.teacherCode || (faculty ? `${faculty.name} (${faculty.code})` : 'TBA');

        const catalogEntry = COURSE_CATALOG[cleanCourseCode];
        const fullCourseTitle = (matchingClass.courseTitle && !matchingClass.courseTitle.toLowerCase().endsWith('course'))
          ? matchingClass.courseTitle
          : catalogEntry?.name || matchingClass.courseTitle || cleanCourseCode;

        const sectionDisplay = matchingClass.subSection
          ? `${matchingClass.sectionId} (Subsection ${matchingClass.section || ''}${matchingClass.subSection})`
          : matchingClass.sectionId || sectionBadge;

        const description = [
          `⚠️ ANNOUNCEMENT: ${override.title}`,
          override.description ? `${override.description}` : '',
          ``,
          `Instructor: ${instructorName}`,
          `Course: ${fullCourseTitle} (${cleanCourseCode})`,
          `Section: ${sectionDisplay}`,
          `Room: ${targetRoom}`,
          `Type: ${matchingClass.type}`,
          `Routine Version: ${formattedVersion}`,
          ``,
          `synced from diucal.vercel.app`,
        ].filter(Boolean).join('\n');

        const overrideEvent = calendar.createEvent({
          id: deterministicUid,
          recurrenceId: startDate,
          start: startDate,
          end: endDate,
          timezone,
          summary,
          description,
          location: targetRoom,
          sequence: 1,
        });

        // Alarms: 2 hours before & 15 mins before
        overrideEvent.createAlarm({
          type: ICalAlarmType.display,
          trigger: 7200, // 2 hours
          description: `Class Alert: ${cleanCourseCode} ${override.title} in Room ${cleanRoom}`,
        });
        overrideEvent.createAlarm({
          type: ICalAlarmType.display,
          trigger: 900, // 15 mins
          description: `Class Alert: ${cleanCourseCode} ${override.title} in Room ${cleanRoom}`,
        });
      } else {
        // Standalone event (e.g. Makeup or extra class)
        const standaloneUid = `event-${override.sectionId}-${override.id}@${sourceDomain}`;
        const standaloneEvent = calendar.createEvent({
          id: standaloneUid,
          start: startDate,
          end: endDate,
          timezone,
          summary: `${typeBadge} ${override.courseCode} - ${override.title}`,
          description: [
            `⚠️ ANNOUNCEMENT: ${override.title}`,
            override.description ? `${override.description}` : '',
            `Room: ${targetRoom}`,
            ``,
            `synced from diucal.vercel.app`,
          ].filter(Boolean).join('\n'),
          location: targetRoom,
          sequence: 1,
        });

        standaloneEvent.createAlarm({
          type: ICalAlarmType.display,
          trigger: 3600, // 1 hour
          description: `Class Reminder: ${override.courseCode} ${override.title}`,
        });
      }
    }
  }

  return calendar;
}

/**
 * Serializes calendar to RFC 5545 compliant string with mandatory VTIMEZONE and strict UTC Z formatting.
 */
export function serializeCalendarToIcs(calendar: ICalCalendar): string {
  let output = calendar.toString();

  // Inject X-WR-TIMEZONE and RFC 5545 VTIMEZONE block after X-WR-CALNAME
  const tzHeader = `X-WR-TIMEZONE:Asia/Dhaka\r\n${DHAKA_VTIMEZONE}\r\n`;
  if (!output.includes('BEGIN:VTIMEZONE')) {
    output = output.replace(/(X-WR-CALNAME:.*?\r\n)/, `$1${tzHeader}`);
  }

  // Ensure strict RFC 5545 compliance:
  // 1. DTSTAMP MUST be UTC (ending with Z)
  output = output.replace(/(DTSTAMP:\d{8}T\d{6})(?!Z)/g, '$1Z');

  // 2. RRULE UNTIL MUST be UTC (ending with Z) when DTSTART has timezone
  output = output.replace(/(UNTIL=\d{8}T\d{6})(?!Z)/g, '$1Z');

  return output;
}
