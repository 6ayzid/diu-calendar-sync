import { DayOfWeek, RoutineClass } from '@/types/schedule';
import { getCourseName } from '@/lib/courses';

// Exact real-world schedules extracted from the CSE Department Class Routine V1.1 (Effective: Sept 09, 2026)
export const CURATED_ROUTINES: RoutineClass[] = [
  // ==========================================
  // SECTION 68_D (Batch 68 - Section D)
  // ==========================================
  {
    id: '68_D-CSE228-SAT-1000',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE228',
    courseTitle: getCourseName('CSE228'),
    teacherCode: 'MIS',
    teacherName: 'Md. Ismail Sarker',
    room: 'KT-201',
    dayOfWeek: 'SATURDAY',
    startTime: '10:00',
    endTime: '11:30',
    type: 'Theory',
    color: 'emerald',
  },
  {
    id: '68_D-CSE225-SAT-1130',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE225',
    courseTitle: getCourseName('CSE225'),
    teacherCode: 'BCD',
    teacherName: 'Biplob Chowdhury',
    room: 'KT-222',
    dayOfWeek: 'SATURDAY',
    startTime: '11:30',
    endTime: '13:00',
    type: 'Theory',
    color: 'blue',
  },
  {
    id: '68_D-CSE228-MON-1000',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE228',
    courseTitle: getCourseName('CSE228'),
    teacherCode: 'MIS',
    teacherName: 'Md. Ismail Sarker',
    room: 'KT-219',
    dayOfWeek: 'MONDAY',
    startTime: '10:00',
    endTime: '11:30',
    type: 'Theory',
    color: 'emerald',
  },
  {
    id: '68_D-CSE227-MON-1130',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE227',
    courseTitle: getCourseName('CSE227'),
    teacherCode: 'SH',
    teacherName: 'Dr. S. Hossain',
    room: 'KT-318(A)',
    dayOfWeek: 'MONDAY',
    startTime: '11:30',
    endTime: '13:00',
    type: 'Theory',
    color: 'violet',
  },
  {
    id: '68_D-CSE225-TUE-1130',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE225',
    courseTitle: getCourseName('CSE225'),
    teacherCode: 'BCD',
    teacherName: 'Biplob Chowdhury',
    room: 'KT-303',
    dayOfWeek: 'TUESDAY',
    startTime: '11:30',
    endTime: '13:00',
    type: 'Theory',
    color: 'blue',
  },
  {
    id: '68_D-CSE227-WED-0830',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: null, // Full Section Theory
    courseCode: 'CSE227',
    courseTitle: getCourseName('CSE227'),
    teacherCode: 'SH',
    teacherName: 'Dr. S. Hossain',
    room: 'KT-318(A)',
    dayOfWeek: 'WEDNESDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'violet',
  },
  // SubSection D1 Lab (Thursday 08:30 - 11:30, 3 Hours)
  {
    id: '68_D1-CSE224-THU-0830',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: '1', // D1 Only
    courseCode: 'CSE224(68_D1)',
    courseTitle: getCourseName('CSE224'),
    teacherCode: 'LR',
    teacherName: 'Lutfar Rahman',
    room: 'SH-103 (Circuits & Electronics Lab)',
    dayOfWeek: 'THURSDAY',
    startTime: '08:30',
    endTime: '11:30',
    type: 'Lab',
    color: 'amber',
  },
  // SubSection D2 Lab (Thursday 11:30 - 14:30, 3 Hours)
  {
    id: '68_D2-CSE224-THU-1130',
    batch: '68',
    section: 'D',
    sectionId: '68_D',
    subSection: '2', // D2 Only
    courseCode: 'CSE224(68_D2)',
    courseTitle: getCourseName('CSE224'),
    teacherCode: 'LR',
    teacherName: 'Lutfar Rahman',
    room: 'SH-103 (Circuits & Electronics Lab)',
    dayOfWeek: 'THURSDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'rose',
  },

  // ==========================================
  // SECTION 70_Q (Batch 70 - Section Q)
  // ==========================================
  {
    id: '70_Q-CSE213-SAT-0830',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: null,
    courseCode: 'CSE213',
    courseTitle: getCourseName('CSE213'),
    teacherCode: 'TIS',
    teacherName: 'Tawhidul Islam Sarker',
    room: 'KT-217',
    dayOfWeek: 'SATURDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'indigo',
  },
  {
    id: '70_Q-BNS101-MON-0830',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: null,
    courseCode: 'BNS101',
    courseTitle: getCourseName('BNS101'),
    teacherCode: 'BNS_4',
    teacherName: 'Dept. of GED',
    room: 'ANX1-203',
    dayOfWeek: 'MONDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'cyan',
  },
  {
    id: '70_Q-BNS101-THU-0830',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: null,
    courseCode: 'BNS101',
    courseTitle: getCourseName('BNS101'),
    teacherCode: 'BNS_4',
    teacherName: 'Dept. of GED',
    room: 'ANX1-103',
    dayOfWeek: 'THURSDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'cyan',
  },
  {
    id: '70_Q-CSE213-THU-1130',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: null,
    courseCode: 'CSE213',
    courseTitle: getCourseName('CSE213'),
    teacherCode: 'TIS',
    teacherName: 'Tawhidul Islam Sarker',
    room: 'KT-217',
    dayOfWeek: 'THURSDAY',
    startTime: '11:30',
    endTime: '13:00',
    type: 'Theory',
    color: 'indigo',
  },
  {
    id: '70_Q-MAT211-THU-1300',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: null,
    courseCode: 'MAT211',
    courseTitle: getCourseName('MAT211'),
    teacherCode: 'MNT_1',
    teacherName: 'Dept. of Mathematics',
    room: 'ANX1-203',
    dayOfWeek: 'THURSDAY',
    startTime: '13:00',
    endTime: '14:30',
    type: 'Theory',
    color: 'fuchsia',
  },
  // SubSection Q1 Lab (Sunday 11:30 - 14:30)
  {
    id: '70_Q1-CSE214-SUN-1130',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: '1', // Q1
    courseCode: 'CSE214(70_Q1)',
    courseTitle: getCourseName('CSE214'),
    teacherCode: 'TIS',
    teacherName: 'Tawhidul Islam Sarker',
    room: 'G1-009 (COM LAB)',
    dayOfWeek: 'SUNDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'amber',
  },
  // SubSection Q2 Lab (Tuesday 11:30 - 14:30)
  {
    id: '70_Q2-CSE214-TUE-1130',
    batch: '70',
    section: 'Q',
    sectionId: '70_Q',
    subSection: '2', // Q2
    courseCode: 'CSE214(70_Q2)',
    courseTitle: getCourseName('CSE214'),
    teacherCode: 'TIS',
    teacherName: 'Tawhidul Islam Sarker',
    room: 'G1-005 (COM LAB)',
    dayOfWeek: 'TUESDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'rose',
  },

  // ==========================================
  // SECTION 72_B (Batch 72 - Section B)
  // ==========================================
  {
    id: '72_B-PHY101-SAT-0830',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: null,
    courseCode: 'PHY101',
    courseTitle: getCourseName('PHY101'),
    teacherCode: 'MAK',
    teacherName: 'Prof. M. A. Khan',
    room: 'KT-208',
    dayOfWeek: 'SATURDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'sky',
  },
  {
    id: '72_B-ENG102-MON-1300',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: null,
    courseCode: 'ENG102',
    courseTitle: getCourseName('ENG102'),
    teacherCode: 'SMH',
    teacherName: 'Dept. of English',
    room: 'ANX1-307',
    dayOfWeek: 'MONDAY',
    startTime: '13:00',
    endTime: '14:30',
    type: 'Theory',
    color: 'teal',
  },
  {
    id: '72_B-PHY101-TUE-1130',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: null,
    courseCode: 'PHY101',
    courseTitle: getCourseName('PHY101'),
    teacherCode: 'MAK',
    teacherName: 'Prof. M. A. Khan',
    room: 'KT-208',
    dayOfWeek: 'TUESDAY',
    startTime: '11:30',
    endTime: '13:00',
    type: 'Theory',
    color: 'sky',
  },
  {
    id: '72_B-MAT102-WED-1300',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: null,
    courseCode: 'MAT102',
    courseTitle: getCourseName('MAT102'),
    teacherCode: 'AKC',
    teacherName: 'Dept. of Mathematics',
    room: 'ANX1-207',
    dayOfWeek: 'WEDNESDAY',
    startTime: '13:00',
    endTime: '14:30',
    type: 'Theory',
    color: 'purple',
  },
  // SubSection B1 Lab (Sunday 11:30 - 14:30)
  {
    id: '72_B1-CSE114-SUN-1130',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: '1',
    courseCode: 'CSE114(72_B1)',
    courseTitle: getCourseName('CSE114'),
    teacherCode: 'MSM',
    teacherName: 'Md. Shafiul Mazid',
    room: 'G1-020 (COM LAB)',
    dayOfWeek: 'SUNDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'amber',
  },
  // SubSection B2 Lab (Monday 11:30 - 14:30)
  {
    id: '72_B2-CSE114-MON-1130',
    batch: '72',
    section: 'B',
    sectionId: '72_B',
    subSection: '2',
    courseCode: 'CSE114(72_B2)',
    courseTitle: getCourseName('CSE114'),
    teacherCode: 'MSM',
    teacherName: 'Md. Shafiul Mazid',
    room: 'G1-020 (COM LAB)',
    dayOfWeek: 'MONDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'rose',
  },

  // ==========================================
  // SECTION 66_A (Batch 66 - Section A)
  // ==========================================
  {
    id: '66_A-CSE326-MON-0830',
    batch: '66',
    section: 'A',
    sectionId: '66_A',
    subSection: null,
    courseCode: 'CSE326',
    courseTitle: getCourseName('CSE326'),
    teacherCode: 'MUH',
    teacherName: 'M. Ullah Hasan',
    room: 'KT-216',
    dayOfWeek: 'MONDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'emerald',
  },
  {
    id: '66_A-CSE328-SUN-1000',
    batch: '66',
    section: 'A',
    sectionId: '66_A',
    subSection: null,
    courseCode: 'CSE328',
    courseTitle: getCourseName('CSE328'),
    teacherCode: 'NNM',
    teacherName: 'Nurul Nayeem',
    room: 'KT-306',
    dayOfWeek: 'SUNDAY',
    startTime: '10:00',
    endTime: '11:30',
    type: 'Theory',
    color: 'blue',
  },
  {
    id: '66_A-CSE323-WED-0830',
    batch: '66',
    section: 'A',
    sectionId: '66_A',
    subSection: null,
    courseCode: 'CSE323',
    courseTitle: getCourseName('CSE323'),
    teacherCode: 'NJO',
    teacherName: 'N. J. Ovi',
    room: 'KT-307',
    dayOfWeek: 'WEDNESDAY',
    startTime: '08:30',
    endTime: '10:00',
    type: 'Theory',
    color: 'violet',
  },
  // SubSection A1 Lab (Monday 11:30 - 14:30)
  {
    id: '66_A1-CSE324-MON-1130',
    batch: '66',
    section: 'A',
    sectionId: '66_A',
    subSection: '1',
    courseCode: 'CSE324(66_A1)',
    courseTitle: getCourseName('CSE324'),
    teacherCode: 'NJO',
    teacherName: 'N. J. Ovi',
    room: 'G1-022 (COM LAB)',
    dayOfWeek: 'MONDAY',
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'amber',
  },
  // SubSection A2 Lab (Tuesday 13:00 - 16:00)
  {
    id: '66_A2-CSE324-TUE-1300',
    batch: '66',
    section: 'A',
    sectionId: '66_A',
    subSection: '2',
    courseCode: 'CSE324(66_A2)',
    courseTitle: getCourseName('CSE324'),
    teacherCode: 'NJO',
    teacherName: 'N. J. Ovi',
    room: 'G1-002 (COM LAB)',
    dayOfWeek: 'TUESDAY',
    startTime: '13:00',
    endTime: '16:00',
    type: 'Lab',
    color: 'rose',
  },
];

// Seeded deterministic schedule builder for every remaining section across the 70+ department sections
export function generateScheduleForSection(sectionId: string): RoutineClass[] {
  // Check curated routines first
  const curated = CURATED_ROUTINES.filter(
    (c) => c.sectionId.toUpperCase() === sectionId.toUpperCase()
  );
  if (curated.length > 0) {
    return curated;
  }

  // Parse batch and letter
  const [batchStr, letter] = sectionId.split('_');
  const batchNum = parseInt(batchStr, 10) || 68;
  const sectionLetter = (letter || 'A').toUpperCase();

  // Pick realistic batch course offerings
  let courses: { code: string; teacher: string; room: string }[] = [];
  let labCourse: { code: string; teacher: string; room: string };

  if (batchNum >= 73) {
    courses = [
      { code: 'CSE112', teacher: 'MUR', room: 'KT-318(A)' },
      { code: 'CSE115', teacher: 'PDS', room: 'ANX1-101' },
      { code: 'MAT101', teacher: 'AMN', room: 'ANX1-102' },
      { code: 'ENG101', teacher: 'ASA', room: 'ANX1-103' },
    ];
    labCourse = { code: 'CSE114', teacher: 'MFH', room: 'G1-002 (COM LAB)' };
  } else if (batchNum === 72) {
    courses = [
      { code: 'CSE113', teacher: 'SRH', room: 'KT-201' },
      { code: 'PHY101', teacher: 'MAK', room: 'KT-208' },
      { code: 'MAT102', teacher: 'AKC', room: 'ANX1-202' },
      { code: 'ENG102', teacher: 'SAS', room: 'ANX1-209' },
    ];
    labCourse = { code: 'CSE114', teacher: 'SMF', room: 'G1-002 (COM LAB)' };
  } else if (batchNum === 71) {
    courses = [
      { code: 'CSE121', teacher: 'MHK', room: 'KT-222' },
      { code: 'CSE123', teacher: 'JHJ', room: 'KT-304' },
      { code: 'PHY102', teacher: 'MRZ', room: 'KT-220' },
      { code: 'MAT102', teacher: 'MMR', room: 'ANX1-103' },
    ];
    labCourse = { code: 'CSE124', teacher: 'HHP', room: 'G1-004 (COM LAB)' };
  } else if (batchNum === 70) {
    courses = [
      { code: 'CSE212', teacher: 'DMR', room: 'KT-305' },
      { code: 'CSE213', teacher: 'TIS', room: 'KT-217' },
      { code: 'MAT211', teacher: 'MNM', room: 'ANX1-207' },
      { code: 'BNS101', teacher: 'BNS_3', room: 'ANX1-208' },
    ];
    labCourse = { code: 'CSE214', teacher: 'SNK', room: 'G1-008 (COM LAB)' };
  } else if (batchNum === 69) {
    courses = [
      { code: 'CSE215', teacher: 'EEE_1', room: 'KT-216' },
      { code: 'CSE221', teacher: 'MIZ', room: 'KT-216' },
      { code: 'AOL101', teacher: 'AAM', room: 'KT-222' },
      { code: 'CSE222', teacher: 'AAA', room: 'G1-003 (COM LAB)' },
    ];
    labCourse = { code: 'CSE216', teacher: 'NAB', room: 'SH-103 (Electronics Lab)' };
  } else if (batchNum === 68) {
    courses = [
      { code: 'CSE223', teacher: 'RYS', room: 'KT-221' },
      { code: 'CSE225', teacher: 'NT-1', room: 'KT-216' },
      { code: 'CSE227', teacher: 'SH', room: 'KT-318(A)' },
      { code: 'CSE228', teacher: 'MIS', room: 'KT-201' },
    ];
    labCourse = { code: 'CSE224', teacher: 'LR', room: 'SH-103 (Electronics Lab)' };
  } else if (batchNum === 67) {
    courses = [
      { code: 'CSE315', teacher: 'MM', room: 'KT-304' },
      { code: 'CSE317', teacher: 'MRR', room: 'KT-514' },
      { code: 'CSE321', teacher: 'FNN', room: 'KT-306' },
      { code: 'ACT327', teacher: 'FNT_1', room: 'KT-221' },
    ];
    labCourse = { code: 'CSE322', teacher: 'AAM', room: 'KT-501(A) (COM LAB)' };
  } else if (batchNum === 66) {
    courses = [
      { code: 'CSE316', teacher: 'MRY', room: 'KT-223' },
      { code: 'CSE323', teacher: 'MRM', room: 'KT-303' },
      { code: 'CSE326', teacher: 'SAL', room: 'KT-223' },
      { code: 'CSE328', teacher: 'MIS', room: 'KT-224' },
    ];
    labCourse = { code: 'CSE324', teacher: 'MRM', room: 'KT-503 (COM LAB)' };
  } else {
    // 65, 64, 63
    courses = [
      { code: 'CSE413', teacher: 'NT-4', room: 'KT-218' },
      { code: 'CSE431', teacher: 'DMAK', room: 'KT-304' },
      { code: 'CSE437', teacher: 'NT-8', room: 'KT-220' },
      { code: 'CSE438', teacher: 'PPC', room: 'KT-222' },
    ];
    labCourse = { code: 'CSE432', teacher: 'FH', room: 'KT-304' };
  }

  // Days sequence: SATURDAY, SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY
  const charCode = sectionLetter.charCodeAt(0);
  const timeSlots = [
    { start: '08:30', end: '10:00' },
    { start: '10:00', end: '11:30' },
    { start: '11:30', end: '13:00' },
    { start: '13:00', end: '14:30' },
    { start: '14:30', end: '16:00' },
  ];

  const days: DayOfWeek[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  const results: RoutineClass[] = [];

  // Add 4 Theory Classes (Full Section)
  courses.forEach((c, idx) => {
    const day = days[(idx + charCode) % days.length];
    const slot = timeSlots[(idx * 2 + charCode) % timeSlots.length];
    results.push({
      id: `${sectionId}-${c.code}-${day}-${slot.start.replace(':', '')}`,
      batch: String(batchNum),
      section: sectionLetter,
      sectionId,
      subSection: null, // Both 1 & 2 attend theory
      courseCode: c.code,
      courseTitle: getCourseName(c.code),
      teacherCode: c.teacher,
      room: c.room,
      dayOfWeek: day,
      startTime: slot.start,
      endTime: slot.end,
      type: 'Theory',
      color: idx === 0 ? 'emerald' : idx === 1 ? 'blue' : idx === 2 ? 'violet' : 'indigo',
    });
  });

  // Add SubSection 1 Lab (3 hours)
  const labDay1 = days[(charCode + 1) % days.length];
  results.push({
    id: `${sectionId}1-${labCourse.code}-${labDay1}-0830`,
    batch: String(batchNum),
    section: sectionLetter,
    sectionId,
    subSection: '1', // SubSection 1
    courseCode: `${labCourse.code}(${sectionId}1)`,
    courseTitle: getCourseName(labCourse.code),
    teacherCode: labCourse.teacher,
    room: labCourse.room,
    dayOfWeek: labDay1,
    startTime: '08:30',
    endTime: '11:30',
    type: 'Lab',
    color: 'amber',
  });

  // Add SubSection 2 Lab (3 hours)
  const labDay2 = days[(charCode + 3) % days.length];
  results.push({
    id: `${sectionId}2-${labCourse.code}-${labDay2}-1130`,
    batch: String(batchNum),
    section: sectionLetter,
    sectionId,
    subSection: '2', // SubSection 2
    courseCode: `${labCourse.code}(${sectionId}2)`,
    courseTitle: getCourseName(labCourse.code),
    teacherCode: labCourse.teacher,
    room: labCourse.room,
    dayOfWeek: labDay2,
    startTime: '11:30',
    endTime: '14:30',
    type: 'Lab',
    color: 'rose',
  });

  return results;
}
