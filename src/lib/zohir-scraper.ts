import { RoutineClass, FacultyMeta } from '@/types/schedule';
import { robustFetch } from './robust-fetch';
import { getFacultyByCode, registerDynamicFaculty } from '@/data/faculty';

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
  error?: string;
}

interface UpstreamTeacherDetails {
  Name_Initial?: string;
  Designation?: string;
  Email?: string;
  Cell?: string;
  'Assigned Room Number'?: string;
  'Employee ID'?: string;
  Image?: string;
}

interface TeacherScheduleResponse {
  success?: boolean;
  teacher?: string;
  department?: string;
  version?: string;
  details?: UpstreamTeacherDetails;
  schedule?: UpstreamClassItem[];
  days?: string[];
  error?: string;
}

interface AutocompleteResponse {
  suggestions?: string[];
}

interface RoutineVersionResponse {
  success?: boolean;
  version?: string;
  updated_at?: string;
  cache_invalidation_timestamp?: number;
}

export interface UpstreamScheduleResult {
  classes: RoutineClass[];
  version: string;
  teacherDetails?: UpstreamTeacherDetails;
}

// In-memory cache for ultra-fast response times (<2ms) and rate-limit protection
const cache = new Map<string, { timestamp: number; data: RoutineClass[]; version: string }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let lastKnownVersion = '2.2';
let lastVersionCheckTime = 0;
const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check for routine updates every 5 min

/**
 * Periodically checks the upstream server's active routine version.
 * If the university updates the routine version mid-semester, this flushes the cache automatically.
 */
export async function checkAndInvalidateOnNewRoutineVersion(): Promise<string> {
  const now = Date.now();
  if (now - lastVersionCheckTime < VERSION_CHECK_INTERVAL_MS) {
    return lastKnownVersion;
  }
  lastVersionCheckTime = now;

  try {
    const res = await robustFetch<RoutineVersionResponse>(
      `https://routine.zohirrayhan.me/api/routine_version?t=${now}`,
      { timeout: 1500 }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.version) {
        const upstreamVer = String(data.version).trim();
        if (upstreamVer !== lastKnownVersion) {
          console.info(`[Routine Scraper] Upstream routine version updated from ${lastKnownVersion} to ${upstreamVer}. Clearing schedule cache.`);
          cache.clear();
          lastKnownVersion = upstreamVer;
        }
      }
    }
  } catch (err) {
    console.warn('[Routine Scraper] Failed to check routine version:', err);
  }

  return lastKnownVersion;
}

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

  await checkAndInvalidateOnNewRoutineVersion();

  // Check cache
  const cached = cache.get(normalizedSection);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { classes: cached.data, version: cached.version };
  }

  try {
    const res = await robustFetch<UpstreamApiResponse>('https://routine.zohirrayhan.me/api/schedule', {
      method: 'POST',
      body: JSON.stringify({
        view_mode: 'student',
        batch: normalizedSection,
        department: 'cse',
      }),
      timeout: 3000,
    });

    if (!res.ok) {
      console.warn(`Upstream routine scraper returned status ${res.status} for section ${normalizedSection}`);
      return null;
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.result)) {
      return null;
    }

    const [batchNum, sectionLetter] = normalizedSection.split('_');

    const mappedClasses: RoutineClass[] = data.result.map((item, index) => {
      const codeMatch = item.course_code.match(
        /^([A-Z0-9]+)\(([0-9]+)_([A-Za-z]+)([12])?\)/
      );

      const courseCode = codeMatch ? codeMatch[1] : item.course_code.split('(')[0].trim();
      const subSection = codeMatch && codeMatch[4] ? (codeMatch[4] as '1' | '2') : null;

      const [startRaw, endRaw] = item.time_slot.split('-');
      const startTime = parse12HourTime(startRaw || '08:30');
      const endTime = parse12HourTime(endRaw || '10:00');

      const dayRaw = item.day.toUpperCase().trim();
      const validDays = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;
      const dayOfWeek = (validDays.find((d) => d === dayRaw) || 'SATURDAY') as RoutineClass['dayOfWeek'];

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const durationMins = endH * 60 + endM - (startH * 60 + startM);

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

    // Register any scraped teacher images into dynamic faculty cache
    if (data.teacher_images && typeof data.teacher_images === 'object') {
      for (const [tCode, tUrl] of Object.entries(data.teacher_images)) {
        if (typeof tUrl === 'string' && tUrl.trim()) {
          registerDynamicFaculty({
            code: tCode.trim().toUpperCase(),
            name: tCode.trim().toUpperCase(),
            department: 'CSE',
            image: tUrl.trim(),
          });
        }
      }
    }

    const rawVersion = data.version ? String(data.version).trim() : lastKnownVersion;

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

/**
 * Live search autocomplete directly from the official university routine backend.
 * Discovers teachers that are currently in the routine system (including mid-semester additions).
 */
export async function fetchLiveTeacherAutocomplete(
  query: string
): Promise<Array<{ name: string; code: string; designation?: string }>> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const res = await robustFetch<AutocompleteResponse>(
      `https://routine.zohirrayhan.me/api/search_autocomplete?query=${encodeURIComponent(cleanQuery)}&view_mode=teacher&department=cse`,
      { timeout: 6000 }
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.suggestions || !Array.isArray(data.suggestions)) return [];

    const results: Array<{ name: string; code: string; designation?: string }> = [];

    for (const rawSuggestion of data.suggestions) {
      // Formats: "Dr. Sheak Rashed Haider Noori (SRH)" or "Masuma Parvin (MP)"
      const match = rawSuggestion.match(/^(.*?)\s*\(([^)]+)\)$/);
      if (match) {
        const name = match[1].trim();
        const code = match[2].trim().toUpperCase();
        const registered = registerDynamicFaculty({
          code,
          name,
          department: 'CSE',
          designation: 'Faculty Member',
        });
        results.push({
          name: registered.name,
          code: registered.code,
          designation: registered.designation,
        });
      } else {
        const clean = rawSuggestion.trim();
        const registered = registerDynamicFaculty({
          code: clean.toUpperCase(),
          name: clean,
          department: 'CSE',
        });
        results.push({
          name: registered.name,
          code: registered.code,
        });
      }
    }

    return results;
  } catch (err) {
    console.warn(`Autocomplete failed for query "${cleanQuery}":`, err);
    return [];
  }
}

/**
 * Scrapes/Fetches routine data for a specific faculty member directly from routine.zohirrayhan.me.
 * Returns genuine live classes, or empty classes if teacher has no classes scheduled this semester.
 */
export async function fetchLiveTeacherScheduleFromUpstream(
  teacherCode: string
): Promise<UpstreamScheduleResult | null> {
  const cleanCode = teacherCode.trim().toUpperCase();
  const cacheKey = `TEACHER_${cleanCode}`;

  await checkAndInvalidateOnNewRoutineVersion();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { classes: cached.data, version: cached.version };
  }

  // Gather code and known aliases to query
  const existingMeta = getFacultyByCode(cleanCode);
  const codesToTry = Array.from(
    new Set([
      cleanCode,
      ...(existingMeta?.aliases || []),
      ...(cleanCode === 'MSR' ? ['SRH'] : []),
      ...(cleanCode === 'SRH' ? ['MSR'] : []),
    ].map((c) => c.toUpperCase()))
  );

  const lastVersion = lastKnownVersion;
  let teacherDetails: UpstreamTeacherDetails | undefined;
  let receivedDefinitiveResponse = false;

  for (const targetCode of codesToTry) {
    // 1. Try Method B: GET /api/teacher-schedule (provides rich details including Room, Cell, Email, Image, Employee ID, Name_Initial)
    try {
      const res = await robustFetch<TeacherScheduleResponse>(
        `https://routine.zohirrayhan.me/api/teacher-schedule?teacher=${encodeURIComponent(targetCode)}&department=cse`,
        { timeout: 4500 }
      );

      if (res.status === 200 || res.status === 404) {
        receivedDefinitiveResponse = true;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.details) {
          teacherDetails = data.details;
          const rawName = data.details.Name_Initial || existingMeta?.name || targetCode;
          // Strip trailing parenthesized code like "Dr. Abdus Sattar(AS)" -> "Dr. Abdus Sattar"
          const cleanName = rawName.replace(/\s*\([^)]+\)\s*$/, '').trim();

          registerDynamicFaculty({
            code: cleanCode,
            name: cleanName,
            designation: data.details.Designation || existingMeta?.designation || 'Faculty Member',
            department: data.department?.toUpperCase() || existingMeta?.department || 'CSE',
            email: data.details.Email,
            phone: data.details.Cell,
            room: data.details['Assigned Room Number'],
            employeeId: data.details['Employee ID'],
            image: data.details.Image,
          });
        }

        if (data.schedule && Array.isArray(data.schedule) && data.schedule.length > 0) {
          const rawName = data.details?.Name_Initial || existingMeta?.name;
          const cleanName = rawName ? rawName.replace(/\s*\([^)]+\)\s*$/, '').trim() : undefined;
          const mapped = mapUpstreamTeacherSchedule(
            data.schedule,
            targetCode,
            cleanName
          );
          const version = data.version ? String(data.version).trim() : lastKnownVersion;
          cache.set(cacheKey, { timestamp: Date.now(), data: mapped, version });
          return { classes: mapped, version, teacherDetails };
        } else if (data.details || (Array.isArray(data.schedule) && data.schedule.length === 0)) {
          // Upstream definitively returned teacher info or confirmed 0 classes for this teacher
          const version = data.version ? String(data.version).trim() : lastKnownVersion;
          cache.set(cacheKey, { timestamp: Date.now(), data: [], version });
          return { classes: [], version, teacherDetails };
        }
      }
    } catch (err) {
      console.warn(`Upstream teacher schedule GET failed for ${targetCode}:`, err);
    }

    // 2. Try Method A: POST /api/schedule with view_mode: 'teacher' as fallback
    try {
      const res = await robustFetch<UpstreamApiResponse>('https://routine.zohirrayhan.me/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          view_mode: 'teacher',
          batch: targetCode,
          department: 'cse',
        }),
        timeout: 3000,
      });

      if (res.status === 200 || res.status === 404) {
        receivedDefinitiveResponse = true;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.result) && data.result.length > 0) {
          const mapped = mapUpstreamTeacherSchedule(data.result, targetCode, existingMeta?.name);
          const version = data.version ? String(data.version).trim() : lastKnownVersion;
          cache.set(cacheKey, { timestamp: Date.now(), data: mapped, version });
          return { classes: mapped, version, teacherDetails };
        }
      }
    } catch (err) {
      console.warn(`Upstream teacher schedule POST failed for ${targetCode}:`, err);
    }
  }

  // If upstream responded definitively (200 or 404) with no classes, this teacher has 0 classes scheduled this semester.
  if (receivedDefinitiveResponse) {
    cache.set(cacheKey, { timestamp: Date.now(), data: [], version: lastVersion });
    return { classes: [], version: lastVersion, teacherDetails };
  }

  // If network failed completely, do not poison cache
  return null;
}

function mapUpstreamTeacherSchedule(
  items: UpstreamClassItem[],
  teacherCode: string,
  teacherName?: string
): RoutineClass[] {
  const validDays = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;

  return items.map((item, index) => {
    // Parse course code and section information:
    // e.g. "CSE114(72_C)" -> course: CSE114, batch: 72, section: C, subSection: null
    // e.g. "CSE224(68_D1)" -> course: CSE224, batch: 68, section: D, subSection: 1
    const match = item.course_code.match(/^([A-Z0-9]+)(?:\(([0-9]+)_([A-Za-z]+)([12])?\))?/);
    const courseCode = match ? match[1] : item.course_code.split('(')[0].trim();
    const batchNum = match && match[2] ? match[2] : 'Batch';
    const secLetter = match && match[3] ? match[3].toUpperCase() : '';
    const subSection = match && match[4] ? (match[4] as '1' | '2') : null;
    const sectionId = secLetter ? `${batchNum}_${secLetter}` : (match && match[2] ? match[2] : 'Common');

    const [startRaw, endRaw] = (item.time_slot || '08:30-10:00').split('-');
    const startTime = parse12HourTime(startRaw || '08:30');
    const endTime = parse12HourTime(endRaw || '10:00');

    const dayRaw = (item.day || 'SATURDAY').toUpperCase().trim();
    const dayOfWeek = (validDays.find((d) => d === dayRaw) || 'SATURDAY') as RoutineClass['dayOfWeek'];

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMins = endH * 60 + endM - (startH * 60 + startM);

    const isLab =
      item.course_title.toLowerCase().includes('lab') ||
      item.course_title.toLowerCase().includes('sessional') ||
      subSection !== null ||
      durationMins >= 150;

    const cleanRoom = item.room.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    const slotId = `faculty-${teacherCode}-${courseCode}-${sectionId}-${dayOfWeek}-${startTime.replace(':', '')}-${index}`;

    return {
      id: slotId,
      batch: batchNum,
      section: secLetter,
      sectionId,
      subSection,
      courseCode: subSection ? `${courseCode}(${sectionId}${subSection})` : (secLetter ? `${courseCode}(${sectionId})` : courseCode),
      courseTitle: item.course_title,
      teacherCode,
      teacherName: teacherName || teacherCode,
      room: cleanRoom,
      dayOfWeek,
      startTime,
      endTime,
      type: isLab ? 'Lab' : 'Theory',
      color: isLab ? (subSection === '1' ? 'amber' : 'rose') : 'emerald',
    };
  });
}

/**
 * Fetches contact details, room number, and metadata for a faculty member.
 */
export async function fetchTeacherDetails(teacherCode: string): Promise<FacultyMeta | null> {
  const cleanCode = teacherCode.trim().toUpperCase();
  const existing = getFacultyByCode(cleanCode);

  // If existing already has phone or room, return it immediately
  if (existing && existing.phone && existing.room) {
    return existing;
  }

  const codesToTry = Array.from(
    new Set([
      cleanCode,
      ...(existing?.aliases || []),
      ...(cleanCode === 'MSR' ? ['SRH'] : []),
      ...(cleanCode === 'SRH' ? ['MSR'] : []),
    ].map((c) => c.toUpperCase()))
  );

  for (const targetCode of codesToTry) {
    try {
      const res = await robustFetch<TeacherScheduleResponse>(
        `https://routine.zohirrayhan.me/api/teacher-schedule?teacher=${encodeURIComponent(targetCode)}&department=cse`,
        { timeout: 6000 }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.details) {
          const rawName = data.details.Name_Initial || existing?.name || cleanCode;
          const cleanName = rawName.replace(/\s*\([^)]+\)\s*$/, '').trim();

          const rawCell = data.details.Cell?.trim();
          const validPhone = rawCell && rawCell !== '0' && rawCell.length > 5 ? rawCell : existing?.phone;

          const registered = registerDynamicFaculty({
            code: cleanCode,
            name: cleanName,
            designation: data.details.Designation || existing?.designation || 'Faculty Member',
            department: data.department?.toUpperCase() || existing?.department || 'CSE',
            email: data.details.Email || existing?.email,
            phone: validPhone,
            room: data.details['Assigned Room Number'] || existing?.room,
            employeeId: data.details['Employee ID'] || existing?.employeeId,
            image: data.details.Image || existing?.image,
          });
          return registered;
        }
      }
    } catch (err) {
      console.warn(`Upstream teacher details fetch failed for ${targetCode}:`, err);
    }
  }

  return existing || null;
}

