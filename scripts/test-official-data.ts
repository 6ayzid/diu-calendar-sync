import { getScheduleWithMeta, getScheduleForFacultyWithMeta } from '../src/lib/schedule';
import { fetchFreeRooms, fetchRoomDaySchedule } from '../src/lib/room-scraper';

async function test() {
  console.log('Testing section 68_D:');
  const s68 = await getScheduleWithMeta('68_D');
  console.log('Classes found:', s68.classes.length, 'version:', s68.version);
  console.log('Sample class:', s68.classes[0]);

  console.log('\nTesting faculty SRH:');
  const srh = await getScheduleForFacultyWithMeta('SRH');
  console.log('Classes found:', srh.classes.length, 'Faculty name:', srh.faculty.name);
  console.log('Sample faculty class:', srh.classes[0]);

  console.log('\nTesting Free Rooms (10:00-11:30):');
  const free = await fetchFreeRooms('10:00-11:30');
  console.log('Days available:', Object.keys(free));
  console.log('Saturday free rooms count:', free.Saturday?.length);

  console.log('\nTesting Room Day Schedule (KT-201, Saturday):');
  const roomSched = await fetchRoomDaySchedule('KT-201', 'Saturday');
  console.log('KT-201 Saturday slots:');
  for (const s of roomSched) {
    console.log(`  ${s.slot}: ${s.occupied ? `OCCUPIED by ${s.courseCode} (${s.teacher})` : 'FREE'}`);
  }
}

test().catch(console.error);
