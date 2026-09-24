import { robustFetch } from '../src/lib/robust-fetch';
import { getRoutineGatewayUrl } from '../src/lib/gateway-config';

async function main() {
  const gateway = getRoutineGatewayUrl();
  console.log('1. Testing /get_time_slots:');
  try {
    const res1 = await robustFetch(`${gateway}/get_time_slots?department=cse`);
    console.log('Status:', res1.status);
    const data1 = await res1.json();
    console.log('Time slots:', data1);
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  console.log('\n2. Testing /api/free-rooms?time=...:');
  try {
    const res2 = await robustFetch(`${gateway}/api/free-rooms?time=10:00-11:30&department=cse`);
    console.log('Status:', res2.status);
    const data2 = await res2.json();
    console.log('Free rooms response:', JSON.stringify(data2).slice(0, 400));
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  console.log('\n3. Testing roomSearch POST /api/schedule with KT-503:');
  try {
    const res3 = await robustFetch(`${gateway}/api/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        view_mode: 'room',
        room_number: 'KT-503',
        day: 'Sunday',
        time: '10:00-01:00',
        department: 'cse'
      })
    });
    console.log('Status:', res3.status);
    const data3 = await res3.json();
    console.log('Room search response:', JSON.stringify(data3).slice(0, 400));
  } catch (e: any) {
    console.log('Error:', e.message);
  }

  console.log('\n4. Testing room full schedule with view_mode room and batch:');
  try {
    const res4 = await robustFetch(`${gateway}/api/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        view_mode: 'room',
        room_number: 'KT-201',
        day: 'Monday',
        time: '10:00-11:30',
        department: 'cse'
      })
    });
    console.log('Status:', res4.status);
    const data4 = await res4.json();
    console.log('Room search 2 response:', JSON.stringify(data4).slice(0, 400));
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

main().catch(console.error);
