import { ALL_CAMPUS_ROOMS, fuzzyMatchRoom, resolveCanonicalRoomName } from '../src/data/rooms';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
}

console.log('=== Room Finder Fuzzy Search Verification ===\n');

// 1. Total rooms
console.log(`Total canonical campus rooms: ${ALL_CAMPUS_ROOMS.length}`);
assert(ALL_CAMPUS_ROOMS.length >= 72, 'Expected at least 72 campus rooms');

// 2. Exact & partial number searches
const cases: Array<{ query: string; expectedIncludes: string[] }> = [
  { query: '201', expectedIncludes: ['KT-201', 'ANX1-201'] },
  { query: 'kt201', expectedIncludes: ['KT-201'] },
  { query: 'kt-201', expectedIncludes: ['KT-201'] },
  { query: '307', expectedIncludes: ['KT-307', 'ANX1-307'] },
  { query: 'anx 307', expectedIncludes: ['ANX1-307'] },
  { query: 'anx307', expectedIncludes: ['ANX1-307'] },
  { query: 'anx1-307', expectedIncludes: ['ANX1-307'] },
  { query: '503', expectedIncludes: ['KT-503 (COM LAB)'] },
  { query: 'com lab', expectedIncludes: ['G1-001 (COM LAB)', 'KT-503 (COM LAB)'] },
  { query: 'physics', expectedIncludes: ['KT-804 (Physics Lab)'] },
  { query: 'embed', expectedIncludes: ['EMBED LAB-KT-301'] },
  { query: 'sh-105', expectedIncludes: ['SH-105 (E.C. & B.E. Lab)'] },
  { query: '004', expectedIncludes: ['G1-004 (COM LAB)'] },
  { query: '001', expectedIncludes: ['G1-001 (COM LAB)'] },
  { query: 'g1 004', expectedIncludes: ['G1-004 (COM LAB)'] },
  { query: '501', expectedIncludes: ['KT-501(A) (COM LAB)', 'KT-501(B) (COM LAB)'] },
  { query: '502', expectedIncludes: ['IOT LAB- KT-502'] },
  { query: 'sh 103', expectedIncludes: ['SH-103 (E.C. & B.E. Lab)'] },
  { query: '103', expectedIncludes: ['SH-103 (E.C. & B.E. Lab)', 'ANX1-103'] },
];

for (const { query, expectedIncludes } of cases) {
  const matched = ALL_CAMPUS_ROOMS.filter((r) => fuzzyMatchRoom(query, r)).map((r) => r.name);
  console.log(`Query: "${query}" -> matched ${matched.length} rooms`);
  for (const exp of expectedIncludes) {
    assert(matched.includes(exp), `Expected "${exp}" in matches for query "${query}"`);
  }
}

// 3. Test resolveCanonicalRoomName
console.log('\n=== Canonical Room Resolution Tests ===');
const canonicalCases = [
  { input: '004', expected: 'G1-004 (COM LAB)' },
  { input: '001', expected: 'G1-001 (COM LAB)' },
  { input: 'g1 004', expected: 'G1-004 (COM LAB)' },
  { input: 'g1-004', expected: 'G1-004 (COM LAB)' },
  { input: '502', expected: 'IOT LAB- KT-502' },
  { input: 'kt 502', expected: 'IOT LAB- KT-502' },
  { input: '501', expected: 'KT-501(A) (COM LAB)' },
  { input: 'kt-501(b)', expected: 'KT-501(B) (COM LAB)' },
  { input: '318', expected: 'KT-318(A)' },
  { input: 'sh 103', expected: 'SH-103 (E.C. & B.E. Lab)' },
  { input: '103', expected: 'SH-103 (E.C. & B.E. Lab)' },
  { input: 'anx 201', expected: 'ANX1-201' },
];

for (const { input, expected } of canonicalCases) {
  const actual = resolveCanonicalRoomName(input);
  console.log(`"${input}" -> "${actual}"`);
  assert(actual === expected, `Expected "${expected}" but got "${actual}" for input "${input}"`);
}

console.log('\n✓ All fuzzy search and canonical room assertions passed successfully!');
