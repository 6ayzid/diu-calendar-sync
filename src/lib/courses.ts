export interface CourseInfo {
  code: string;
  name: string;
  department: string;
}

export const COURSE_CATALOG: Record<string, CourseInfo> = {
  // 1st Year (Batch 73 & 72)
  CSE112: { code: 'CSE112', name: 'Computer Fundamentals', department: 'CSE' },
  CSE113: { code: 'CSE113', name: 'Programming and Problem Solving', department: 'CSE' },
  CSE114: { code: 'CSE114', name: 'Programming and Problem-Solving Lab', department: 'CSE' },
  CSE115: { code: 'CSE115', name: 'Introduction to Biology and Chemistry for Computation', department: 'CSE' },
  MAT101: { code: 'MAT101', name: 'Mathematics - I', department: 'Mathematics' },
  MAT102: { code: 'MAT102', name: 'Mathematics-II: Calculus, Complex Variables and Linear Algebra', department: 'Mathematics' },
  ENG101: { code: 'ENG101', name: 'Basic Functional English and English Spoken', department: 'English' },
  ENG102: { code: 'ENG102', name: 'Writing and Comprehension', department: 'English' },
  PHY101: { code: 'PHY101', name: 'Physics - I', department: 'Physics' },
  PHY102: { code: 'PHY102', name: 'Physics - II', department: 'Physics' },
  PHY103: { code: 'PHY103', name: 'Physics - II Lab', department: 'Physics' },

  // 1st / 2nd Year (Batch 71)
  CSE121: { code: 'CSE121', name: 'Electrical Circuits', department: 'EEE' },
  CSE122: { code: 'CSE122', name: 'Electrical Circuits Lab', department: 'EEE' },
  CSE123: { code: 'CSE123', name: 'Data Structure', department: 'CSE' },
  CSE124: { code: 'CSE124', name: 'Data Structure Lab', department: 'CSE' },

  // 2nd Year (Batch 70)
  CSE212: { code: 'CSE212', name: 'Discrete Mathematics', department: 'CSE' },
  CSE213: { code: 'CSE213', name: 'Algorithms', department: 'CSE' },
  CSE214: { code: 'CSE214', name: 'Algorithms Lab', department: 'CSE' },
  MAT211: { code: 'MAT211', name: 'Engineering Mathematics', department: 'Mathematics' },
  BNS101: { code: 'BNS101', name: 'Bangladesh Studies (History of Independence and Contemporary Issues)', department: 'GED' },

  // 2nd Year (Batch 69)
  CSE215: { code: 'CSE215', name: 'Electronic Devices and Circuits', department: 'EEE' },
  CSE216: { code: 'CSE216', name: 'Electronic Devices and Circuits Lab', department: 'EEE' },
  CSE221: { code: 'CSE221', name: 'Object Oriented Programming', department: 'CSE' },
  CSE222: { code: 'CSE222', name: 'Object Oriented Programming Lab', department: 'CSE' },
  AOL101: { code: 'AOL101', name: 'Art of Living', department: 'GED' },

  // 3rd Year (Batch 68)
  CSE223: { code: 'CSE223', name: 'Digital Logic Design', department: 'CSE' },
  CSE224: { code: 'CSE224', name: 'Digital Logic Design Lab', department: 'CSE' },
  CSE225: { code: 'CSE225', name: 'Data Communication', department: 'CSE' },
  CSE227: { code: 'CSE227', name: 'Systems Analysis and Design', department: 'CSE' },
  CSE228: { code: 'CSE228', name: 'Theory of Computation', department: 'CSE' },

  // 3rd Year (Batch 67)
  CSE315: { code: 'CSE315', name: 'Software Engineering', department: 'CSE' },
  CSE317: { code: 'CSE317', name: 'Microprocessor and Microcontrollers', department: 'CSE' },
  CSE321: { code: 'CSE321', name: 'Computer Networks', department: 'CSE' },
  CSE322: { code: 'CSE322', name: 'Computer Networks Lab', department: 'CSE' },
  ACT327: { code: 'ACT327', name: 'Financial and Managerial Accounting', department: 'Business' },

  // 3rd / 4th Year (Batch 66)
  CSE316: { code: 'CSE316', name: 'Artificial Intelligence', department: 'CSE' },
  CSE323: { code: 'CSE323', name: 'Operating Systems', department: 'CSE' },
  CSE324: { code: 'CSE324', name: 'Operating Systems Lab', department: 'CSE' },
  CSE326: { code: 'CSE326', name: 'Social and Professional Issues in Computing', department: 'CSE' },
  CSE328: { code: 'CSE328', name: 'Introduction to Data Science', department: 'CSE' },

  // 4th Year (Batch 65, 64, 63)
  CSE413: { code: 'CSE413', name: 'Computer Architecture and Organization', department: 'CSE' },
  CSE431: { code: 'CSE431', name: 'Machine Learning', department: 'CSE' },
  CSE432: { code: 'CSE432', name: 'Natural Language Processing', department: 'CSE' },
  CSE437: { code: 'CSE437', name: 'Computer Vision', department: 'CSE' },
  CSE438: { code: 'CSE438', name: 'Business Intelligence', department: 'CSE' },
  CSE441: { code: 'CSE441', name: 'Compiler Design', department: 'CSE' },
  CSE442: { code: 'CSE442', name: 'Compiler Design Laboratory', department: 'CSE' },
  CSE443: { code: 'CSE443', name: 'Computer Graphics', department: 'CSE' },
  CSE450: { code: 'CSE450', name: 'Cyber Security & Forensics', department: 'CSE' },
  CSE453: { code: 'CSE453', name: 'Information Security & Cryptography', department: 'CSE' },
  CSE454: { code: 'CSE454', name: 'Information Security Laboratory', department: 'CSE' },
  CSE471: { code: 'CSE471', name: 'Internet of Things (IoT)', department: 'CSE' },
  CSE472: { code: 'CSE472', name: 'Internet of Things (IoT) Lab', department: 'CSE' },
  CSE473: { code: 'CSE473', name: 'Big Data Analytics', department: 'CSE' },
  CSE491: { code: 'CSE491', name: 'Final Year Capstone Project / Thesis', department: 'CSE' },
};

export function getCourseName(code: string): string {
  const clean = code.split('(')[0].trim().toUpperCase();
  return COURSE_CATALOG[clean]?.name || `${clean} Course`;
}
