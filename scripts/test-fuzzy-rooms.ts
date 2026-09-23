import { ALL_CAMPUS_ROOMS, fuzzyMatchRoom } from '../src/data/rooms';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
}

console.log('=== Room Finder Fuzzy Search Verification ===\n');

// 1. Total rooms
console.log(`Total canonical campus rooms: ${ALL_CAMPUS_ROOMS.length}`);
assert(ALL_CAMPUS_ROOMS.length === 72, 'Expected exactly 72 campus rooms');

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
];

for (const { query, expectedIncludes } of cases) {
  const matched = ALL_CAMPUS_ROOMS.filter((r) => fuzzyMatchRoom(query, r)).map((r) => r.name);
  console.log(`Query: "${query}" -> matched ${matched.length} rooms`);
  for (const exp of expectedIncludes) {
    assert(matched.includes(exp), `Expected "${exp}" in matches for query "${query}"`);
  }
}

console.log('\n✓ All fuzzy search test assertions passed successfully!');
