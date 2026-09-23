import { NextRequest } from 'next/server';
import { handleCalendarFeedRequest, handleFacultyCalendarFeedRequest } from './route-helper';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const teacher = url.searchParams.get('teacher') || url.searchParams.get('t');
  if (teacher) {
    return handleFacultyCalendarFeedRequest(request, teacher);
  }

  const sectionId = url.searchParams.get('section') || url.searchParams.get('id') || '';
  const subSection = url.searchParams.get('sub') || null;

  return handleCalendarFeedRequest(request, sectionId, subSection);
}

