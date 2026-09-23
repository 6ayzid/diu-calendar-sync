import { robustFetch } from '../src/lib/robust-fetch';

async function main() {
  const slots = [
    '08:30-10:00',
    '10:00-11:30',
    '11:30-01:00',
    '01:00-02:30',
    '02:30-04:00',
    '04:00-05:30'
  ];

  console.time('Parallel 6 slots query for KT-201 Monday');
  const results = await Promise.all(slots.map(async (slot) => {
    try {
      const res = await robustFetch('https://routine.zohirrayhan.me/api/schedule', {
        method: 'POST',
        body: JSON.stringify({
          view_mode: 'room',
          room_number: 'KT-201',
          day: 'Monday',
          time: slot,
          department: 'cse'
        })
      });
      if (res.ok) {
        const data = await res.json() as { result?: Array<{ course_code: string; course_title: string; teacher: string }> };
        return { slot, status: 'occupied', classes: data.result };
      } else {
        return { slot, status: 'empty', classes: [] };
      }
    } catch (e: any) {
      return { slot, status: 'error', error: e.message };
    }
  }));
  console.timeEnd('Parallel 6 slots query for KT-201 Monday');

  console.log('Room KT-201 Monday schedule:');
  for (const r of results) {
    if (r.status === 'occupied' && r.classes?.[0]) {
      const c = r.classes[0];
      console.log(`  ${r.slot}: [OCCUPIED] ${c.course_code} - ${c.course_title} (Teacher: ${c.teacher})`);
    } else {
      console.log(`  ${r.slot}: [FREE / EMPTY]`);
    }
  }
}

main().catch(console.error);
