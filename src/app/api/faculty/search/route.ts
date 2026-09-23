import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveTeacherAutocomplete } from '@/lib/zohir-scraper';
import { searchAndRankFaculty, getFacultyByCode, registerDynamicFaculty } from '@/data/faculty';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return NextResponse.json({
      success: true,
      query: '',
      results: [],
    });
  }

  try {
    // 1. Query live upstream autocomplete from the active university routine service
    const liveResults = await fetchLiveTeacherAutocomplete(cleanQuery);

    // 2. Ensure each live result is registered in our dynamic faculty lookup
    for (const item of liveResults) {
      registerDynamicFaculty({
        code: item.code,
        name: item.name,
        department: 'CSE',
        designation: item.designation || 'Faculty Member',
      });
    }

    // 3. Search and rank across both static directory and newly registered dynamic faculty
    const ranked = searchAndRankFaculty(cleanQuery);

    // 4. Also check if the raw query matches a specific teacher code directly
    const directCode = cleanQuery.toUpperCase();
    const directMatch = getFacultyByCode(directCode);
    if (directMatch && !ranked.some((r) => r.faculty.code === directMatch.code)) {
      ranked.unshift({ faculty: directMatch, score: 0 });
    }

    // Return the top 15 matches formatted with live discovery indicator
    const formatted = ranked.slice(0, 15).map(({ faculty, score }) => {
      const isLiveDiscovered = liveResults.some(
        (lr) => lr.code.toUpperCase() === faculty.code.toUpperCase()
      );
      return {
        code: faculty.code,
        name: faculty.name,
        department: faculty.department || 'CSE',
        designation: faculty.designation || 'Faculty Member',
        aliases: faculty.aliases || [],
        isLiveDiscovered,
        score,
      };
    });

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      results: formatted,
    });
  } catch (error) {
    console.error('Faculty live search API error:', error);
    // Fallback gracefully to local directory search if network fails
    const ranked = searchAndRankFaculty(cleanQuery).slice(0, 12);
    return NextResponse.json({
      success: true,
      query: cleanQuery,
      results: ranked.map(({ faculty, score }) => ({
        code: faculty.code,
        name: faculty.name,
        department: faculty.department || 'CSE',
        designation: faculty.designation || 'Faculty Member',
        aliases: faculty.aliases || [],
        isLiveDiscovered: false,
        score,
      })),
      fallback: true,
    });
  }
}
