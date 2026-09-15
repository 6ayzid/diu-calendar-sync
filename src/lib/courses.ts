export interface CourseInfo {
  code: string;
  name: string;
  department: string;
}

export const COURSE_CATALOG: Record<string, CourseInfo> = {
  // 1st Year - 1st / 2nd Semesters (Batch 73 & 72)
  CSE112: { code: 'CSE112', name: 'Computer Fundamentals & Programming Concepts', department: 'CSE' },
  CSE113: { code: 'CSE113', name: 'Structured Programming Language', department: 'CSE' },
  CSE114: { code: 'CSE114', name: 'Structured Programming Language Lab', department: 'CSE' },
  CSE115: { code: 'CSE115', name: 'Discrete Mathematics', department: 'CSE' },
  MAT101: { code: 'MAT101', name: 'Differential and Integral Calculus', department: 'Mathematics' },
  MAT102: { code: 'MAT102', name: 'Coordinate Geometry & Linear Algebra', department: 'Mathematics' },
  ENG101: { code: 'ENG101', name: 'Basic Functional English', department: 'English' },
  ENG102: { code: 'ENG102', name: 'English Reading and Speaking Skills', department: 'English' },
  PHY101: { code: 'PHY101', name: 'Physics I (Mechanics, Waves, Optics)', department: 'Physics' },
  PHY102: { code: 'PHY102', name: 'Physics II (Electromagnetism & Modern Physics)', department: 'Physics' },
  PHY103: { code: 'PHY103', name: 'Physics Laboratory', department: 'Physics' },

  // 2nd Year (Batch 71 & 70)
  CSE121: { code: 'CSE121', name: 'Object Oriented Programming Concepts', department: 'CSE' },
  CSE122: { code: 'CSE122', name: 'Electrical Circuits & Electronic Devices Lab', department: 'EEE' },
  CSE123: { code: 'CSE123', name: 'Data Structures', department: 'CSE' },
  CSE124: { code: 'CSE124', name: 'Data Structures Lab', department: 'CSE' },
  CSE212: { code: 'CSE212', name: 'Software Development & OOP', department: 'CSE' },
  CSE213: { code: 'CSE213', name: 'Object Oriented Programming Lab / Algorithms', department: 'CSE' },
  CSE214: { code: 'CSE214', name: 'Object Oriented Programming Laboratory', department: 'CSE' },
  CSE215: { code: 'CSE215', name: 'Digital Logic Design', department: 'CSE' },
  CSE216: { code: 'CSE216', name: 'Digital Logic Design Lab', department: 'CSE' },
  MAT211: { code: 'MAT211', name: 'Ordinary & Partial Differential Equations', department: 'Mathematics' },
  BNS101: { code: 'BNS101', name: 'Bangladesh Studies & History', department: 'GED' },

  // 3rd Year (Batch 69 & 68)
  CSE221: { code: 'CSE221', name: 'Design and Analysis of Algorithms', department: 'CSE' },
  CSE222: { code: 'CSE222', name: 'Algorithms Laboratory', department: 'CSE' },
  CSE223: { code: 'CSE223', name: 'Database Management Systems', department: 'CSE' },
  CSE224: { code: 'CSE224', name: 'Database Management Systems Lab', department: 'CSE' },
  CSE225: { code: 'CSE225', name: 'Data Communication & Telephony', department: 'CSE' },
  CSE227: { code: 'CSE227', name: 'Microprocessors and Microcontrollers', department: 'CSE' },
  CSE228: { code: 'CSE228', name: 'Microprocessors and Interfacing Lab', department: 'CSE' },
  AOL101: { code: 'AOL101', name: 'Art of Living & Professional Ethics', department: 'GED' },

  // 3rd / 4th Year (Batch 67 & 66)
  CSE315: { code: 'CSE315', name: 'Operating Systems & System Programming', department: 'CSE' },
  CSE316: { code: 'CSE316', name: 'Operating Systems Laboratory', department: 'CSE' },
  CSE317: { code: 'CSE317', name: 'Computer Networks', department: 'CSE' },
  CSE321: { code: 'CSE321', name: 'Computer Architecture and Organization', department: 'CSE' },
  CSE322: { code: 'CSE322', name: 'Web Engineering Laboratory', department: 'CSE' },
  CSE323: { code: 'CSE323', name: 'Theory of Computation & Automata', department: 'CSE' },
  CSE324: { code: 'CSE324', name: 'Mobile Application Development Lab', department: 'CSE' },
  CSE326: { code: 'CSE326', name: 'Software Engineering Laboratory', department: 'CSE' },
  CSE328: { code: 'CSE328', name: 'Information System Design & SE', department: 'CSE' },
  ACT327: { code: 'ACT327', name: 'Financial and Managerial Accounting', department: 'Business' },

  // 4th Year (Batch 65, 64, 63)
  CSE413: { code: 'CSE413', name: 'Artificial Intelligence & Expert Systems', department: 'CSE' },
  CSE431: { code: 'CSE431', name: 'Machine Learning Principles', department: 'CSE' },
  CSE432: { code: 'CSE432', name: 'Machine Learning Laboratory', department: 'CSE' },
  CSE437: { code: 'CSE437', name: 'Mobile & Pervasive Computing', department: 'CSE' },
  CSE438: { code: 'CSE438', name: 'Cloud Computing and Virtualization', department: 'CSE' },
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
