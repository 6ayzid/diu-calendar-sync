import { GET } from '../src/app/api/faculty/info/route';
import { NextRequest } from 'next/server';

async function run() {
  for (const code of ['FZA', 'AUA', 'MRN', 'ASA']) {
    console.log(`\nTesting /api/faculty/info?code=${code}...`);
    const req = new NextRequest(`http://localhost:3000/api/faculty/info?code=${code}`);
    const res = await GET(req);
    const data = await res.json();
    console.log(code, 'status:', res.status, 'success:', data.success, 'faculty:', data.faculty);
  }
}
run();
