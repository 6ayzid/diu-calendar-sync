import { ClassEventOverride } from '@/types/events';
import staticOverrides from '@/data/event-overrides.json';
import { getRoutineGatewayUrl } from './gateway-config';
import { robustFetch } from './robust-fetch';

/**
 * Retrieves all active event overrides (Quizzes, assignments, cancellations, makeup classes)
 * for a specific section.
 *
 * Checks live upstream gateway first (if available), then falls back to local data.
 */
export async function getEventOverridesForSection(
  sectionId: string
): Promise<ClassEventOverride[]> {
  const normalizedSection = sectionId.toUpperCase().replace('-', '_');

  // 1. Check live routine gateway if configured
  try {
    const gateway = getRoutineGatewayUrl();
    if (gateway) {
      const res = await robustFetch<{ success: boolean; events?: ClassEventOverride[] }>(
        `${gateway}/api/events?section=${encodeURIComponent(normalizedSection)}`,
        { timeout: 3500 }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          return data.events;
        }
      }
    }
  } catch (err) {
    // Graceful fallback to static overrides
    console.warn(`Upstream events fetch failed for section ${normalizedSection}:`, err);
  }

  // 2. Fallback to local stored overrides
  const localList = (staticOverrides as ClassEventOverride[]).filter(
    (ev) => ev.sectionId.toUpperCase().replace('-', '_') === normalizedSection
  );

  return localList;
}

/**
 * Returns all stored event overrides across all sections.
 */
export async function getAllEventOverrides(): Promise<ClassEventOverride[]> {
  return staticOverrides as ClassEventOverride[];
}
