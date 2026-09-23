import { NextRequest, NextResponse } from 'next/server';
import { fetchFreeRooms, groupRoomsByZone } from '@/lib/room-scraper';
import { UNIVERSITY_TIME_SLOTS, type UniversityTimeSlot } from '@/lib/time-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const time = searchParams.get('time') as UniversityTimeSlot | 'all' | null;
  const day = searchParams.get('day');

  // If day is omitted or day is 'all' and time is 'all' or omitted, return all days and all slots
  if ((!day || day === 'all') && (!time || time === 'all')) {
    try {
      const allDaysData: Record<
        string,
        Record<
          string,
          {
            rooms: string[];
            grouped: ReturnType<typeof groupRoomsByZone>;
            totalFree: number;
          }
        >
      > = {};

      const academicDayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      for (const d of academicDayNames) {
        allDaysData[d] = {};
      }

      await Promise.all(
        UNIVERSITY_TIME_SLOTS.map(async (slot) => {
          try {
            const freeRoomsByDay = await fetchFreeRooms(slot);
            for (const d of academicDayNames) {
              const dayRooms = freeRoomsByDay[d] || [];
              allDaysData[d][slot] = {
                rooms: dayRooms,
                grouped: groupRoomsByZone(dayRooms),
                totalFree: dayRooms.length,
              };
            }
          } catch {
            for (const d of academicDayNames) {
              allDaysData[d][slot] = {
                rooms: [],
                grouped: { KT: [], ANX1: [], Labs: [], Other: [] },
                totalFree: 0,
              };
            }
          }
        })
      );

      return NextResponse.json({
        success: true,
        days: allDaysData,
      });
    } catch (err) {
      console.error('Room free-rooms all-days API error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch free rooms from upstream' },
        { status: 502 }
      );
    }
  }

  // If day is specified and time is 'all' or omitted, return free rooms for all 6 slots for that day
  if (day && (!time || time === 'all')) {
    try {
      const allSlotsData: Record<
        string,
        {
          rooms: string[];
          grouped: ReturnType<typeof groupRoomsByZone>;
          totalFree: number;
        }
      > = {};

      await Promise.all(
        UNIVERSITY_TIME_SLOTS.map(async (slot) => {
          try {
            const freeRoomsByDay = await fetchFreeRooms(slot);
            const dayRooms = freeRoomsByDay[day] || [];
            allSlotsData[slot] = {
              rooms: dayRooms,
              grouped: groupRoomsByZone(dayRooms),
              totalFree: dayRooms.length,
            };
          } catch {
            allSlotsData[slot] = {
              rooms: [],
              grouped: { KT: [], ANX1: [], Labs: [], Other: [] },
              totalFree: 0,
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        day,
        slots: allSlotsData,
      });
    } catch (err) {
      console.error('Room free-rooms all-slots API error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch free rooms from upstream' },
        { status: 502 }
      );
    }
  }

  if (!time || !UNIVERSITY_TIME_SLOTS.includes(time as UniversityTimeSlot)) {
    return NextResponse.json(
      { error: 'Missing or invalid `time` parameter. Valid: ' + UNIVERSITY_TIME_SLOTS.join(', ') + ' or omitted with `day`' },
      { status: 400 }
    );
  }

  try {
    const freeRoomsByDay = await fetchFreeRooms(time as UniversityTimeSlot);

    if (day) {
      // Return rooms for a specific day, grouped by building zone
      const dayRooms = freeRoomsByDay[day] || [];
      const grouped = groupRoomsByZone(dayRooms);

      return NextResponse.json({
        success: true,
        time,
        day,
        totalFree: dayRooms.length,
        rooms: dayRooms,
        grouped,
      });
    }

    // Return all days
    const allGrouped: Record<string, ReturnType<typeof groupRoomsByZone>> = {};
    for (const [d, rooms] of Object.entries(freeRoomsByDay)) {
      allGrouped[d] = groupRoomsByZone(rooms);
    }

    return NextResponse.json({
      success: true,
      time,
      freeRoomsByDay,
      grouped: allGrouped,
    });
  } catch (err) {
    console.error('Room free-rooms API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch free rooms from upstream' },
      { status: 502 }
    );
  }
}
