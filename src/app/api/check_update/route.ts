import { NextResponse } from 'next/server';
import { checkLiveUpstreamUpdate } from '@/lib/routine-gateway';
import officialRoutine from '@/data/official-routine.json';

function formatShortVersion(v?: string): string {
  if (!v) return 'v4.1';
  const match = v.match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
  return match ? `v${match[1]}` : (v.toLowerCase().startsWith('v') ? v : `v${v}`);
}

async function handleCheckUpdate(req?: Request) {
  try {
    const url = req ? new URL(req.url) : null;
    const syncParam = url?.searchParams.get('sync');
    // If explicitly specified ?sync=false, don't trigger sync; default to true for automatic update sync
    const triggerSync = syncParam !== 'false';

    const result = await checkLiveUpstreamUpdate(triggerSync);
    const cleanVersion = formatShortVersion(result.currentVersion || officialRoutine.version || '4.1');

    return NextResponse.json(
      {
        success: result.success,
        source: result.source || 'official_diu_noticeboard',
        update_available: result.updateAvailable,
        updateAvailable: result.updateAvailable,
        status: result.statusMessage,
        message: result.statusMessage,
        version: cleanVersion,
        rawVersion: result.currentVersion,
        upstreamVersion: result.upstreamVersion,
        updatedAt: result.updatedAt || '2026-10-02 09:28:00',
        syncedAt: result.syncedAt,
        syncedNow: Boolean(result.syncedNow),
        latest_official_release: result.latestOfficialRelease || null,
        latestOfficialRelease: result.latestOfficialRelease || null,
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
        update_available: false,
        updateAvailable: false,
        version: fallbackVersion,
        message: msg,
        status: msg,
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

export async function GET(req: Request) {
  return handleCheckUpdate(req);
}

export async function POST(req: Request) {
  return handleCheckUpdate(req);
}
