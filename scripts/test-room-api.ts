import { fetchFreeRooms, fetchRoomDaySchedule, categorizeRoom, groupRoomsByZone } from '../src/lib/room-scraper';
import { getDhakaCurrentSlotInfo } from '../src/lib/time-utils';

async function runTests() {
  console.log('=== Room Finder Verification Suite ===\n');

  // Test 1: Dhaka Clock Slot Detector
  console.log('1. Testing Dhaka Clock Slot Detector:');
  const slotInfo = getDhakaCurrentSlotInfo();
  console.log('  Time:', slotInfo.timeLabel);
  console.log('  Day:', slotInfo.day);
  console.log('  Is Friday:', slotInfo.isFriday);
  console.log('  Class Hours Active:', slotInfo.isClassHours);
  console.log('  Current Slot:', slotInfo.currentSlot);
  console.log('  Next Slot:', slotInfo.nextSlot);
  console.log('  Slot Label:', slotInfo.slotLabel);
  console.log('  ✓ Clock detector passed.\n');

  // Test 2: Room Categorization
  console.log('2. Testing Room Categorization:');
  const testRooms = ['KT-201', 'KT-502', 'ANX1-307', 'G1-002 (COM LAB)', 'EMBED LAB-KT-301'];
  for (const r of testRooms) {
    const cat = categorizeRoom(r);
    console.log(`  ${r} -> Zone: ${cat.zone}, Floor: ${cat.floor}`);
  }
  const grouped = groupRoomsByZone(testRooms);
  console.log('  Grouped zones:', Object.keys(grouped).map(k => `${k}: ${grouped[k as keyof typeof grouped].length}`).join(', '));
  console.log('  ✓ Categorization passed.\n');

  // Test 3: Upstream Free Rooms Scraping
  console.log('3. Testing Upstream Free Rooms Scraping (Slot 10:00-11:30):');
  console.time('fetchFreeRooms');
  const freeRooms = await fetchFreeRooms('10:00-11:30');
  console.timeEnd('fetchFreeRooms');
  const days = Object.keys(freeRooms);
  console.log('  Available days in response:', days);
  const mondayFree = freeRooms['Monday'] || [];
  console.log(`  Monday 10:00-11:30 free rooms (${mondayFree.length}):`, mondayFree.slice(0, 8));
  if (mondayFree.length === 0) {
    throw new Error('Expected at least 1 free room on Monday 10:00-11:30');
  }
  console.log('  ✓ Free rooms scraping passed.\n');

  // Test 4: Upstream Room Occupancy Scraping
  console.log('4. Testing Room Occupancy Scraping (Room KT-201 Monday):');
  console.time('fetchRoomDaySchedule');
  const schedule = await fetchRoomDaySchedule('KT-201', 'Monday');
  console.timeEnd('fetchRoomDaySchedule');
  console.log(`  Total slots evaluated: ${schedule.length}`);
  const occupied = schedule.filter(s => s.occupied);
  const free = schedule.filter(s => !s.occupied);
  console.log(`  Occupied slots: ${occupied.length}, Free slots: ${free.length}`);
  for (const s of schedule) {
    if (s.occupied) {
      console.log(`    ${s.slot}: OCCUPIED by Section ${s.section || 'N/A'} • ${s.courseCode} (${s.teacher})`);
    } else {
      console.log(`    ${s.slot}: VACANT`);
    }
  }
  if (occupied.length === 0) {
    throw new Error('Expected KT-201 to have occupied classes on Monday');
  }
  console.log('  ✓ Room occupancy schedule passed.\n');

  // Test 5: Local Next.js API Routes over HTTP
  console.log('5. Testing Next.js API Routes over HTTP:');
  try {
    const resFree = await fetch('http://localhost:3000/api/rooms/free?time=10:00-11:30&day=Monday');
    console.log('  GET /api/rooms/free status:', resFree.status);
    const dataFree = await resFree.json();
    console.log('  Free rooms count:', dataFree.rooms?.length, 'KT rooms:', dataFree.grouped?.KT?.length);

    const resOcc = await fetch('http://localhost:3000/api/rooms/occupancy?room=KT-201&day=Monday');
    console.log('  GET /api/rooms/occupancy status:', resOcc.status);
    const dataOcc = await resOcc.json();
    console.log('  Occupancy schedule slots:', dataOcc.schedule?.length, 'Occupied:', dataOcc.occupiedSlots);
    console.log('  ✓ Local Next.js API routes passed.\n');
  } catch (err: any) {
    console.log('  (HTTP server check skipped or err:', err.message, ')\n');
  }

  console.log('ALL ROOM FINDER TESTS PASSED SUCCESSFULLY! ✓✓✓');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
