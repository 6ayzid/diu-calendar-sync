import { NextResponse } from 'next/server';
import officialRoutine from '@/data/official-routine.json';
import { RoutineClass } from '@/types/schedule';
import { encodeCompactRoutineBundle } from '@/lib/offline-bundle';

export async function GET() {
  const sections = officialRoutine.sections as Record<string, RoutineClass[]>;
  const version = officialRoutine.version || 'v5.1';
  const compactBundle = encodeCompactRoutineBundle(sections, version);

  return NextResponse.json(compactBundle, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
