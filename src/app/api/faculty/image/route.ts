import { NextRequest, NextResponse } from 'next/server';
import facultyImages from '@/data/faculty-images.json';
import { getFacultyByCode } from '@/data/faculty';

// In-memory binary image cache
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string }>();

export const dynamic = 'force-dynamic';

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

  // 2. Resolve image URL
  const imagesMap = facultyImages as Record<string, string>;
  const faculty = getFacultyByCode(code);
  const imageUrl = faculty?.image || imagesMap[code];

  if (!imageUrl) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // 3. Fetch remote image and cache
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: res.status });
    }

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
  } catch (err) {
    console.warn(`Failed to fetch image for faculty ${code}:`, err);
    return new NextResponse('Error loading image', { status: 502 });
  }
}
