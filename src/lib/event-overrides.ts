import { ClassEventOverride } from '@/types/events';
import staticOverrides from '@/data/event-overrides.json';
import { getRoutineGatewayUrl } from './gateway-config';
import { robustFetch } from './robust-fetch';
import { getMidtermExamsForSection, getAllBatchMidtermOverrides } from '@/data/midterm-exams';

/**
 * Retrieves all active event overrides (Midterm exams, quizzes, assignments, cancellations, makeup classes)
 * for a specific section.
 *
 * Checks live upstream gateway first (if available), then falls back to local data,
 * and seamlessly merges the official Midterm Examination schedule.
 */
export async function getEventOverridesForSection(
  sectionId: string
): Promise<ClassEventOverride[]> {
  const normalizedSection = sectionId.toUpperCase().replace('-', '_');
  const batchNumber = normalizedSection.split('_')[0];
  const midtermExams = getMidtermExamsForSection(normalizedSection);

  // 1. Base stored local overrides (CR updates, quizzes, makeups, university holidays)
  const localList = (staticOverrides as ClassEventOverride[]).filter((ev) => {
    const s = ev.sectionId.toUpperCase().replace('-', '_');
    return (
      s === normalizedSection ||
      s === 'ALL' ||
      s === 'DEPARTMENT' ||
      s === `BATCH_${batchNumber}` ||
      s === batchNumber
    );
  });

  const map = new Map<string, ClassEventOverride>();
  for (const ev of localList) {
    map.set(ev.id, ev);
  }

  // 2. Overlay live routine gateway if configured
  try {
    const gateway = getRoutineGatewayUrl();
    if (gateway && normalizedSection !== 'ALL') {
      const res = await robustFetch<{ success: boolean; events?: ClassEventOverride[] }>(
        `${gateway}/api/events?section=${encodeURIComponent(normalizedSection)}`,
        { timeout: 3500 }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          for (const ev of data.events) {
            map.set(ev.id, ev);
          }
        }
      }
    }
  } catch (err) {
    // Graceful fallback to static overrides
    console.warn(`Upstream events fetch failed for section ${normalizedSection}:`, err);
  }

  // 3. Seamlessly merge official Midterm Examination schedule
  for (const ev of midtermExams) {
    map.set(ev.id, ev);
  }

  return Array.from(map.values());
}

/**
 * Returns all stored event overrides across all sections including midterm exam routines.
 */
export async function getAllEventOverrides(): Promise<ClassEventOverride[]> {
  const allMidterm = getAllBatchMidtermOverrides();
  const map = new Map<string, ClassEventOverride>();
  for (const ev of staticOverrides as ClassEventOverride[]) {
    map.set(ev.id, ev);
  }
  for (const ev of allMidterm) {
    map.set(ev.id, ev);
  }
  return Array.from(map.values());
}
