import { generateScheduleForSection } from '../src/data/routines';
import { buildCalendarFeed, serializeCalendarToIcs } from '../src/lib/ical-builder';

console.log('Testing Schedule & iCal Engine...');

// Test 1: Section 68_D full
const schedule68D = generateScheduleForSection('68_D');
console.log(`68_D Total classes found: ${schedule68D.length}`);
const theoryCount = schedule68D.filter((c) => c.subSection === null).length;
const d1Lab = schedule68D.find((c) => c.subSection === '1');
const d2Lab = schedule68D.find((c) => c.subSection === '2');

console.log(`- Theory classes: ${theoryCount}`);
console.log(`- D1 Lab: ${d1Lab ? d1Lab.courseCode + ' on ' + d1Lab.dayOfWeek : 'None'}`);
console.log(`- D2 Lab: ${d2Lab ? d2Lab.courseCode + ' on ' + d2Lab.dayOfWeek : 'None'}`);

if (!d1Lab || !d2Lab) {
  console.error('ERROR: D1 or D2 lab missing!');
  process.exit(1);
}

// Test 2: Build Calendar feed for 68_D (D1 filter)
const d1Filtered = schedule68D.filter((c) => c.subSection === null || c.subSection === '1');
const calD1 = buildCalendarFeed(d1Filtered, {
  sectionId: '68_D',
  subSection: '1',
  timezone: 'Asia/Dhaka',
});

const icsText = serializeCalendarToIcs(calD1);

// Assertions on RFC 5545 compliance
const requiredSubstrings = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'X-WR-TIMEZONE:Asia/Dhaka',
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Dhaka',
  'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  'X-PUBLISHED-TTL:PT1H',
  'RRULE:FREQ=WEEKLY',
  'UID:slot-68_D-CSE228-common-SATURDAY-1000',
  'UID:slot-68_D-CSE22468D1-sub1-THURSDAY-0830',
  'TRIGGER:-PT15M',
  'END:VCALENDAR',
];

for (const sub of requiredSubstrings) {
  if (!icsText.includes(sub)) {
    console.error(`ERROR: Missing required iCal element: "${sub}"`);
    console.log(icsText.slice(0, 800));
    process.exit(1);
  }
}

// Assert D2 is NOT in D1 feed
if (icsText.includes('CSE224(68_D2)')) {
  console.error('ERROR: D2 lab leaked into D1 feed!');
  process.exit(1);
}

console.log('✓ All RFC 5545 checks passed successfully!');
