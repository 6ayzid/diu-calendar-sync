import { UNIVERSITY_TIME_SLOTS, type UniversityTimeSlot, timeToMinutes } from './time-utils';
import { RoutineClass } from '@/types/schedule';
import {
  BuildingZone,
  CategorizedRoom,
  categorizeRoom,
  getQueryRoomCode,
  resolveCanonicalRoomName,
  ALL_CAMPUS_ROOM_NAMES,
} from '@/data/rooms';
import officialRoutine from '@/data/official-routine.json';

export type { BuildingZone, CategorizedRoom };
export { categorizeRoom, getQueryRoomCode, resolveCanonicalRoomName };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomOccupancy {
  slot: UniversityTimeSlot;
  occupied: boolean;
  courseCode?: string;
  courseTitle?: string;
  section?: string;
  teacher?: string;
}

export interface RoomDaySchedule {
  room: string;
  day: string;
  slots: RoomOccupancy[];
}

/** Slot minute boundaries from midnight for time overlap calculation */
export const SLOT_MINUTES_MAP: Record<UniversityTimeSlot, { startMin: number; endMin: number }> = {
  '08:30-10:00': { startMin: 510, endMin: 600 },
  '10:00-11:30': { startMin: 600, endMin: 690 },
  '11:30-01:00': { startMin: 690, endMin: 780 },
  '01:00-02:30': { startMin: 780, endMin: 870 },
  '02:30-04:00': { startMin: 870, endMin: 960 },
  '04:00-05:30': { startMin: 960, endMin: 1050 },
};

/**
 * Checks if a class schedule interval overlaps with a target university slot.
 * Accurately accounts for 3-hour labs (e.g. 08:30-11:30 or 14:30-17:30) spanning multiple slots.
 */
export function doesClassOverlapSlot(c: RoutineClass, slot: UniversityTimeSlot): boolean {
  const boundary = SLOT_MINUTES_MAP[slot];
  if (!boundary) return false;
  const cStart = timeToMinutes(c.startTime);
  const cEnd = timeToMinutes(c.endTime);
  return Math.max(cStart, boundary.startMin) < Math.min(cEnd, boundary.endMin);
}

/**
 * Groups a list of room names by building zone.
 */
export function groupRoomsByZone(rooms: string[]): Record<BuildingZone, string[]> {
  const result: Record<BuildingZone, string[]> = { KT: [], ANX1: [], Labs: [], Other: [] };
  for (const room of rooms) {
    const cat = categorizeRoom(room);
    result[cat.zone].push(room);
  }
  for (const zone of Object.keys(result) as BuildingZone[]) {
    result[zone].sort();
  }
  return result;
}

const ACADEMIC_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// In-Memory precomputed index of all classes for instant, deterministic lookup
let cachedAllClasses: RoutineClass[] | null = null;
function getAllRoutineClasses(): RoutineClass[] {
  if (cachedAllClasses) return cachedAllClasses;
  const sectionsMap = (officialRoutine?.sections || {}) as Record<string, RoutineClass[]>;
  const list: RoutineClass[] = [];
  for (const classList of Object.values(sectionsMap)) {
    for (const c of classList) {
      list.push(c);
    }
  }
  cachedAllClasses = list;
  return list;
}

/**
 * Fetches free/empty rooms for a given time slot computed authoritatively from the official departmental routine.
 * Completely immune to external CR room booking pollution or Zohir scraping artifacts.
 * Returns a map of Day -> Room[] for all 6 academic days.
 */
export async function fetchFreeRooms(
  slot: UniversityTimeSlot
): Promise<Record<string, string[]>> {
  const allClasses = getAllRoutineClasses();

  // Track occupied canonical rooms per day for this slot
  const occupiedByDay: Record<string, Set<string>> = {};
  for (const d of ACADEMIC_DAYS) {
    occupiedByDay[d] = new Set<string>();
  }

  for (const c of allClasses) {
    if (!c.dayOfWeek || !c.room) continue;
    const dayCap = c.dayOfWeek.charAt(0).toUpperCase() + c.dayOfWeek.slice(1).toLowerCase();
    if (!occupiedByDay[dayCap]) continue;

    if (doesClassOverlapSlot(c, slot)) {
      const canonical = resolveCanonicalRoomName(c.room);
      if (canonical) {
        occupiedByDay[dayCap].add(canonical);
      }
    }
  }

  const result: Record<string, string[]> = {};
  for (const d of ACADEMIC_DAYS) {
    const occupied = occupiedByDay[d];
    result[d] = (ALL_CAMPUS_ROOM_NAMES as readonly string[])
      .filter((r) => !occupied.has(r))
      .sort();
  }

  return result;
}

/**
 * Fetches the authoritative full day schedule for a specific room across all 6 time slots.
 * Evaluates full time intervals so 3-hour labs and multi-slot classes appear across all spanned slots.
 */
export async function fetchRoomDaySchedule(
  roomNumber: string,
  day: string
): Promise<RoomOccupancy[]> {
  const canonicalTarget = resolveCanonicalRoomName(roomNumber);
  const dayUpper = day.toUpperCase();
  const allClasses = getAllRoutineClasses();

  const roomClasses = allClasses.filter((c) => {
    if (c.dayOfWeek?.toUpperCase() !== dayUpper) return false;
    return resolveCanonicalRoomName(c.room) === canonicalTarget;
  });

  const slots = UNIVERSITY_TIME_SLOTS.map((slot): RoomOccupancy => {
    const match = roomClasses.find((c) => doesClassOverlapSlot(c, slot));
    if (match) {
      return {
        slot,
        occupied: true,
        courseCode: match.courseCode.split('(')[0].trim(),
        courseTitle: match.courseTitle,
        section: match.sectionId,
        teacher: match.teacherCode,
      };
    }
    return {
      slot,
      occupied: false,
    };
  });

  return slots;
}
