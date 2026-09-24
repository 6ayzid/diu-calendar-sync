import { robustFetch } from '../src/lib/robust-fetch';
import { getRoutineGatewayUrl } from '../src/lib/gateway-config';

async function main() {
  console.log('Testing GET /api/free-rooms with query params:');
  const params = [
    '?time_slot=10:00-11:30&day=Sunday&department=cse',
    '?time_slot=08:30-10:00&day=Sunday&department=cse',
    '?time_slot=11:30-01:00&day=Sunday&department=cse',
    '?time_slot=01:00-02:30&day=Sunday&department=cse',
  ];

  const gateway = getRoutineGatewayUrl();
  for (const p of params) {
    const res = await robustFetch(`${gateway}/api/free-rooms` + p);
    console.log(p, 'Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data).slice(0, 300));
  }
}

main().catch(console.error);
