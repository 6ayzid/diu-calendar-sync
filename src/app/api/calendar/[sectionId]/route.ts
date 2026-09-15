import { NextRequest } from 'next/server';
import { handleCalendarFeedRequest } from '../route-helper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await context.params;
  return handleCalendarFeedRequest(request, sectionId);
}
