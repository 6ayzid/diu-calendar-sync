import { NextRequest, NextResponse } from 'next/server';
import { fetchRoomDaySchedule } from '@/lib/room-scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const room = searchParams.get('room');
  const day = searchParams.get('day');

  if (!room) {
    return NextResponse.json(
      { error: 'Missing `room` parameter (e.g. room=KT-201)' },
      { status: 400 }
    );
  }

  if (!day) {
    return NextResponse.json(
      { error: 'Missing `day` parameter (e.g. day=Monday)' },
      { status: 400 }
    );
  }

  try {
    const schedule = await fetchRoomDaySchedule(room, day);

    const occupiedCount = schedule.filter((s) => s.occupied).length;
    const freeCount = schedule.length - occupiedCount;

    return NextResponse.json({
      success: true,
      room,
      day,
      occupiedSlots: occupiedCount,
      freeSlots: freeCount,
      schedule,
    });
  } catch (err) {
    console.error('Room occupancy API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch room occupancy from upstream' },
      { status: 502 }
    );
  }
}
