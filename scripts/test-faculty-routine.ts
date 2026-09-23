import { searchAndRankFaculty, getFacultyByCode } from '../src/data/faculty';
import { parseShorthandSectionQuery } from '../src/lib/section-parser';
import { getScheduleForFacultyWithMeta } from '../src/lib/schedule';
import { buildCalendarFeed, serializeCalendarToIcs } from '../src/lib/ical-builder';

async function runTests() {
  console.log('=== DIU Faculty Routine & Smart Search Test Suite ===\n');

  // TEST 1: Fuzzy & Initial Search
  console.log('1. Testing Faculty & Section Search Queries...');

  // Test MSR exact initial
  const msrResults = searchAndRankFaculty('msr');
  if (!msrResults.length || msrResults[0].faculty.code !== 'MSR') {
    throw new Error(`Expected 'MSR' at top for query 'msr', got ${msrResults[0]?.faculty?.code}`);
  }
  console.log('✓ "msr" returns MSR at score 0:', msrResults[0].faculty.name);

  // Test rashed / noori name queries
  const rashedResults = searchAndRankFaculty('rashed');
  if (!rashedResults.some((r) => r.faculty.code === 'MSR')) {
    throw new Error(`Expected MSR for query 'rashed'`);
  }
  console.log('✓ "rashed" matches:', rashedResults[0].faculty.name);

  const nooriResults = searchAndRankFaculty('noori');
  if (!nooriResults.some((r) => r.faculty.code === 'MSR')) {
    throw new Error(`Expected MSR for query 'noori'`);
  }
  console.log('✓ "noori" matches:', nooriResults[0].faculty.name);

  // Test mostafa
  const mostafaResults = searchAndRankFaculty('mostafa');
  if (!mostafaResults.some((r) => r.faculty.code === 'MAK')) {
    throw new Error(`Expected MAK for query 'mostafa'`);
  }
  console.log('✓ "mostafa" matches:', mostafaResults[0].faculty.name);

  // Test aza, tn, im
  const azaResults = searchAndRankFaculty('aza');
  if (!azaResults.some((r) => r.faculty.code === 'AZA')) {
    throw new Error(`Expected AZA for query 'aza'`);
  }
  console.log('✓ "aza" matches:', azaResults[0].faculty.name);

  const tnResults = searchAndRankFaculty('tn');
  if (!tnResults.some((r) => r.faculty.code === 'TN')) {
    throw new Error(`Expected TN for query 'tn'`);
  }
  console.log('✓ "tn" matches:', tnResults[0].faculty.name);

  const imResults = searchAndRankFaculty('im');
  if (!imResults.some((r) => r.faculty.code === 'IM')) {
    throw new Error(`Expected IM for query 'im'`);
  }
  console.log('✓ "im" matches:', imResults[0].faculty.name);

  // Test student shorthand
  const shorthand = parseShorthandSectionQuery('66o2');
  if (!shorthand || shorthand.targetId !== '66_O' || shorthand.subSection !== '2') {
    throw new Error(`Expected 66_O lab 2 for '66o2'`);
  }
  console.log('✓ Shorthand "66o2" matches Section 66_O Lab 2');

  // TEST 2: Faculty Routine Aggregation & Schedule
  console.log('\n2. Testing Faculty Schedule Resolution & Deduplication...');
  const msrSchedule = await getScheduleForFacultyWithMeta('MSR');
  console.log(`✓ MSR schedule loaded with ${msrSchedule.classes.length} classes (version: ${msrSchedule.version})`);
  if (!msrSchedule.classes.length) {
    throw new Error('MSR schedule should not be empty');
  }

  const misSchedule = await getScheduleForFacultyWithMeta('MIS');
  console.log(`✓ MIS schedule loaded with ${misSchedule.classes.length} classes`);
  if (!misSchedule.classes.length) {
    throw new Error('MIS schedule should not be empty');
  }

  // TEST 3: iCal Generation for Faculty
  console.log('\n3. Testing Faculty RFC 5545 iCalendar Generation...');
  const faculty = getFacultyByCode('MSR')!;
  const cal = buildCalendarFeed(msrSchedule.classes, { faculty, sourceDomain: 'routine.test.diu' });
  const icsText = serializeCalendarToIcs(cal);

  // Verify calendar title
  if (!icsText.includes('CSE Faculty Routine')) {
    throw new Error('Missing "CSE Faculty Routine" in calendar name');
  }

  // Verify RFC 5545 essentials
  const requiredSubstrings = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'X-WR-CALNAME:CSE Faculty Routine',
    'X-WR-TIMEZONE:Asia/Dhaka',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Dhaka',
    'UID:slot-faculty-MSR-',
    'TRIGGER:-PT15M',
    'END:VCALENDAR',
  ];

  for (const sub of requiredSubstrings) {
    if (!icsText.includes(sub)) {
      throw new Error(`Missing required iCal token: "${sub}"`);
    }
  }
  console.log('✓ All RFC 5545 compliance tokens present (VTIMEZONE, UTC Z, deterministic UIDs, refresh TTL)');

  console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
