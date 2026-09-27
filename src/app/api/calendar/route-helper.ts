import { NextRequest, NextResponse } from 'next/server';
import { getScheduleWithMeta, getSection, getScheduleForFacultyWithMeta } from '@/lib/schedule';
import { buildCalendarFeed, serializeCalendarToIcs } from '@/lib/ical-builder';
import { getFacultyByCode } from '@/data/faculty';

export async function handleCalendarFeedRequest(
  req: NextRequest,
  rawSectionId: string,
  rawSubSection?: string | null
): Promise<Response> {
  if (!rawSectionId) {
    return new NextResponse('Missing section identifier. Example: /api/calendar/68_D', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Strip trailing .ics extension if passed (e.g. 68_D.ics or 66_O-sub2.ics)
  const cleanId = rawSectionId.trim().replace(/\.ics$/i, '');

  // Handle format like 68_D1 or 68-D1 where the last char is the subsection
  let sectionId = cleanId.toUpperCase().replace('-', '_');
  let subSection: '1' | '2' | 'all' | null =
    rawSubSection === '1' || rawSubSection === '2' || rawSubSection === 'all'
      ? rawSubSection
      : null;

  const subMatch = sectionId.match(/^([0-9]+_[A-Za-z])([12])$/);
  if (subMatch) {
    sectionId = subMatch[1];
    if (!subSection) {
      subSection = subMatch[2] as '1' | '2';
    }
  }

  // Validate section exists
  const sectionMeta = getSection(sectionId);
  if (!sectionMeta) {
    // Check if user accidentally passed a teacher code (e.g. /api/calendar/MSR)
    const facultyMeta = getFacultyByCode(cleanId);
    if (facultyMeta) {
      return handleFacultyCalendarFeedRequest(req, cleanId);
    }

    return new NextResponse(
      `Section "${rawSectionId}" not found. Available batches include Batch 63 through Batch 73. Example: 68_D, 70_Q, 72_B.`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  }

  // Query parameters: ?sub=1 or ?sub=2 or ?sub=all
  const url = new URL(req.url);
  const querySub = url.searchParams.get('sub');
  if (querySub === '1' || querySub === '2' || querySub === 'all') {
    subSection = querySub;
  }

  const host = req.headers.get('host') || 'schedule.campus.edu';

  // Fetch schedule with subsection filtering and version
  const { classes, version } = await getScheduleWithMeta(sectionId, subSection);

  // Generate RFC 5545 iCalendar string
  const calendar = buildCalendarFeed(classes, {
    sectionId,
    subSection,
    sourceDomain: host,
    routineVersion: version,
  });

  const icsOutput = serializeCalendarToIcs(calendar);
  const subFileSuffix = subSection && subSection !== 'all' ? `-sub${subSection}` : '';
  const filename = `${sectionId}${subFileSuffix}-routine.ics`;

  return new Response(icsOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      // RFC 5545 Live Feed edge-cache headers:
      // Cache for 4 hours on Vercel Edge CDN with background stale-while-revalidate.
      // This collapses thousands of student calendar polls into ~6 edge function calls per section/day.
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

/**
 * Handles iCalendar subscriptions for faculty routines
 * e.g., /api/calendar?teacher=MSR or /api/calendar/teacher/MSR.ics
 */
export async function handleFacultyCalendarFeedRequest(
  req: NextRequest,
  rawTeacherCode: string
): Promise<Response> {
  if (!rawTeacherCode) {
    return new NextResponse('Missing faculty identifier. Example: /api/calendar?teacher=MSR', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const cleanCode = rawTeacherCode.trim().replace(/\.ics$/i, '').toUpperCase();
  const faculty = getFacultyByCode(cleanCode) || {
    code: cleanCode,
    name: cleanCode,
    department: 'CSE',
  };

  const host = req.headers.get('host') || 'schedule.campus.edu';

  // Fetch schedule for faculty
  const { classes, version } = await getScheduleForFacultyWithMeta(cleanCode);

  // Generate RFC 5545 iCalendar string with faculty formatting
  const calendar = buildCalendarFeed(classes, {
    faculty,
    sourceDomain: host,
    routineVersion: version,
  });

  const icsOutput = serializeCalendarToIcs(calendar);
  const filename = `${faculty.code}-routine.ics`;

  return new Response(icsOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      // RFC 5545 Live Feed edge-cache headers for faculty:
      'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

