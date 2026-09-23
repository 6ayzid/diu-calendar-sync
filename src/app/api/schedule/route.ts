import { NextRequest, NextResponse } from 'next/server';
import { getScheduleWithMeta, getSection, getScheduleForFacultyWithMeta } from '@/lib/schedule';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  // Check if teacher schedule requested
  const teacher = url.searchParams.get('teacher') || url.searchParams.get('t');
  if (teacher) {
    const { classes, version, faculty } = await getScheduleForFacultyWithMeta(teacher);
    const formattedVersion = version ? (version.toLowerCase().startsWith('v') ? version : `v${version}`) : 'v2.2';

    return NextResponse.json({
      success: true,
      mode: 'faculty',
      faculty,
      classes,
      version: formattedVersion,
    });
  }

  const sectionId = (url.searchParams.get('section') || '68_D').toUpperCase();
  const subSection = (url.searchParams.get('sub') || 'all') as '1' | '2' | 'all';

  const sectionMeta = getSection(sectionId);
  if (!sectionMeta) {
    return NextResponse.json(
      { success: false, error: `Section ${sectionId} not found` },
      { status: 404 }
    );
  }

  const { classes, version } = await getScheduleWithMeta(sectionId, subSection);
  const formattedVersion = version ? (version.toLowerCase().startsWith('v') ? version : `v${version}`) : 'v2.2';

  return NextResponse.json({
    success: true,
    mode: 'student',
    section: sectionMeta,
    classes,
    version: formattedVersion,
  });
}
