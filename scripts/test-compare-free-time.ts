import { calculateSharedFreeTime, getTotalSharedFreeHours, parseTargetParam, targetToParamString, getTargetLabel, areTargetsEqual, getDayOffStatus } from '../src/lib/compare-utils';
import { generateScheduleForSection } from '../src/data/routines';
import { getScheduleForFacultyWithMeta } from '../src/lib/schedule';
import { getFacultyByCode } from '../src/data/faculty';
import { RoutineClass, DayOfWeek } from '../src/types/schedule';

async function runTests() {
  console.log('=== DIU Routine Compare & Shared Free Time Test Suite ===\n');

  // TEST 1: URL Parameter Parsing & Serialization
  console.log('1. Testing URL Target Parsing and Serialization...');

  const t1 = parseTargetParam('MSR');
  if (!t1 || t1.type !== 'faculty' || t1.faculty.code !== 'MSR') {
    throw new Error(`Failed to parse faculty 'MSR', got: ${JSON.stringify(t1)}`);
  }
  console.log('✓ parseTargetParam("MSR") -> Faculty:', t1.faculty.code);

  const t2 = parseTargetParam('faculty:AZA');
  if (!t2 || t2.type !== 'faculty' || t2.faculty.code !== 'AZA') {
    throw new Error(`Failed to parse 'faculty:AZA'`);
  }
  console.log('✓ parseTargetParam("faculty:AZA") -> Faculty:', t2.faculty.code);

  const t3 = parseTargetParam('68_D');
  if (!t3 || t3.type !== 'section' || t3.section.id !== '68_D' || t3.subSection !== 'all') {
    throw new Error(`Failed to parse section '68_D', got: ${JSON.stringify(t3)}`);
  }
  console.log('✓ parseTargetParam("68_D") -> Section:', t3.section.id);

  const t4 = parseTargetParam('68_D:2');
  if (!t4 || t4.type !== 'section' || t4.section.id !== '68_D' || t4.subSection !== '2') {
    throw new Error(`Failed to parse section '68_D:2', got: ${JSON.stringify(t4)}`);
  }
  console.log('✓ parseTargetParam("68_D:2") -> Section:', t4.section.id, 'Sub:', t4.subSection);

  // Serialization roundtrip
  if (targetToParamString(t1) !== 'MSR') {
    throw new Error(`Expected serialized target 'MSR', got ${targetToParamString(t1)}`);
  }
  if (targetToParamString(t3) !== '68_D') {
    throw new Error(`Expected serialized target '68_D', got ${targetToParamString(t3)}`);
  }
  if (targetToParamString(t4) !== '68_D:2') {
    throw new Error(`Expected serialized target '68_D:2', got ${targetToParamString(t4)}`);
  }
  console.log('✓ Serialization roundtrips match exactly');

  // Equality check
  if (!areTargetsEqual(t1, { type: 'faculty', faculty: getFacultyByCode('msr')! })) {
    throw new Error('Target equality check failed for case-insensitive faculty');
  }
  if (areTargetsEqual(t1, t2)) {
    throw new Error('Distinct faculty reported as equal');
  }
  console.log('✓ areTargetsEqual correctly differentiates entities\n');

  // TEST 2: Shared Free Time Calculation (Synthetic Scenarios)
  console.log('2. Testing calculateSharedFreeTime with Synthetic Scenarios...');

  const mockClassA: RoutineClass = {
    id: 'a1',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    courseCode: 'CSE101',
    courseTitle: 'Intro',
    teacherCode: 'ABC',
    room: 'KT-101',
    dayOfWeek: 'SATURDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    subSection: null,
  };

  const mockClassB: RoutineClass = {
    id: 'b1',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    courseCode: 'CSE102',
    courseTitle: 'Lab',
    teacherCode: 'XYZ',
    room: 'KT-102',
    dayOfWeek: 'SATURDAY',
    startTime: '10:00',
    endTime: '11:30',
    type: 'Lab',
    subSection: null,
  };

  const satFree = calculateSharedFreeTime([mockClassA], [mockClassB], 30)['SATURDAY'];
  if (satFree.length !== 1) {
    throw new Error(`Expected 1 free slot on Saturday, got ${satFree.length}`);
  }
  if (satFree[0].startTime !== '11:30' || satFree[0].endTime !== '17:30') {
    throw new Error(`Expected 11:30 to 17:30 free slot, got ${satFree[0].startTime} to ${satFree[0].endTime}`);
  }
  if (satFree[0].durationMinutes !== 360) {
    throw new Error(`Expected 360 mins, got ${satFree[0].durationMinutes}`);
  }
  console.log('✓ Contiguous busy periods correctly merged: free window 11:30 to 17:30 (6.0h)');

  // Intermediate free window: A busy 08:30-10:00, B busy 13:00-14:30
  const mockClassB2: RoutineClass = {
    ...mockClassB,
    startTime: '13:00',
    endTime: '14:30',
  };
  const splitFree = calculateSharedFreeTime([mockClassA], [mockClassB2], 30)['SATURDAY'];
  if (splitFree.length !== 2) {
    throw new Error(`Expected 2 free slots, got ${splitFree.length}`);
  }
  if (splitFree[0].startTime !== '10:00' || splitFree[0].endTime !== '13:00') {
    throw new Error(`Expected slot 1 10:00-13:00, got ${splitFree[0].startTime}-${splitFree[0].endTime}`);
  }
  if (splitFree[1].startTime !== '14:30' || splitFree[1].endTime !== '17:30') {
    throw new Error(`Expected slot 2 14:30-17:30, got ${splitFree[1].startTime}-${splitFree[1].endTime}`);
  }
  console.log('✓ Disjoint periods produce multiple free windows: 10:00–13:00 (3h) & 14:30–17:30 (3h)');

  // Days with no classes for any group: must NOT yield free slots (it is an off day!)
  const emptyDayFree = calculateSharedFreeTime([], [], 30)['SUNDAY'];
  if (emptyDayFree.length !== 0) {
    throw new Error(`Expected 0 free slots on off day with no classes, got ${emptyDayFree.length}`);
  }
  console.log('✓ Off day yields 0 free slots (off-days do not show free slots)');

  // If one entity has classes and the other has none on that day, it is an off day for that group -> 0 free slots
  const oneSideOffFree = calculateSharedFreeTime([mockClassA], [], 30)['SATURDAY'];
  if (oneSideOffFree.length !== 0) {
    throw new Error(`Expected 0 free slots when one entity has no classes, got ${oneSideOffFree.length}`);
  }
  console.log('✓ Day with no classes for any group correctly yields 0 free slots\n');

  // TEST 3: Real Routine Comparison
  console.log('3. Testing Real Routines: Section 68_D vs Faculty MSR...');
  const sec68DSchedule = generateScheduleForSection('68_D');
  const msrMeta = await getScheduleForFacultyWithMeta('MSR');

  if (!msrMeta || !msrMeta.classes.length) {
    throw new Error('Failed to load MSR faculty classes');
  }

  const realCompareMap = calculateSharedFreeTime(sec68DSchedule, msrMeta.classes, 30);
  const totalFree = getTotalSharedFreeHours(realCompareMap);

  console.log(`✓ Real comparison between 68_D (${sec68DSchedule.length} classes) and MSR (${msrMeta.classes.length} classes):`);
  console.log(`  - Total Free Hours across week: ${totalFree.formattedHours}`);
  console.log(`  - Total Free Slots: ${totalFree.slotCount}`);

  const days: DayOfWeek[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];
  for (const d of days) {
    const slots = realCompareMap[d];
    if (slots.length > 0) {
      console.log(`  - ${d}: ${slots.map((s) => s.formattedRange).join(', ')}`);
    }
  }

  // Label helpers
  const labelA = getTargetLabel(t3);
  const labelB = getTargetLabel(t1);
  console.log('\n✓ getTargetLabel for 68_D:', labelA);
  console.log('✓ getTargetLabel for MSR:', labelB);

  // Check which day is an off day
  const daysOff68D = days.filter((d) => !sec68DSchedule.some((c) => c.dayOfWeek === d));
  const daysOffMSR = days.filter((d) => !msrMeta.classes.some((c) => c.dayOfWeek === d));
  console.log('Days with 0 classes for 68_D:', daysOff68D);
  console.log('Days with 0 classes for MSR:', daysOffMSR);

  const testOffDay = daysOffMSR[0] || daysOff68D[0];
  const offStatus = getDayOffStatus(testOffDay, sec68DSchedule, msrMeta.classes, true, t3, t1);
  if (!offStatus.isOffDay) {
    throw new Error(`Expected ${testOffDay} to be recognized as an off day`);
  }
  console.log(`✓ getDayOffStatus correctly identifies ${testOffDay} off day:`, offStatus.label);

  console.log('\n=== All Routine Compare Tests Passed Successfully! ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
