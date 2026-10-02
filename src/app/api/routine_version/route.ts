import { NextResponse } from 'next/server';
import { getUpstreamVersionMeta } from '@/lib/routine-gateway';
import officialRoutine from '@/data/official-routine.json';

function formatShortVersion(v?: string): string {
  if (!v) return 'v4.1';
  const match = v.match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
  return match ? `v${match[1]}` : (v.toLowerCase().startsWith('v') ? v : `v${v}`);
}

export async function GET() {
  try {
    const meta = await getUpstreamVersionMeta(true);
    const cleanVersion = formatShortVersion(meta.version || officialRoutine.version || '4.1');

    return NextResponse.json(
      {
        success: true,
        version: cleanVersion,
        rawVersion: meta.version || officialRoutine.version || '4.1',
        updatedAt: meta.updatedAt || '2026-10-02 09:28:00',
        syncedAt: meta.syncedAt || null,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    const fallbackVersion = formatShortVersion(officialRoutine.version || '4.1');
    return NextResponse.json(
      {
        success: true,
        version: fallbackVersion,
        rawVersion: officialRoutine.version || '4.1',
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}
