import { RoutineClass, SectionMeta } from '@/types/schedule';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { generateScheduleForSection } from '@/data/routines';
import { fetchLiveScheduleFromUpstream } from './zohir-scraper';

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
 * 1. Live scrape from routine.zohirrayhan.me API (with 15m in-memory cache)
 * 2. Optional: Google Sheets CSV export if GOOGLE_SHEETS_CSV_URL is set
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
export async function getScheduleForSection(
  sectionId: string,
  subSection?: '1' | '2' | 'all' | null
): Promise<RoutineClass[]> {
  const normalizedId = sectionId.replace('-', '_').toUpperCase();

  // 1. Try live scrape from routine.zohirrayhan.me
  try {
    const liveClasses = await fetchLiveScheduleFromUpstream(normalizedId);
    if (liveClasses && liveClasses.length > 0) {
      return filterBySubSection(liveClasses, subSection);
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
        return filterBySubSection(sheetData, subSection);
      }
    } catch (err) {
      console.warn('Fallback to local database after Google Sheets fetch error:', err);
    }
  }

  // 3. Fallback to curated dataset / local routine generator
  const fallbackSchedule = generateScheduleForSection(normalizedId);
  return filterBySubSection(fallbackSchedule, subSection);
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
