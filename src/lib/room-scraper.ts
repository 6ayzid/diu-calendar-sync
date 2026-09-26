import { robustFetch } from './robust-fetch';
import { UNIVERSITY_TIME_SLOTS, type UniversityTimeSlot } from './time-utils';
import { RoutineClass } from '@/types/schedule';
import { BuildingZone, CategorizedRoom, categorizeRoom, getQueryRoomCode } from '@/data/rooms';
import officialRoutine from '@/data/official-routine.json';
import { getRoutineGatewayUrl } from './gateway-config';

export type { BuildingZone, CategorizedRoom };
export { categorizeRoom, getQueryRoomCode };

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

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const FREE_ROOMS_CACHE = new Map<string, CacheEntry<Record<string, string[]>>>();
const ROOM_SCHEDULE_CACHE = new Map<string, CacheEntry<RoomOccupancy[]>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
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
  // Sort within each zone
  for (const zone of Object.keys(result) as BuildingZone[]) {
    result[zone].sort();
  }
  return result;
}

// ─── Room Occupancy & Free Room Resolution ─────────────────────────────────────

const ACADEMIC_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

/**
 * Fetches free/empty rooms for a given time slot.
 * Primary: Computed locally from official routine dataset.
 * Returns a map of day -> room[] for all 6 academic days.
 */
export async function fetchFreeRooms(
  slot: UniversityTimeSlot
): Promise<Record<string, string[]>> {
  const cacheKey = slot;
  const cached = getCached(FREE_ROOMS_CACHE, cacheKey);
  if (cached) return cached;

  const [slotStart] = slot.split('-'); // e.g. "10:00"

  // 1. Primary: Local computation from official departmental routine
  if (officialRoutine && officialRoutine.rooms) {
    const allRooms = new Set<string>(officialRoutine.rooms);
    const occupiedByDay: Record<string, Set<string>> = {};
    for (const d of ACADEMIC_DAYS) {
      occupiedByDay[d] = new Set<string>();
    }

    const sectionsMap = officialRoutine.sections as Record<string, RoutineClass[]>;
    for (const classList of Object.values(sectionsMap)) {
      for (const c of classList) {
        if (c.startTime === slotStart) {
          const dayCapitalized = c.dayOfWeek.charAt(0) + c.dayOfWeek.slice(1).toLowerCase();
          if (occupiedByDay[dayCapitalized]) {
            occupiedByDay[dayCapitalized].add(c.room.trim());
          }
        }
      }
    }

    const result: Record<string, string[]> = {};
    for (const d of ACADEMIC_DAYS) {
      const occupied = occupiedByDay[d];
      result[d] = Array.from(allRooms)
        .filter((r) => !occupied.has(r))
        .sort();
    }

    FREE_ROOMS_CACHE.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  // 2. Gateway fallback if external gateway is configured
  const baseUrl = getRoutineGatewayUrl();
  if (!baseUrl) return {};
  try {
    const res = await robustFetch(
      `${baseUrl}/api/free-rooms?time=${encodeURIComponent(slot)}&department=cse`
    );

    if (res.ok) {
      const data = await res.json() as { empty_classrooms?: Record<string, string[]> };
      const rooms = data.empty_classrooms || {};
      FREE_ROOMS_CACHE.set(cacheKey, { timestamp: Date.now(), data: rooms });
      return rooms;
    }
  } catch (err) {
    console.warn('Free rooms gateway fetch failed:', err);
  }

  return {};
}

/**
 * Fetches the full day schedule for a specific room across all 6 time slots.
 * Primary: Computed locally from official routine dataset.
 */
export async function fetchRoomDaySchedule(
  roomNumber: string,
  day: string
): Promise<RoomOccupancy[]> {
  const cacheKey = `${roomNumber}|${day}`;
  const cached = getCached(ROOM_SCHEDULE_CACHE, cacheKey);
  if (cached) return cached;

  const dayUpper = day.toUpperCase();
  const cleanTargetRoom = getQueryRoomCode(roomNumber).toUpperCase();

  // 1. Primary: Local computation from official departmental routine
  if (officialRoutine && officialRoutine.sections) {
    const sectionsMap = officialRoutine.sections as Record<string, RoutineClass[]>;
    const roomClasses: RoutineClass[] = [];

    for (const classList of Object.values(sectionsMap)) {
      for (const c of classList) {
        if (c.dayOfWeek === dayUpper) {
          const cRoomUpper = c.room.toUpperCase();
          if (cRoomUpper.includes(cleanTargetRoom) || cleanTargetRoom.includes(cRoomUpper)) {
            roomClasses.push(c);
          }
        }
      }
    }

    const slots = UNIVERSITY_TIME_SLOTS.map((slot): RoomOccupancy => {
      const [slotStart] = slot.split('-');
      const match = roomClasses.find((c) => c.startTime === slotStart);
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

    ROOM_SCHEDULE_CACHE.set(cacheKey, { timestamp: Date.now(), data: slots });
    return slots;
  }

  // 2. Gateway fallback if external gateway is configured
  const baseUrl = getRoutineGatewayUrl();
  if (!baseUrl) {
    return UNIVERSITY_TIME_SLOTS.map((slot) => ({ slot, occupied: false }));
  }

  const slots = await Promise.all(
    UNIVERSITY_TIME_SLOTS.map(async (slot): Promise<RoomOccupancy> => {
      try {
        const res = await robustFetch(`${baseUrl}/api/schedule`, {
          method: 'POST',
          body: JSON.stringify({
            view_mode: 'room',
            room_number: getQueryRoomCode(roomNumber),
            day,
            time: slot,
            department: 'cse',
          }),
        });

        if (res.ok) {
          const data = await res.json() as {
            success?: boolean;
            result?: Array<{
              course_code?: string;
              course_title?: string;
              teacher?: string;
              room?: string;
              time_slot?: string;
            }>;
          };

          if (data.success && data.result && data.result.length > 0) {
            const entry = data.result[0];
            const sectionMatch = entry.course_code?.match(/\(([^)]+)\)/);
            const section = sectionMatch ? sectionMatch[1] : undefined;
            const courseCode = entry.course_code?.replace(/\([^)]*\)/, '').trim();

            return {
              slot,
              occupied: true,
              courseCode,
              courseTitle: entry.course_title,
              section,
              teacher: entry.teacher,
            };
          }
        }

        return { slot, occupied: false };
      } catch {
        return { slot, occupied: false };
      }
    })
  );

  ROOM_SCHEDULE_CACHE.set(cacheKey, { timestamp: Date.now(), data: slots });
  return slots;
}
