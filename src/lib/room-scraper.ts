import { robustFetch } from './robust-fetch';
import { UNIVERSITY_TIME_SLOTS, type UniversityTimeSlot } from './time-utils';

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

import { BuildingZone, CategorizedRoom, categorizeRoom, getQueryRoomCode } from '@/data/rooms';
export type { BuildingZone, CategorizedRoom };
export { categorizeRoom, getQueryRoomCode };

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const FREE_ROOMS_CACHE = new Map<string, CacheEntry<Record<string, string[]>>>();
const ROOM_SCHEDULE_CACHE = new Map<string, CacheEntry<RoomOccupancy[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

// ─── Upstream API Calls ───────────────────────────────────────────────────────

const BASE_URL = 'https://routine.zohirrayhan.me';

/**
 * Fetches free/empty rooms for a given time slot from the upstream API.
 * Returns a map of day -> room[] for all 6 academic days.
 */
export async function fetchFreeRooms(
  slot: UniversityTimeSlot
): Promise<Record<string, string[]>> {
  const cacheKey = slot;
  const cached = getCached(FREE_ROOMS_CACHE, cacheKey);
  if (cached) return cached;

  const res = await robustFetch(
    `${BASE_URL}/api/free-rooms?time=${encodeURIComponent(slot)}&department=cse`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch free rooms: ${res.status}`);
  }

  const data = await res.json() as { empty_classrooms?: Record<string, string[]> };
  const rooms = data.empty_classrooms || {};

  FREE_ROOMS_CACHE.set(cacheKey, { timestamp: Date.now(), data: rooms });
  return rooms;
}

/**
 * Fetches the full day schedule for a specific room by querying all 6 time slots in parallel.
 * Returns an array of 6 RoomOccupancy entries.
 */
export async function fetchRoomDaySchedule(
  roomNumber: string,
  day: string
): Promise<RoomOccupancy[]> {
  const cacheKey = `${roomNumber}|${day}`;
  const cached = getCached(ROOM_SCHEDULE_CACHE, cacheKey);
  if (cached) return cached;

  const slots = await Promise.all(
    UNIVERSITY_TIME_SLOTS.map(async (slot): Promise<RoomOccupancy> => {
      try {
        const res = await robustFetch(`${BASE_URL}/api/schedule`, {
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
            // Extract section from course_code like "CSE113(72_B)" -> "72_B"
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
