import { NextRequest } from 'next/server';
import { handleCalendarFeedRequest } from './route-helper';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sectionId = url.searchParams.get('section') || url.searchParams.get('id') || '';
  const subSection = url.searchParams.get('sub') || null;

  return handleCalendarFeedRequest(request, sectionId, subSection);
}
