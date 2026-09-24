import { robustFetch } from '../src/lib/robust-fetch';
import { fetchLiveTeacherAutocomplete, fetchLiveTeacherScheduleFromUpstream } from '../src/lib/routine-gateway';
import { getScheduleForFacultyWithMeta } from '../src/lib/schedule';
import { getFacultyByCode, getAllFaculty } from '../src/data/faculty';
import { getRoutineGatewayUrl } from '../src/lib/gateway-config';

interface UpstreamApiResponse {
  success: boolean;
  result?: any[];
  batch?: string;
  version?: string;
  error?: string;
}

interface TeacherScheduleResponse {
  success?: boolean;
  teacher?: string;
  department?: string;
  version?: string;
  details?: {
    Name_Initial?: string;
    Designation?: string;
    Email?: string;
    Cell?: string;
    'Assigned Room Number'?: string;
  };
  schedule?: any[];
  days?: string[];
  error?: string;
}

const TEST_TARGETS = [
  // User specifically requested:
  'NRM',
  'YI',

  // Department heads and senior faculty:
  'SRH',
  'MSR',
  'SMAH',
  'MFH',
  'ZH',
  'SAH',

  // Frequently searched faculty:
  'AZA',
  'TN',
  'IM',
  'MP',
  'MAK',
  'DMAK',
  'NNM',
  'FZA',
  'NS',
  'AS',
  'AKC',
  'AAK',
  'ABA',
  'ACC',
  'SSK',
  'TRA',
  'SAK',
  'SMC',
  'AAS',
  'AAM',
  'AAR',
  'RAH',
];

async function runHeavyTests() {
  const gateway = getRoutineGatewayUrl();
  console.log('=================================================================');
  console.log('   HEAVY FACULTY TEST SUITE WITH ROUTINE GATEWAY');
  console.log('=================================================================\n');

  console.log(`Testing ${TEST_TARGETS.length} faculty targets directly against live backend...\n`);

  const results: Array<{
    code: string;
    name: string;
    autocompleteFound: boolean;
    autocompleteLabel?: string;
    postScheduleStatus: number;
    postClassesCount: number;
    getTeacherScheduleStatus: number;
    getClassesCount: number;
    resolvedClassesCount: number;
    version: string;
    sampleClass?: string;
  }> = [];

  for (const code of TEST_TARGETS) {
    process.stdout.write(`Testing [${code}]... `);

    // 1. Direct Autocomplete Query
    let autocompleteFound = false;
    let autocompleteLabel: string | undefined;
    try {
      const autoRes = await robustFetch<{ suggestions?: string[] }>(
        `${gateway}/api/search_autocomplete?query=${encodeURIComponent(code)}&view_mode=teacher&department=cse`,
        { timeout: 6000 }
      );
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        if (autoData.suggestions && autoData.suggestions.length > 0) {
          const match = autoData.suggestions.find(
            (s) => s.toUpperCase().includes(`(${code})`) || s.toUpperCase().startsWith(`${code} `)
          ) || autoData.suggestions[0];
          autocompleteFound = true;
          autocompleteLabel = match;
        }
      }
    } catch (e: any) {
      // ignore
    }

    // 2. Direct POST /api/schedule
    let postStatus = 0;
    let postClassesCount = 0;
    try {
      const postRes = await robustFetch<UpstreamApiResponse>(`${gateway}/api/schedule`, {
        method: 'POST',
        body: JSON.stringify({ view_mode: 'teacher', batch: code, department: 'cse' }),
        timeout: 8000,
      });
      postStatus = postRes.status;
      if (postRes.ok) {
        const postData = await postRes.json();
        if (postData.success && Array.isArray(postData.result)) {
          postClassesCount = postData.result.length;
        }
      }
    } catch (e: any) {
      postStatus = -1;
    }

    // 3. Direct GET /api/teacher-schedule
    let getStatus = 0;
    let getClassesCount = 0;
    try {
      const getRes = await robustFetch<TeacherScheduleResponse>(
        `${gateway}/api/teacher-schedule?teacher=${encodeURIComponent(code)}&department=cse`,
        { timeout: 8000 }
      );
      getStatus = getRes.status;
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.schedule && Array.isArray(getData.schedule)) {
          getClassesCount = getData.schedule.length;
        }
      }
    } catch (e: any) {
      getStatus = -1;
    }

    // 4. Full App Resolution (getScheduleForFacultyWithMeta)
    const resolved = await getScheduleForFacultyWithMeta(code);
    const resolvedClassesCount = resolved.classes.length;
    const sampleClass = resolved.classes[0]
      ? `${resolved.classes[0].courseCode} on ${resolved.classes[0].dayOfWeek} (${resolved.classes[0].startTime}-${resolved.classes[0].endTime}) in ${resolved.classes[0].room}`
      : 'None (0 classes scheduled)';

    console.log(
      `Resolved: ${resolvedClassesCount} classes | Version: ${resolved.version} | ${resolved.faculty.name}`
    );

    results.push({
      code,
      name: resolved.faculty.name,
      autocompleteFound,
      autocompleteLabel,
      postScheduleStatus: postStatus,
      postClassesCount,
      getTeacherScheduleStatus: getStatus,
      getClassesCount,
      resolvedClassesCount,
      version: resolved.version,
      sampleClass,
    });
  }

  console.log('\n=================================================================');
  console.log('   DETAILED RESULTS SUMMARY TABLE');
  console.log('=================================================================');
  console.table(
    results.map((r) => ({
      Code: r.code,
      Name: r.name.slice(0, 26),
      Autocomplete: r.autocompleteFound ? `✓ ${r.autocompleteLabel?.slice(0, 25)}` : '✗ Not in a-z',
      'POST /api/schedule': `${r.postScheduleStatus} (${r.postClassesCount} cls)`,
      'GET teacher-sched': `${r.getTeacherScheduleStatus} (${r.getClassesCount} cls)`,
      'Total Resolved': `${r.resolvedClassesCount} classes`,
    }))
  );

  console.log('\n=================================================================');
  console.log('   DEEP DIVE: USER-REQUESTED TARGETS (NRM & YI)');
  console.log('=================================================================');

  for (const target of ['NRM', 'YI']) {
    const r = results.find((x) => x.code === target);
    console.log(`\n--- TARGET [${target}] ---`);
    console.log(`Name in Directory: ${r?.name}`);
    console.log(`Autocomplete: ${r?.autocompleteLabel || 'None'}`);
    console.log(`POST /api/schedule: Status ${r?.postScheduleStatus}, ${r?.postClassesCount} classes`);
    console.log(`GET /api/teacher-schedule: Status ${r?.getTeacherScheduleStatus}, ${r?.getClassesCount} classes`);
    console.log(`Resolved Total Classes: ${r?.resolvedClassesCount}`);
    console.log(`Sample Class: ${r?.sampleClass}`);

    const fullSched = await getScheduleForFacultyWithMeta(target);
    if (fullSched.classes.length > 0) {
      console.log('All scheduled classes:');
      fullSched.classes.forEach((c, idx) => {
        console.log(
          `  ${idx + 1}. [${c.dayOfWeek}] ${c.courseCode}: ${c.courseTitle} | Room: ${c.room} | Time: ${c.startTime} - ${c.endTime} | Sec: ${c.sectionId}`
        );
      });
    } else {
      console.log(`Note: No classes scheduled this semester for ${target} in live routine.`);
    }
  }
}

runHeavyTests().catch((err) => {
  console.error('Heavy test failed:', err);
  process.exit(1);
});
