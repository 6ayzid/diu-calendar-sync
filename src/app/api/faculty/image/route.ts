import { NextRequest, NextResponse } from 'next/server';
import facultyImages from '@/data/faculty-images.json';
import { getFacultyByCode } from '@/data/faculty';
import { getRoutineGatewayUrl } from '@/lib/gateway-config';

// In-memory binary image cache
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string }>();

export const dynamic = 'force-dynamic';

function generateInitialsSvg(code: string): { buffer: Buffer; contentType: string } {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    ['#059669', '#0284c7'], // Emerald to Sky
    ['#0d9488', '#2563eb'], // Teal to Blue
    ['#10b981', '#06b6d4'], // Radiant Emerald to Cyan
    ['#047857', '#0e7490'], // Deep Emerald to Deep Cyan
    ['#0891b2', '#4f46e5'], // Cyan to Indigo
    ['#0284c7', '#6366f1'], // Sky to Indigo
  ];
  const idx = Math.abs(hash) % palettes.length;
  const [colorA, colorB] = palettes[idx];
  const cleanInitials = code.slice(0, 4).toUpperCase();
  const fontSize = cleanInitials.length <= 2 ? 46 : cleanInitials.length === 3 ? 38 : 32;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g_${code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}" />
      <stop offset="100%" stop-color="${colorB}" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#g_${code})" />
  <text x="64" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="-0.5">
    ${cleanInitials}
  </text>
</svg>`;

  return {
    buffer: Buffer.from(svg),
    contentType: 'image/svg+xml',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || searchParams.get('c') || '').trim().toUpperCase();

  if (!code) {
    return new NextResponse('Faculty code is required', { status: 400 });
  }

  // 1. Check in-memory buffer cache
  const cached = imageBufferCache.get(code);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  }

  // 2. Resolve image URL from static records
  const imagesMap = facultyImages as Record<string, string>;
  const faculty = getFacultyByCode(code);
  let imageUrl = faculty?.image || imagesMap[code];

  // 3. Fallback: Resolve image URL from Cloudflare worker API
  if (!imageUrl || !imageUrl.startsWith('http')) {
    try {
      const gateway = getRoutineGatewayUrl() || 'https://diu-routine-api.6ayzid.workers.dev';
      const workerRes = await fetch(`${gateway}/api/teachers/${encodeURIComponent(code)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 86400 },
      });
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        const foundImage = workerData.teacher?.image || workerData.details?.Image;
        if (foundImage && typeof foundImage === 'string' && foundImage.startsWith('http')) {
          imageUrl = foundImage;
          imagesMap[code] = foundImage;
        }
      }
    } catch (err) {
      console.warn(`Upstream live image lookup failed for faculty ${code}:`, err);
    }
  }

  // 4. Fetch remote image if valid URL is available
  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Store in cache
        imageBufferCache.set(code, { buffer, contentType });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch photo from CDN for ${code}:`, err);
    }
  }

  // 5. High-fidelity Fallback: Serve crisp, branded SVG initials avatar
  const svgAvatar = generateInitialsSvg(code);
  imageBufferCache.set(code, svgAvatar);

  return new NextResponse(new Uint8Array(svgAvatar.buffer), {
    headers: {
      'Content-Type': svgAvatar.contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}
