import { DayOfWeek, RoutineClass } from '@/types/schedule';
import { ClassEventOverride } from '@/types/events';
import officialRoutine from '@/data/official-routine.json';

/**
 * Midterm Examination Schedule — Fall 2026
 * Dept. of Computer Science and Engineering, Daffodil International University (DIU).
 *
 * Effective Exam Period: Wednesday 28 October 2026 to Wednesday 04 November 2026.
 * Note: All regular academic classes are paused across all batches during this week.
 */
export const MIDTERM_EXAM_PERIOD = {
  startDate: '2026-10-28',
  endDate: '2026-11-04',
  name: 'Midterm Examination, Fall 2026',
  description:
    'Midterm Examination for Dept. of CSE, Daffodil International University. All regular classes suspended from Wednesday 28 October to Wednesday 04 November 2026.',
};

export const MIDTERM_EXAM_DATES = [
  '2026-10-28', // Day 1 (Wednesday)
  '2026-10-29', // Day 2 (Thursday)
  // 2026-10-30 is Friday (Weekend, no exams)
  '2026-10-31', // Day 3 (Saturday)
  '2026-11-01', // Day 4 (Sunday)
  '2026-11-02', // Day 5 (Monday)
  '2026-11-03', // Day 6 (Tuesday)
  '2026-11-04', // Day 7 (Wednesday)
] as const;

export function isMidtermExamPeriod(isoDate?: string | null): boolean {
  if (!isoDate) return false;
  const d = isoDate.trim();
  return d >= MIDTERM_EXAM_PERIOD.startDate && d <= MIDTERM_EXAM_PERIOD.endDate;
}

export function isMidtermExamDate(isoDate?: string | null): boolean {
  if (!isoDate) return false;
  return (MIDTERM_EXAM_DATES as readonly string[]).includes(isoDate.trim());
}

export interface RawMidtermExamSlot {
  day: number;
  dayLabel: string;
  date: string;
  dayOfWeek: DayOfWeek;
  slot: 'A' | 'B' | 'C';
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  batch: number;
  courses: {
    code: string;
    title: string;
  }[];
}

/**
 * Master Raw Midterm Exam Schedule extracted from official FSIT Routine
 */
export const RAW_MIDTERM_EXAMS: RawMidtermExamSlot[] = [
  // ==========================================
  // Day 1: Wednesday, 28 October 2026
  // ==========================================
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 73,
    courses: [{ code: 'CSE112', title: 'Computer Fundamentals' }],
  },
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 70,
    courses: [{ code: 'CSE213', title: 'Algorithms' }],
  },
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 72,
    courses: [{ code: 'CSE113', title: 'Programming and Problem Solving' }],
  },
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 67,
    courses: [{ code: 'CSE321', title: 'Computer Networks' }],
  },
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 68,
    courses: [{ code: 'CSE225', title: 'Data Communication' }],
  },
  {
    day: 1,
    dayLabel: 'Day 1',
    date: '2026-10-28',
    dayOfWeek: 'WEDNESDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 66,
    courses: [{ code: 'CSE326', title: 'SPIC' }],
  },

  // ==========================================
  // Day 2: Thursday, 29 October 2026
  // ==========================================
  {
    day: 2,
    dayLabel: 'Day 2',
    date: '2026-10-29',
    dayOfWeek: 'THURSDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 71,
    courses: [{ code: 'CSE123', title: 'Data Structure' }],
  },
  {
    day: 2,
    dayLabel: 'Day 2',
    date: '2026-10-29',
    dayOfWeek: 'THURSDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 64,
    courses: [
      { code: 'CSE437', title: 'Computer Vision' },
      { code: 'CSE443', title: 'Web Computing' },
      { code: 'CSE451', title: 'Cloud Computing and Services' },
      { code: 'CSE473', title: 'Robotics' },
    ],
  },
  {
    day: 2,
    dayLabel: 'Day 2',
    date: '2026-10-29',
    dayOfWeek: 'THURSDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 65,
    courses: [{ code: 'CSE413', title: 'Computer Architecture and Organization' }],
  },
  {
    day: 2,
    dayLabel: 'Day 2',
    date: '2026-10-29',
    dayOfWeek: 'THURSDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 69,
    courses: [{ code: 'CSE215', title: 'Electronic Devices and Circuits' }],
  },

  // ==========================================
  // Day 3: Saturday, 31 October 2026
  // ==========================================
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 73,
    courses: [{ code: 'MAT101', title: 'Mathematics - I' }],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 70,
    courses: [{ code: 'CSE212', title: 'Discrete Mathematics' }],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 72,
    courses: [{ code: 'MAT102', title: 'Mathematics-II: Calculus, Complex Variables and Linear Algebra' }],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 68,
    courses: [{ code: 'CSE228', title: 'Theory of Computation' }],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 67,
    courses: [{ code: 'CSE315', title: 'Software Engineering' }],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    date: '2026-10-31',
    dayOfWeek: 'SATURDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 66,
    courses: [{ code: 'CSE316', title: 'Artificial Intelligence' }],
  },

  // ==========================================
  // Day 4: Sunday, 01 November 2026
  // ==========================================
  {
    day: 4,
    dayLabel: 'Day 4',
    date: '2026-11-01',
    dayOfWeek: 'SUNDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 65,
    courses: [
      { code: 'CSE431', title: 'Machine Learning' },
      { code: 'CSE441', title: 'UI and UX Design' },
      { code: 'CSE453', title: 'Wireless Sensor Network' },
      { code: 'CSE471', title: 'Introduction to Embedded Systems' },
    ],
  },
  {
    day: 4,
    dayLabel: 'Day 4',
    date: '2026-11-01',
    dayOfWeek: 'SUNDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 64,
    courses: [
      { code: 'CSE438', title: 'Business Intelligence' },
      { code: 'CSE444', title: 'Software Architecture and Design Patterns' },
      { code: 'CSE452', title: 'Optical Fiber' },
    ],
  },
  {
    day: 4,
    dayLabel: 'Day 4',
    date: '2026-11-01',
    dayOfWeek: 'SUNDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 69,
    courses: [{ code: 'CSE221', title: 'Object Oriented Programming' }],
  },
  {
    day: 4,
    dayLabel: 'Day 4',
    date: '2026-11-01',
    dayOfWeek: 'SUNDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 71,
    courses: [{ code: 'PHY102', title: 'Physics - II' }],
  },

  // ==========================================
  // Day 5: Monday, 02 November 2026
  // ==========================================
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 73,
    courses: [{ code: 'ENG101', title: 'Basic Functional English and English Spoken' }],
  },
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 70,
    courses: [{ code: 'MAT211', title: 'Engineering Mathematics' }],
  },
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 72,
    courses: [{ code: 'ENG102', title: 'Writing and Comprehension' }],
  },
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 68,
    courses: [{ code: 'CSE223', title: 'Digital Logic Design' }],
  },
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 67,
    courses: [{ code: 'CSE317', title: 'Microprocessor and Microcontrollers' }],
  },
  {
    day: 5,
    dayLabel: 'Day 5',
    date: '2026-11-02',
    dayOfWeek: 'MONDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 66,
    courses: [{ code: 'CSE323', title: 'Operating Systems' }],
  },

  // ==========================================
  // Day 6: Tuesday, 03 November 2026
  // ==========================================
  {
    day: 6,
    dayLabel: 'Day 6',
    date: '2026-11-03',
    dayOfWeek: 'TUESDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 65,
    courses: [
      { code: 'CSE432', title: 'Natural Language Processing' },
      { code: 'CSE442', title: 'Software Quality Assurance' },
      { code: 'CSE454', title: 'Cyber Security and Forensics' },
      { code: 'CSE472', title: 'Internet of Things [IoT]' },
    ],
  },
  {
    day: 6,
    dayLabel: 'Day 6',
    date: '2026-11-03',
    dayOfWeek: 'TUESDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 71,
    courses: [{ code: 'CSE121', title: 'Electrical Circuits' }],
  },
  {
    day: 6,
    dayLabel: 'Day 6',
    date: '2026-11-03',
    dayOfWeek: 'TUESDAY',
    slot: 'B',
    startTime: '11:30',
    endTime: '13:00',
    batch: 69,
    courses: [{ code: 'AOL101', title: 'Art of Living' }],
  },

  // ==========================================
  // Day 7: Wednesday, 04 November 2026
  // ==========================================
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 73,
    courses: [{ code: 'CSE115', title: 'Introduction to Biology and Chemistry for Computation' }],
  },
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'A',
    startTime: '09:00',
    endTime: '10:30',
    batch: 70,
    courses: [{ code: 'BNS101', title: 'Bangladesh Studies (History of Independence and Contemporary Issues)' }],
  },
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'B',
    startTime: '11:00', // Note: 11:00 AM on Day 7
    endTime: '12:30',
    batch: 72,
    courses: [{ code: 'PHY101', title: 'Physics-I' }],
  },
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'B',
    startTime: '11:00', // Note: 11:00 AM on Day 7
    endTime: '12:30',
    batch: 68,
    courses: [{ code: 'CSE227', title: 'Systems Analysis and Design' }],
  },
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 67,
    courses: [{ code: 'ACT327', title: 'Financial and Managerial Accounting' }],
  },
  {
    day: 7,
    dayLabel: 'Day 7',
    date: '2026-11-04',
    dayOfWeek: 'WEDNESDAY',
    slot: 'C',
    startTime: '14:00',
    endTime: '15:30',
    batch: 66,
    courses: [{ code: 'CSE328', title: 'Introduction to Data Science' }],
  },
];

const STUDENT_EXAM_INSTRUCTIONS = [
  'Instructions for Students:',
  '1. No student will be allowed to sit for examination without clearing payment to the university or showing proper document.',
  '2. Collect Admit Card or Payment Document from Accounts Section and bring it to examination hall.',
  '3. It is mandatory to attend the examination according to the seating arrangement strictly.',
  '4. Students are strongly advised to write teachers\' initials correctly on exam scripts.',
  '5. Student ID card with DIU Ribbon is mandatory to enter the exam hall.',
].join('\n');

/**
 * Returns midterm exam overrides for a specific section.
 * Automatically resolves elective tracks for Batches 64 and 65 based on
 * the section's enrolled courses in the official departmental routine.
 */
export function getMidtermExamsForSection(sectionId: string): ClassEventOverride[] {
  if (!sectionId) return [];
  const normalizedSection = sectionId.toUpperCase().replace('-', '_');

  // Handle department-wide or all queries
  if (normalizedSection === 'ALL' || normalizedSection === 'DEPARTMENT') {
    return getAllBatchMidtermOverrides();
  }

  // Parse batch number (e.g. "68_D" -> 68, "BATCH_68" -> 68, "68" -> 68)
  const batchMatch = normalizedSection.match(/^(?:BATCH_)?([0-9]{2})/);
  if (!batchMatch) return [];
  const batchNum = parseInt(batchMatch[1], 10);

  // Batch 63 (Final Term / Thesis) has no written midterm examinations
  if (batchNum === 63) {
    return [];
  }

  const batchSlots = RAW_MIDTERM_EXAMS.filter((slot) => slot.batch === batchNum);
  if (batchSlots.length === 0) return [];

  // Look up enrolled course codes for this section from the official routine snapshot
  const sectionClasses = (officialRoutine.sections as Record<string, RoutineClass[]>)[normalizedSection] || [];
  const enrolledCourseCodes = new Set(
    sectionClasses.map((c) => c.courseCode.split('(')[0].trim().toUpperCase())
  );

  return batchSlots.map((slot) => {
    let resolvedCode = '';
    let resolvedTitle = '';

    if (slot.courses.length === 1) {
      resolvedCode = slot.courses[0].code;
      resolvedTitle = slot.courses[0].title;
    } else {
      // Find matching enrolled course for multi-course elective slots (Batches 64 and 65)
      const matched = slot.courses.find((c) => enrolledCourseCodes.has(c.code));
      if (matched) {
        resolvedCode = matched.code;
        resolvedTitle = matched.title;
      } else {
        // Fallback to combined elective representation
        resolvedCode = slot.courses.map((c) => c.code).join('/');
        resolvedTitle = slot.courses.map((c) => c.title).join(' / ');
      }
    }

    const electiveDetail =
      slot.courses.length > 1
        ? `Elective Courses for Batch ${slot.batch}: ${slot.courses.map((c) => `${c.code} (${c.title})`).join(' | ')}`
        : '';

    const descriptionParts = [
      `Midterm Examination — Fall 2026 (${slot.dayLabel}, Slot ${slot.slot})`,
      `Course: ${resolvedTitle} (${resolvedCode})`,
      `Batch: Batch ${slot.batch}`,
      `Time: ${slot.startTime} – ${slot.endTime} (${slot.dayOfWeek})`,
      `Room: Exam Hall (See Published Seating Plan)`,
      electiveDetail,
      '',
      STUDENT_EXAM_INSTRUCTIONS,
    ].filter(Boolean);

    return {
      id: `midterm-${normalizedSection}-${resolvedCode.replace(/[^A-Za-z0-9]/g, '_')}-${slot.date}`,
      sectionId: normalizedSection,
      date: slot.date,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: resolvedCode,
      type: 'exam',
      title: `${resolvedCode === 'CSE326' ? 'SPIC' : resolvedTitle} (Midterm Exam)`,
      description: descriptionParts.join('\n'),
      room: 'Exam Hall (See Sitting Plan)',
      status: 'CONFIRMED',
      createdAt: '2026-10-23T00:00:00Z',
    };
  });
}

/**
 * Returns generic batch-level exam overrides for all batches (64 through 73)
 */
export function getAllBatchMidtermOverrides(): ClassEventOverride[] {
  const result: ClassEventOverride[] = [];

  for (const slot of RAW_MIDTERM_EXAMS) {
    const primaryCode = slot.courses.map((c) => c.code).join('/');
    const primaryTitle = slot.courses.map((c) => c.title).join(' / ');

    result.push({
      id: `midterm-batch-${slot.batch}-${slot.courses[0].code}-${slot.date}`,
      sectionId: `BATCH_${slot.batch}`,
      date: slot.date,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseCode: primaryCode,
      type: 'exam',
      title: `${primaryCode.includes('CSE326') ? 'SPIC' : primaryTitle} (Midterm Exam)`,
      description: [
        `Midterm Examination — Fall 2026 (${slot.dayLabel}, Slot ${slot.slot})`,
        `Course: ${primaryTitle} (${primaryCode})`,
        `Batch: Batch ${slot.batch}`,
        `Time: ${slot.startTime} – ${slot.endTime}`,
        `Room: Exam Hall (See Sitting Plan)`,
        '',
        STUDENT_EXAM_INSTRUCTIONS,
      ].join('\n'),
      room: 'Exam Hall (See Sitting Plan)',
      status: 'CONFIRMED',
      createdAt: '2026-10-23T00:00:00Z',
    });
  }

  return result;
}
