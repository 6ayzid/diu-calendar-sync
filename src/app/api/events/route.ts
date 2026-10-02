import { NextRequest, NextResponse } from 'next/server';
import { getEventOverridesForSection, getAllEventOverrides } from '@/lib/event-overrides';
import { ClassEventOverride } from '@/types/events';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  try {
    if (section) {
      const events = await getEventOverridesForSection(section);
      return NextResponse.json({
        success: true,
        section,
        count: events.length,
        events,
      });
    }

    const allEvents = await getAllEventOverrides();
    return NextResponse.json({
      success: true,
      count: allEvents.length,
      events: allEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, date, courseCode, title, type = 'quiz', description, room, key } = body;

    // Optional admin/CR key check if configured in environment
    const expectedKey = process.env.CR_SYNC_KEY || process.env.CR_ADMIN_KEY;
    if (expectedKey && key !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid CR secret key' },
        { status: 401 }
      );
    }

    if (!sectionId || !date || !courseCode || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: sectionId, date (YYYY-MM-DD), courseCode, title',
        },
        { status: 400 }
      );
    }

    const newEvent: ClassEventOverride = {
      id: `override-${sectionId}-${courseCode}-${date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      sectionId: sectionId.toUpperCase().replace('-', '_'),
      date,
      courseCode: courseCode.trim().toUpperCase(),
      type,
      title,
      description: description || undefined,
      room: room || undefined,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Event override created successfully',
      event: newEvent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Invalid payload' },
      { status: 400 }
    );
  }
}
