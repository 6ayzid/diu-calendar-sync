import { RoutineClass, SectionMeta, FacultyMeta } from '@/types/schedule';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { CURATED_ROUTINES } from '@/data/routines';
import { fetchLiveScheduleFromUpstream, fetchLiveTeacherScheduleFromUpstream } from './routine-gateway';
import { getFacultyByCode } from '@/data/faculty';
import { getCourseName } from '@/lib/courses';
import officialRoutine from '@/data/official-routine.json';

/**
 * Retrieves all registered university sections (170+ sections across Batches 63-73)
 */
export function getAllSections(): SectionMeta[] {
  return ALL_SECTIONS;
}

/**
 * Retrieves section metadata by ID (e.g., '68_D' or '70_Q')
 */
export function getSection(id: string): SectionMeta | undefined {
  return getSectionById(id);
}

/**
 * Retrieves schedule entries for a section with subsection filtering.
 * 
 * Data resolution order:
 * 1. Official Departmental Routine (Parsed from official Fall 2026 V1.1 PDF)
 * 2. Optional: Live gateway or Google Sheets CSV export
 * 3. Fallback: Curated internal routine engine
 * 
 * Domain Rule:
 * Section D has subsections D1 and D2:
 * - Theory classes are common (subSection is null)
 * - Labs are subgroup-specific (subSection is '1' or '2')
 * 
 * @param sectionId e.g. "68_D"
 * @param subSection '1' | '2' | 'all' | null
 */
export async function getScheduleWithMeta(
  sectionId: string,
  subSection?: '1' | '2' | 'all' | null
): Promise<{ classes: RoutineClass[]; version: string }> {
  const normalizedId = sectionId.replace('-', '_').toUpperCase();

  // 1. Primary: Official Departmental Routine
  const officialClasses = (officialRoutine.sections as Record<string, RoutineClass[]>)[normalizedId];
  if (officialClasses && officialClasses.length > 0) {
    const enriched = officialClasses.map((c) => ({
      ...c,
      courseTitle: getCourseName(c.courseCode),
      teacherName: getFacultyByCode(c.teacherCode)?.name || c.teacherCode,
    }));
    return {
      classes: filterBySubSection(enriched, subSection),
      version: officialRoutine.version || 'Fall 2026 V1.1',
    };
  }

  // 2. Try live fetch from departmental routine gateway (if configured)
  try {
    const liveResult = await fetchLiveScheduleFromUpstream(normalizedId);
    if (liveResult && liveResult.classes.length > 0) {
      return {
        classes: filterBySubSection(liveResult.classes, subSection),
        version: liveResult.version || '2.2',
      };
    }
  } catch (err) {
    console.warn(`Upstream fetch fallback for ${normalizedId}:`, err);
  }

  // 2. If connected to external Google Sheets CSV, fetch and parse:
  if (process.env.GOOGLE_SHEETS_CSV_URL) {
    try {
      const sheetData = await fetchScheduleFromGoogleSheet(
        process.env.GOOGLE_SHEETS_CSV_URL,
        normalizedId
      );
      if (sheetData.length > 0) {
        return {
          classes: filterBySubSection(sheetData, subSection),
          version: '2.2',
        };
      }
    } catch (err) {
      console.warn('Fallback to local database after Google Sheets fetch error:', err);
    }
  }

  // 3. Fallback to curated dataset only (do not generate fake/synthetic mock classes)
  const curated = CURATED_ROUTINES.filter(
    (c) => c.sectionId.toUpperCase() === normalizedId
  );
  return {
    classes: filterBySubSection(curated, subSection),
    version: '2.2',
  };
}

export async function getScheduleForSection(
  sectionId: string,
  subSection?: '1' | '2' | 'all' | null
): Promise<RoutineClass[]> {
  const res = await getScheduleWithMeta(sectionId, subSection);
  return res.classes;
}

const DAY_ORDER: Record<string, number> = {
  SATURDAY: 0,
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
};

function deduplicateAndSortClasses(classes: RoutineClass[]): RoutineClass[] {
  const map = new Map<string, RoutineClass>();

  for (const c of classes) {
    const cleanCourse = c.courseCode.split('(')[0].trim();
    // Key based on day, start time, end time, clean course code, and room
    const key = `${c.dayOfWeek}_${c.startTime}_${c.endTime}_${cleanCourse}_${c.room}`;

    if (map.has(key)) {
      const existing = map.get(key)!;
      // If sections differ, combine section label e.g. "66_A, 66_B"
      if (c.sectionId && !existing.sectionId.includes(c.sectionId)) {
        existing.sectionId = `${existing.sectionId}, ${c.sectionId}`;
      }
    } else {
      map.set(key, { ...c });
    }
  }

  const results = Array.from(map.values());
  results.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dayOfWeek] ?? 0) - (DAY_ORDER[b.dayOfWeek] ?? 0);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return results;
}

/**
 * Retrieves genuine routine classes for a faculty member directly from the live university system.
 * If the faculty member has no classes scheduled this semester or is no longer teaching,
 * this accurately returns an empty array with 0 classes (no fake mock classes are generated).
 */
export async function getScheduleForFacultyWithMeta(
  teacherCode: string
): Promise<{ classes: RoutineClass[]; version: string; faculty: FacultyMeta }> {
  const cleanCode = teacherCode.trim().toUpperCase();
  const faculty = getFacultyByCode(cleanCode) || {
    code: cleanCode,
    name: cleanCode,
    department: 'CSE',
  };

  // 1. Primary: Official Departmental Routine
  const allCodes = new Set<string>([
    cleanCode,
    ...(faculty.aliases || []).map((a) => a.toUpperCase()),
  ]);

  const teacherClasses: RoutineClass[] = [];
  const teachersMap = officialRoutine.teachers as Record<string, RoutineClass[]>;

  for (const code of allCodes) {
    if (teachersMap[code]) {
      teacherClasses.push(...teachersMap[code]);
    }
  }

  if (teacherClasses.length > 0) {
    const enriched = teacherClasses.map((c) => ({
      ...c,
      courseTitle: getCourseName(c.courseCode),
      teacherName: faculty.name,
    }));
    return {
      classes: deduplicateAndSortClasses(enriched),
      version: officialRoutine.version || 'Fall 2026 V1.1',
      faculty,
    };
  }

  // 2. Fetch live schedule from gateway if configured
  try {
    const liveResult = await fetchLiveTeacherScheduleFromUpstream(cleanCode);
    if (liveResult !== null) {
      const refreshedFaculty = getFacultyByCode(cleanCode) || faculty;
      return {
        classes: deduplicateAndSortClasses(liveResult.classes),
        version: liveResult.version || 'v2.2',
        faculty: refreshedFaculty,
      };
    }
  } catch (err) {
    console.warn(`Upstream faculty routine fetch failed for ${cleanCode}:`, err);
  }

  // 3. Fallback to local curated routines only if upstream was unreachable
  const aggregatedClasses: RoutineClass[] = [];

  for (const c of CURATED_ROUTINES) {
    if (allCodes.has(c.teacherCode.toUpperCase())) {
      aggregatedClasses.push({ ...c, teacherName: faculty.name });
    }
  }

  return {
    classes: deduplicateAndSortClasses(aggregatedClasses),
    version: 'v2.2',
    faculty,
  };
}

export async function getScheduleForFaculty(teacherCode: string): Promise<RoutineClass[]> {
  const res = await getScheduleForFacultyWithMeta(teacherCode);
  return res.classes;
}

function filterBySubSection(
  classes: RoutineClass[],
  subSection?: '1' | '2' | 'all' | null
): RoutineClass[] {
  if (!subSection || subSection === 'all') {
    return classes;
  }
  return classes.filter((c) => {
    // Keep all common theory classes
    if (c.subSection === null || c.subSection === undefined) {
      return true;
    }
    // Keep only the selected lab subsection (e.g. D1 or D2)
    return c.subSection === subSection;
  });
}

/**
 * Google Sheet CSV Live Data Adapter
 */
export async function fetchScheduleFromGoogleSheet(
  csvUrl: string,
  targetSectionId: string
): Promise<RoutineClass[]> {
  const response = await fetch(csvUrl, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet CSV: ${response.statusText}`);
  }
  const csvText = await response.text();
  const rows = csvText.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rows.length <= 1) return [];

  const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());
  const results: RoutineClass[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(',').map((c) => c.trim());
    if (cols.length < headers.length) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx];
    });

    if (rowObj.sectionid?.toUpperCase() === targetSectionId.toUpperCase()) {
      results.push({
        id: `${targetSectionId}-${rowObj.coursecode}-${rowObj.dayofweek}-${rowObj.starttime?.replace(':', '')}`,
        batch: targetSectionId.split('_')[0],
        section: targetSectionId.split('_')[1],
        sectionId: targetSectionId,
        subSection: (rowObj.subsection as '1' | '2') || null,
        courseCode: rowObj.coursecode || '',
        courseTitle: rowObj.coursetitle || '',
        teacherCode: rowObj.teachercode || '',
        teacherName: rowObj.teachername || '',
        room: rowObj.room || '',
        dayOfWeek: (rowObj.dayofweek?.toUpperCase() as RoutineClass['dayOfWeek']) || 'SATURDAY',
        startTime: rowObj.starttime || '08:30',
        endTime: rowObj.endtime || '10:00',
        type: (rowObj.type as 'Theory' | 'Lab') || 'Theory',
      });
    }
  }

  return results;
}
