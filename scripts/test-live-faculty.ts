import { fetchLiveTeacherAutocomplete, fetchLiveTeacherScheduleFromUpstream } from '../src/lib/routine-gateway';
import { getScheduleForFacultyWithMeta } from '../src/lib/schedule';
import { getFacultyByCode, searchAndRankFaculty } from '../src/data/faculty';

async function main() {
  console.log('=== Testing Live Faculty Scraping & Auto-Discovery ===\n');

  // Test 1: Live Autocomplete search from upstream routine
  console.log('1. Testing Live Autocomplete for query "rash"...');
  const liveResults = await fetchLiveTeacherAutocomplete('rash');
  console.log(`Found ${liveResults.length} live suggestions:`, liveResults);
  if (!liveResults.some((r) => r.code === 'SRH' || r.code === 'MSR')) {
    throw new Error('Expected SRH or MSR in live suggestions for "rash"');
  }
  console.log('✓ Live autocomplete successfully discovered SRH from university database');

  // Test 2: Auto-registration in dynamic directory
  console.log('\n2. Testing dynamic faculty registration...');
  const srhMeta = getFacultyByCode('SRH');
  console.log('Registered SRH metadata:', srhMeta);
  if (!srhMeta) {
    throw new Error('Expected SRH to be registered in faculty directory');
  }
  console.log('✓ Dynamic faculty correctly registered and retrievable by initial');

  // Test 3: Live Schedule Scraping for SRH
  console.log('\n3. Testing Live Schedule for SRH...');
  const srhSched = await getScheduleForFacultyWithMeta('SRH');
  console.log(`✓ Loaded ${srhSched.classes.length} classes for SRH (version: ${srhSched.version})`);
  for (const c of srhSched.classes) {
    console.log(`  - [${c.dayOfWeek}] ${c.courseCode}: ${c.courseTitle} in Room ${c.room} (${c.startTime} - ${c.endTime})`);
  }
  if (srhSched.classes.length === 0) {
    throw new Error('Expected SRH to have active classes in live routine');
  }

  // Test 4: Live Schedule for teacher with 0 classes (e.g. SAH)
  console.log('\n4. Testing Teacher with 0 classes (verifying NO FAKE fallback classes)...');
  const sahSched = await getScheduleForFacultyWithMeta('SAH');
  console.log(`SAH classes count: ${sahSched.classes.length}`);
  if (sahSched.classes.length !== 0) {
    throw new Error(`Expected 0 classes for SAH, but got ${sahSched.classes.length} (fake fallback detected!)`);
  }
  console.log('✓ Confirmed 0 classes for inactive teacher — NO FAKE classes generated!');

  console.log('\n🎉 ALL LIVE FACULTY TESTS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
