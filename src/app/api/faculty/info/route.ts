import { NextRequest, NextResponse } from 'next/server';
import { fetchTeacherDetails } from '@/lib/zohir-scraper';
import { getFacultyByCode } from '@/data/faculty';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || searchParams.get('c') || '';
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return NextResponse.json(
      { success: false, error: 'Faculty code is required' },
      { status: 400 }
    );
  }

  try {
    const local = getFacultyByCode(cleanCode);
    let enrichedFaculty = local
      ? { ...local }
      : {
          code: cleanCode,
          name: cleanCode,
          department: 'CSE',
          designation: 'Faculty Member',
        };

    // If contact details are missing, fetch from live upstream with fast timeout
    const hasValidPhone = enrichedFaculty.phone && enrichedFaculty.phone.trim() !== '0' && enrichedFaculty.phone.trim().length > 4;
    const hasValidRoom = !!enrichedFaculty.room;

    if (!hasValidPhone || !hasValidRoom) {
      try {
        const details = await fetchTeacherDetails(cleanCode);
        if (details) {
          const detailPhone = details.phone?.trim();
          const validDetailPhone = detailPhone && detailPhone !== '0' && detailPhone.length > 4 ? detailPhone : undefined;

          enrichedFaculty = {
            ...enrichedFaculty,
            ...details,
            phone: validDetailPhone || enrichedFaculty.phone,
            room: details.room || enrichedFaculty.room,
          };
        }
      } catch (err) {
        console.warn('Live teacher details fetch error for', cleanCode, err);
      }
    }

    return NextResponse.json({
      success: true,
      faculty: enrichedFaculty,
      version: 'v2.2',
    });
  } catch (error) {
    console.error('Faculty info API error:', error);
    const fallback = getFacultyByCode(cleanCode) || {
      code: cleanCode,
      name: cleanCode,
      department: 'CSE',
    };
    return NextResponse.json({
      success: true,
      faculty: fallback,
      version: 'v2.2',
      fallback: true,
    });
  }
}
