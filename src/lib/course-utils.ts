import { COURSE_CATALOG } from './courses';

/**
 * Returns a high-glance short course title suitable for calendar cards and timetables.
 * e.g.
 * - "Systems Analysis and Design" -> "SAD"
 * - "Digital Logic Design Lab" -> "DLD Lab"
 * - "Theory of Computation" -> "TOC"
 * - "Operating Systems" -> "OS"
 * - "Artificial Intelligence" -> "AI"
 * - "Introduction to Data Science" -> "Data Science"
 * - "Social and Professional Issues in Computing" -> "SPIC"
 *
 * CRITICAL RULE: DIU reassigns course codes across semesters/batches.
 * We must always prioritize the actual courseTitle (from upstream schedule / catalog)
 * rather than hardcoded course code lookups.
 */
export function getCourseShortTitle(code: string, rawTitle?: string, isLab?: boolean): string {
  const cleanCode = code.split('(')[0].trim().toUpperCase();

  // Prefer provided rawTitle; fallback to catalog name if rawTitle is empty, unknown, generic, or just repeats the course code
  let title = (rawTitle || '').trim();
  const cleanTitleCode = title.replace(/\s*lab\s*/i, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const normalizedCleanCode = cleanCode.replace(/[^A-Za-z0-9]/g, '');

  const isTitleJustCode =
    !title ||
    title.toLowerCase() === 'unknown' ||
    title.toLowerCase().endsWith('course') ||
    cleanTitleCode === normalizedCleanCode ||
    /^[A-Z]{2,4}\d{3}[A-Z]?$/i.test(cleanTitleCode);

  if (isTitleJustCode) {
    const catalogName = COURSE_CATALOG[cleanCode]?.name;
    if (catalogName) {
      title = catalogName;
    }
  }

  // If still completely unknown, fall back to clean code
  if (!title || title.toLowerCase() === 'unknown' || title.toLowerCase().endsWith('course')) {
    return isLab ? `${cleanCode} Lab` : cleanCode;
  }

  const lower = title.toLowerCase();
  const hasLabInTitle = lower.includes('lab');
  const needsLabSuffix = (isLab || hasLabInTitle) && !hasLabInTitle;
  const labSuffix = needsLabSuffix ? ' Lab' : '';

  // 1. Core CSE / Software courses
  if (lower.includes('operating system')) return (hasLabInTitle ? 'OS Lab' : 'OS' + labSuffix);
  if (lower.includes('digital logic design')) return (hasLabInTitle ? 'DLD Lab' : 'DLD' + labSuffix);
  if (lower.includes('systems analysis') || lower.includes('system analysis')) return (hasLabInTitle ? 'SAD Lab' : 'SAD' + labSuffix);
  if (lower.includes('theory of computation') || lower.includes('computation theory') || lower.includes('automata')) return (hasLabInTitle ? 'TOC Lab' : 'TOC' + labSuffix);
  if (lower.includes('data communication')) return (hasLabInTitle ? 'Data Comm Lab' : 'Data Comm' + labSuffix);
  if (lower.includes('artificial intelligence')) return (hasLabInTitle ? 'AI Lab' : 'AI' + labSuffix);
  if (lower.includes('data science')) return (hasLabInTitle ? 'Data Sci Lab' : 'Data Sci' + labSuffix);
  if (lower.includes('social and professional') || lower.includes('cyber ethics') || lower.includes('ethics') || lower.includes('spic')) return 'SPIC';
  if (lower.includes('computer network')) return (hasLabInTitle ? 'Networks Lab' : 'Networks' + labSuffix);
  if (lower.includes('software engineering')) return (hasLabInTitle ? 'Software Eng Lab' : 'Software Eng' + labSuffix);
  if (lower.includes('software architecture') || lower.includes('design pattern')) return (hasLabInTitle ? 'Software Arch Lab' : 'Software Arch' + labSuffix);
  if (lower.includes('microprocessor') || lower.includes('microcontroller')) return (hasLabInTitle ? 'Microprocessor Lab' : 'Microprocessor' + labSuffix);
  if (lower.includes('object oriented programming') || lower.includes('oop')) return (hasLabInTitle ? 'OOP Lab' : 'OOP' + labSuffix);
  if (lower.includes('data structure')) return (hasLabInTitle ? 'DS Lab' : 'Data Struct' + labSuffix);
  if (lower.includes('algorithm')) return (hasLabInTitle ? 'Algo Lab' : 'Algorithms' + labSuffix);
  if (lower.includes('discrete math')) return 'Discrete Math';
  if (lower.includes('database') || lower.includes('dbms')) return (hasLabInTitle ? 'DBMS Lab' : 'DBMS' + labSuffix);
  if (lower.includes('machine learning')) return (hasLabInTitle ? 'ML Lab' : 'Machine Learning' + labSuffix);
  if (lower.includes('natural language') || lower.includes('nlp')) return (hasLabInTitle ? 'NLP Lab' : 'NLP' + labSuffix);
  if (lower.includes('computer vision')) return (hasLabInTitle ? 'CV Lab' : 'Computer Vision' + labSuffix);
  if (lower.includes('business intelligence')) return 'BI';
  if (lower.includes('computer architecture') || lower.includes('computer organization')) return 'Computer Arch';
  if (lower.includes('compiler')) return (hasLabInTitle ? 'Compiler Lab' : 'Compiler' + labSuffix);
  if (lower.includes('graphics')) return (hasLabInTitle ? 'Graphics Lab' : 'Graphics' + labSuffix);
  if (lower.includes('web engineering') || lower.includes('web development') || lower.includes('web dev')) return (hasLabInTitle ? 'Web Eng Lab' : 'Web Eng' + labSuffix);
  if (lower.includes('mobile application') || lower.includes('mobile app')) return (hasLabInTitle ? 'Mobile App Lab' : 'Mobile App' + labSuffix);
  if (lower.includes('cyber security') || lower.includes('information security') || lower.includes('cryptography')) return (hasLabInTitle ? 'Security Lab' : 'Security' + labSuffix);
  if (lower.includes('internet of things') || lower.includes('iot')) return (hasLabInTitle ? 'IoT Lab' : 'IoT' + labSuffix);
  if (lower.includes('big data')) return 'Big Data';
  if (lower.includes('cloud computing')) return 'Cloud Computing';
  if (lower.includes('optical fiber')) return 'Optical Fiber';
  if (lower.includes('project') || lower.includes('thesis') || lower.includes('capstone')) return 'Project/Thesis';

  // 2. Hardware / Circuits
  if (lower.includes('electronic devices') || lower.includes('electrical circuit') || lower.includes('electronics')) {
    return (hasLabInTitle ? 'Circuits Lab' : 'Circuits' + labSuffix);
  }

  // 3. Foundation / Programming
  if (lower.includes('programming and problem solving') || lower.includes('problem-solving')) {
    return (hasLabInTitle ? 'PPS Lab' : 'PPS' + labSuffix);
  }
  if (lower.includes('structured programming')) {
    return (hasLabInTitle ? 'SPL Lab' : 'SPL' + labSuffix);
  }
  if (lower.includes('computer fundamentals')) {
    return hasLabInTitle ? 'Comp Fund Lab' : 'Comp Fund';
  }

  // 4. University Core / GED
  if (lower.includes('bangladesh studies')) return 'BD Studies';
  if (lower.includes('art of living')) return 'Art of Living';
  if (lower.includes('accounting')) return 'Accounting';
  if (lower.includes('biology') || lower.includes('chemistry')) return hasLabInTitle ? 'Bio-Chem Lab' : 'Bio-Chem';

  // 5. Physics & Math
  if (lower.includes('physics')) {
    const num = (lower.includes('ii') || lower.includes('- ii') || lower.includes('2')) ? ' II' : ' I';
    return (hasLabInTitle ? 'Phys' + num + ' Lab' : 'Phys' + num + labSuffix);
  }
  if (lower.includes('mathematics') || lower.includes('calculus') || lower.includes('linear algebra')) {
    if (lower.includes('ii') || lower.includes('- ii') || lower.includes('2')) return 'Math II';
    if (lower.includes('engineering mathematics')) return 'Engr Math';
    return 'Math I';
  }
  if (lower.includes('english') || lower.includes('writing and comprehension')) {
    const num = (lower.includes('ii') || lower.includes('- ii') || lower.includes('2')) ? ' II' : ' I';
    return 'Eng' + num;
  }

  // If title is concise (<= 16 chars), use directly
  if (title.length <= 16) {
    return title + (isLab && !hasLabInTitle ? ' Lab' : '');
  }

  // Acronym generator for long titles
  const words = title
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/Laboratory/gi, 'Lab')
    .trim()
    .split(/\s+/);
  if (words.length >= 2 && words.length <= 4) {
    const acronym = words
      .filter((w) => !/^(of|and|the|in|for|to)$/i.test(w))
      .map((w) => (w.toLowerCase() === 'lab' ? 'Lab' : w[0].toUpperCase()))
      .join('');
    if (acronym.length >= 2 && acronym.length <= 8) {
      return acronym + (isLab && !acronym.includes('Lab') ? ' Lab' : '');
    }
  }

  return title.slice(0, 18);
}

/**
 * Returns a high-glance, minimal short label (e.g. "D1", "D2", "A1") for lab subsections.
 * Returns null for theory classes or labs without a specific subgroup.
 */
export function getLabSubsectionBadge(
  c: {
    type?: string;
    subSection?: '1' | '2' | 'all' | null;
    section?: string;
    sectionId?: string;
    courseCode?: string;
    courseTitle?: string;
    id?: string;
  },
  sectionProp?: { sectionLetter?: string; id?: string } | null
): string | null {
  const isLabClass =
    c.type === 'Lab' ||
    Boolean(c.courseTitle && /lab|sessional/i.test(c.courseTitle)) ||
    Boolean(c.courseCode && /lab|sessional/i.test(c.courseCode)) ||
    (c.subSection !== undefined && c.subSection !== null && c.subSection !== 'all');

  if (!isLabClass) return null;

  let sub = c.subSection && c.subSection !== 'all' ? c.subSection : null;
  let letter = c.section || sectionProp?.sectionLetter || '';

  if (!sub) {
    const codeMatch = c.courseCode ? c.courseCode.match(/\((?:[0-9]+_)?([A-Za-z]+)([12])\)/) : null;
    if (codeMatch) {
      if (!letter) letter = codeMatch[1];
      sub = codeMatch[2] as '1' | '2';
    } else {
      const idMatch = c.id ? c.id.match(/-sub([12])\-/) : null;
      if (idMatch) {
        sub = idMatch[1] as '1' | '2';
      } else {
        const secIdMatch = c.sectionId ? c.sectionId.match(/_([A-Za-z]+)([12])$/) : null;
        if (secIdMatch) {
          if (!letter) letter = secIdMatch[1];
          sub = secIdMatch[2] as '1' | '2';
        }
      }
    }
  }

  if (!letter && c.sectionId) {
    const match = c.sectionId.match(/_([A-Za-z]+)/);
    if (match) letter = match[1];
  }

  if (sub) {
    return letter ? `${letter.toUpperCase()}${sub}` : `Sub ${sub}`;
  }

  return null;
}

export interface RoomParts {
  prefix: string; // e.g. "KT", "ANX1", "G1", "SH" (without hyphen)
  number: string; // e.g. "217", "517(A)", "402", "004", "Online"
}

/**
 * Separates building prefix (e.g. "KT", "ANX1") and room number (e.g. "217", "402"),
 * stripping the hyphen completely so it renders cleanly and compactly horizontally.
 */
export function parseRoomParts(rawRoom?: string): RoomParts {
  if (!rawRoom) return { prefix: '', number: 'TBD' };

  // Strip trailing notes like (COM LAB), (Physics Lab), (E.C & D.E Lab)
  let cleaned = rawRoom.trim().replace(/\s*\([^)]*lab[^)]*\)/gi, '').trim();

  // If there's e.g. "IOT LAB- KT-502", isolate "KT-502"
  if (/kt-\d+/i.test(cleaned)) {
    const ktIndex = cleaned.search(/kt-\d+/i);
    if (ktIndex > 0) cleaned = cleaned.slice(ktIndex);
  }

  // Match building prefix and room number separated by hyphens or spaces, e.g. "KT-217" -> prefix "KT", number "217"
  const match = cleaned.match(/^([A-Za-z0-9]+)[-\s]+(.+)$/);
  if (match) {
    return {
      prefix: match[1],
      number: match[2].trim().replace(/^-+/, ''),
    };
  }

  return {
    prefix: '',
    number: cleaned.replace(/^-+/, ''),
  };
}
