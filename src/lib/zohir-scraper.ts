import { RoutineClass } from '@/types/schedule';

interface UpstreamClassItem {
  course_code: string;
  course_title: string;
  day: string;
  room: string;
  teacher: string;
  time_slot: string;
}

interface UpstreamApiResponse {
  success: boolean;
  result?: UpstreamClassItem[];
  batch?: string;
  teachers?: string[];
  teacher_images?: Record<string, string>;
  version?: string;
}

export interface UpstreamScheduleResult {
  classes: RoutineClass[];
  version: string;
}

// In-memory cache for fast response times (<5ms) and rate limit protection
const cache = new Map<string, { timestamp: number; data: RoutineClass[]; version: string }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function parse12HourTime(t: string): string {
  const [hStr, mStr] = t.trim().split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.padStart(2, '0') : '00';
  // 01:00 to 07:00 in class schedules represents PM (13:00 to 19:00)
  if (h >= 1 && h <= 7) {
    h += 12;
  }
  return `${h.toString().padStart(2, '0')}:${m}`;
}

/**
 * Scrapes/Fetches routine data directly from the live university routine service (routine.zohirrayhan.me)
 */
export async function fetchLiveScheduleFromUpstream(
  sectionId: string
): Promise<UpstreamScheduleResult | null> {
  const normalizedSection = sectionId.toUpperCase().replace('-', '_');

  // Check cache
  const cached = cache.get(normalizedSection);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { classes: cached.data, version: cached.version };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch('https://routine.zohirrayhan.me/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; DIU-Routine-Calendar-Sync/1.0)',
      },
      body: JSON.stringify({
        view_mode: 'student',
        batch: normalizedSection,
        department: 'cse',
      }),
      signal: controller.signal,
      next: { revalidate: 300 }, // 5 min Next.js fetch cache
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Upstream routine scraper returned status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as UpstreamApiResponse;
    if (!data.success || !Array.isArray(data.result)) {
      return null;
    }

    const [batchNum, sectionLetter] = normalizedSection.split('_');

    const mappedClasses: RoutineClass[] = data.result.map((item, index) => {
      // e.g. "CSE224(68_D1)" -> courseCode: CSE224, subSection: 1
      // e.g. "CSE228(68_D)"  -> courseCode: CSE228, subSection: null
      const codeMatch = item.course_code.match(
        /^([A-Z0-9]+)\(([0-9]+)_([A-Za-z]+)([12])?\)/
      );

      const courseCode = codeMatch ? codeMatch[1] : item.course_code.split('(')[0].trim();
      const subSection = codeMatch && codeMatch[4] ? (codeMatch[4] as '1' | '2') : null;

      // Time slot parsing: e.g. "08:30-10:00" or "08:30-11:30"
      const [startRaw, endRaw] = item.time_slot.split('-');
      const startTime = parse12HourTime(startRaw || '08:30');
      const endTime = parse12HourTime(endRaw || '10:00');

      // Day of week
      const dayRaw = item.day.toUpperCase().trim();
      const validDays = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;
      const dayOfWeek = (validDays.find((d) => d === dayRaw) || 'SATURDAY') as RoutineClass['dayOfWeek'];

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const durationMins = endH * 60 + endM - (startH * 60 + startM);

      // Lab detection: title explicitly mentions lab/sessional, has specific subsection (e.g. D1, D2), or slot is >= 2.5 hours
      const isLab =
        item.course_title.toLowerCase().includes('lab') ||
        item.course_title.toLowerCase().includes('sessional') ||
        subSection !== null ||
        durationMins >= 150;

      const subId = subSection ? `sub${subSection}` : 'common';
      const slotId = `${normalizedSection}-${courseCode}-${subId}-${dayOfWeek}-${startTime.replace(':', '')}-${index}`;

      return {
        id: slotId,
        batch: batchNum || '68',
        section: sectionLetter || 'D',
        sectionId: normalizedSection,
        subSection,
        courseCode: subSection ? `${courseCode}(${normalizedSection}${subSection})` : courseCode,
        courseTitle: item.course_title,
        teacherCode: item.teacher || 'TBA',
        room: item.room,
        dayOfWeek,
        startTime,
        endTime,
        type: isLab ? 'Lab' : 'Theory',
        color: isLab ? (subSection === '1' ? 'amber' : 'rose') : 'indigo',
      };
    });

    const rawVersion = data.version ? String(data.version).trim() : '2.2';

    // Store in cache
    cache.set(normalizedSection, {
      timestamp: Date.now(),
      data: mappedClasses,
      version: rawVersion,
    });

    return { classes: mappedClasses, version: rawVersion };
  } catch (err) {
    console.warn(`Upstream routine fetch failed for ${sectionId}:`, err);
    return null;
  }
}
