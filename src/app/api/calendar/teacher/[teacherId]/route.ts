import { NextRequest } from 'next/server';
import { handleFacultyCalendarFeedRequest } from '../../route-helper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await context.params;
  return handleFacultyCalendarFeedRequest(request, teacherId);
}
