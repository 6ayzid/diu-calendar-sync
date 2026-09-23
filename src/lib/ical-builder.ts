import ical, {
  ICalAlarmType,
  ICalCalendar,
  ICalEventRepeatingFreq,
  ICalWeekday,
} from 'ical-generator';
import { DayOfWeek, RoutineClass, FacultyMeta } from '@/types/schedule';
import { getSectionById } from '@/data/sections';
import { getFacultyByCode } from '@/data/faculty';

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
  const { sectionId, subSection, faculty, timezone = 'Asia/Dhaka', sourceDomain = 'schedule.campus.edu' } = options;

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
    const cleanCourseCode = item.courseCode.split('(')[0].trim();
    const cleanRoom = item.room.split('(')[0].trim();
    const sectionBadge = item.sectionId
      ? (item.subSection ? `${item.sectionId}${item.subSection}` : item.sectionId)
      : (item.batch && item.section ? `${item.batch}_${item.section}` : 'All');

    const deterministicUid = faculty
      ? `slot-faculty-${faculty.code}-${cleanCourseCode}-${sectionBadge}-${item.dayOfWeek}-${item.startTime.replace(':', '')}@${sourceDomain}`
      : `slot-${item.sectionId}-${item.courseCode.replace(/[^a-zA-Z0-9]/g, '')}-${subIdentifier}-${item.dayOfWeek}-${item.startTime.replace(':', '')}@${sourceDomain}`;

    const subTag = item.subSection
      ? ` (${item.section || ''}${item.subSection})`
      : '';

    const summary = faculty
      ? `${cleanCourseCode} — ${sectionBadge} (${cleanRoom})`
      : `${cleanCourseCode} — ${item.courseTitle}${subTag}`;

    const teacherMeta = item.teacherCode ? getFacultyByCode(item.teacherCode) : undefined;
    const teacherDisplay = teacherMeta
      ? `${teacherMeta.name} (${item.teacherCode})`
      : item.teacherName
      ? `${item.teacherName} (${item.teacherCode})`
      : item.teacherCode || '';

    const sectionDisplay = item.subSection
      ? `${item.sectionId} (Subsection ${item.section || ''}${item.subSection})`
      : item.sectionId;

    const description = faculty
      ? [
          `Course: ${cleanCourseCode} — ${item.courseTitle}`,
          `Section: ${sectionBadge}`,
          `Type: ${item.type}`,
          `Room: ${item.room}`,
          ``,
          `DIU CSE Routine Sync`,
        ].join('\n')
      : [
          `Course: ${cleanCourseCode} — ${item.courseTitle}`,
          ...(teacherDisplay ? [`Instructor: ${teacherDisplay}`] : []),
          `Section: ${sectionDisplay}`,
          `Type: ${item.type}`,
          `Room: ${item.room}`,
          ``,
          `DIU CSE Routine Sync`,
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
