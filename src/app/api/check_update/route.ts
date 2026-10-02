import { NextResponse } from 'next/server';
import { checkLiveUpstreamUpdate } from '@/lib/routine-gateway';
import officialRoutine from '@/data/official-routine.json';

function formatShortVersion(v?: string): string {
  if (!v) return 'v4.1';
  const match = v.match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
  return match ? `v${match[1]}` : (v.toLowerCase().startsWith('v') ? v : `v${v}`);
}

async function handleCheckUpdate() {
  try {
    const result = await checkLiveUpstreamUpdate(true);
    const cleanVersion = formatShortVersion(result.currentVersion || officialRoutine.version || '4.1');

    return NextResponse.json(
      {
        success: result.success,
        updateAvailable: result.updateAvailable,
        version: cleanVersion,
        rawVersion: result.currentVersion,
        upstreamVersion: result.upstreamVersion,
        updatedAt: result.updatedAt || '2026-10-02 09:28:00',
        syncedAt: result.syncedAt,
        message: result.statusMessage,
        syncedNow: Boolean(result.syncedNow),
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to check upstream';
    const fallbackVersion = formatShortVersion(officialRoutine.version || '4.1');

    return NextResponse.json(
      {
        success: false,
        updateAvailable: false,
        version: fallbackVersion,
        message: msg,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  }
}

export async function GET() {
  return handleCheckUpdate();
}

export async function POST() {
  return handleCheckUpdate();
}
