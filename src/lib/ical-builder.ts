import ical, {
  ICalAlarmType,
  ICalCalendar,
  ICalEventRepeatingFreq,
  ICalWeekday,
} from 'ical-generator';
import { DayOfWeek, RoutineClass } from '@/types/schedule';
import { getSectionById } from '@/data/sections';

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
  sectionId: string;
  subSection?: '1' | '2' | 'all' | null;
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
  const { sectionId, subSection, timezone = 'Asia/Dhaka', sourceDomain = 'schedule.campus.edu' } = options;
  const sectionMeta = getSectionById(sectionId);

  let subLabel = '';
  if (subSection === '1' && sectionMeta) {
    subLabel = ` (Subsection ${sectionMeta.sectionLetter}1)`;
  } else if (subSection === '2' && sectionMeta) {
    subLabel = ` (Subsection ${sectionMeta.sectionLetter}2)`;
  }

  const calendarName = sectionMeta
    ? `CSE Routine: ${sectionMeta.displayName}${subLabel}`
    : `CSE Routine: Section ${sectionId}${subLabel}`;

  // Do not set timezone on the top-level calendar options, because ical-generator
  // strips the mandatory 'Z' from DTSTAMP and RRULE:UNTIL when top-level timezone is present.
  // Instead, we set timezone on each event and inject the RFC 5545 VTIMEZONE component into the serialized output.
  const calendar = ical({
    name: calendarName,
    description: `Official class schedule feed for Dept. of CSE, Routine V1.1 by @6ayzid. Auto-syncs weekly routine changes directly to Google and Apple Calendars.`,
    ttl: 3600, // 1 hour refresh interval (X-PUBLISHED-TTL:PT1H & REFRESH-INTERVAL)
    prodId: {
      company: 'Dept. of CSE, DIU (@6ayzid)',
      product: 'Live WebCal Feed Generator',
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
    const deterministicUid = `slot-${item.sectionId}-${item.courseCode.replace(/[^a-zA-Z0-9]/g, '')}-${subIdentifier}-${item.dayOfWeek}-${item.startTime.replace(':', '')}@${sourceDomain}`;

    const subTag = item.subSection
      ? ` [Sub-Sec ${item.section}${item.subSection}]`
      : '';

    const summary = `[${item.courseCode}] ${item.courseTitle}${subTag}`;

    const description = [
      `Course: ${item.courseCode} - ${item.courseTitle}`,
      `Type: ${item.type} Class`,
      `Teacher: ${item.teacherCode}${item.teacherName ? ` (${item.teacherName})` : ''}`,
      `Room / Venue: ${item.room}`,
      `Section: ${item.sectionId}${item.subSection ? ` (Sub-section ${item.section}${item.subSection})` : ' (All Sub-sections)'}`,
      `Day & Time: ${item.dayOfWeek} ${item.startTime} - ${item.endTime}`,
      ``,
      `---`,
      `Dept. of CSE, DIU (Version V2.2)`,
      `Effective From: 09 September, 2026`,
      `Live Subscription Feed: Automatically reflects room and instructor changes.`
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
      description: `Class Reminder: ${item.courseCode} in Room ${item.room}`,
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
