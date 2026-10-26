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
 * Universal helper to extract subsection ('1' or '2') from a class or event override
 * across ANY batch and ANY section letter (e.g. 66_O1, 68_D2, 70_Q1, 72_B2, (O2), (D1), etc.).
 * Returns null if the item applies to the whole section / combined class.
 */
export function extractSubSectionId(
  item: {
    subSection?: '1' | '2' | 'all' | null;
    courseCode?: string;
    courseTitle?: string;
    title?: string;
    description?: string;
    id?: string;
    sectionId?: string;
    section?: string;
  },
  sectionLetterHint?: string
): '1' | '2' | null {
  if (item.subSection === '1' || item.subSection === '2') {
    return item.subSection;
  }

  let letter = (
    item.section ||
    sectionLetterHint ||
    (item.sectionId ? item.sectionId.split('_')[1]?.replace(/[12]$/, '') : '') ||
    ''
  )
    .trim()
    .toUpperCase();

  if (!letter && item.courseCode) {
    const secFromCode = item.courseCode.match(/\((?:[0-9]+[_-]?)?([A-Za-z]+)[12]?\)/);
    if (secFromCode) {
      letter = secFromCode[1].toUpperCase();
    }
  }

  // 1. Check courseCode e.g. "CSE324(66_O2)", "CSE224(68_D1)", "CSE324(O2)", "CSE324 - O1"
  if (item.courseCode) {
    const parenMatch = item.courseCode.match(/\((?:[0-9]+[_-]?)?[A-Za-z]+([12])\)/);
    if (parenMatch) return parenMatch[1] as '1' | '2';

    const batchSecMatch = item.courseCode.match(/\b[0-9]+[_-][A-Za-z]+([12])\b/);
    if (batchSecMatch) return batchSecMatch[1] as '1' | '2';

    if (letter) {
      const letterMatch = item.courseCode.match(
        new RegExp(`(?:^|[\\s(\\[,-])${letter}([12])(?=$|[\\s)\\],.])`, 'i')
      );
      if (letterMatch) return letterMatch[1] as '1' | '2';
    }
  }

  // 2. Check deterministic ID e.g. "66_O-CSE324-sub1-MONDAY-0830"
  if (item.id) {
    const idMatch = item.id.match(/-sub([12])(?:-|$)/i);
    if (idMatch) return idMatch[1] as '1' | '2';
  }

  // 3. Check sectionId e.g. "66_O1" or "68_D2"
  if (item.sectionId) {
    const secIdMatch = item.sectionId.match(/^(?:[0-9]+[_-])?[A-Za-z]+([12])$/);
    if (secIdMatch) return secIdMatch[1] as '1' | '2';
  }

  // 4. Check title / courseTitle / description for subsection tags e.g. "(O2)", "(66_O2)", "68_D1", "(D1)"
  const textFields = [item.title, item.courseTitle, item.description].filter(Boolean) as string[];
  for (const text of textFields) {
    if (/both\s+lab\s+subsections|full\s+[0-9]+_[A-Za-z]+/i.test(text)) {
      return null;
    }
    const foundSubs = new Set<'1' | '2'>();

    for (const m of text.matchAll(/\((?:[0-9]+[_-]?)?[A-Za-z]+([12])\)/g)) {
      foundSubs.add(m[1] as '1' | '2');
    }
    for (const m of text.matchAll(/\b[0-9]+[_-][A-Za-z]+([12])\b/g)) {
      foundSubs.add(m[1] as '1' | '2');
    }
    if (letter) {
      const letterRegex = new RegExp(`(?:^|[\\s(\\[,-])${letter}([12])(?=$|[\\s)\\],.])`, 'gi');
      for (const m of text.matchAll(letterRegex)) {
        foundSubs.add(m[1] as '1' | '2');
      }
    }

    if (foundSubs.size === 1) {
      return Array.from(foundSubs)[0];
    }
    if (foundSubs.size > 1) {
      return null;
    }
  }

  return null;
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
  const sub = extractSubSectionId(c, sectionProp?.sectionLetter);
  const isLabClass =
    c.type === 'Lab' ||
    Boolean(c.courseTitle && /lab|sessional/i.test(c.courseTitle)) ||
    Boolean(c.courseCode && /lab|sessional/i.test(c.courseCode)) ||
    sub !== null;

  if (!isLabClass || !sub) return null;

  let letter = c.section || sectionProp?.sectionLetter || '';

  if (!letter && c.courseCode) {
    const codeMatch = c.courseCode.match(/\((?:[0-9]+[_-]?)?([A-Za-z]+)[12]?\)/);
    if (codeMatch) letter = codeMatch[1];
  }

  if (!letter && c.sectionId) {
    const match = c.sectionId.match(/_([A-Za-z]+)/);
    if (match) letter = match[1].replace(/[12]$/, '');
  }

  if (!letter && sectionProp?.id) {
    const match = sectionProp.id.match(/_([A-Za-z]+)/);
    if (match) letter = match[1].replace(/[12]$/, '');
  }

  return letter ? `${letter.toUpperCase()}${sub}` : `Sub ${sub}`;
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

  // If this is a multi-room seat plan (e.g. "218(13), 219(12)" or "ANX1-101(26), ANX1-102(16)"),
  // return as a unified room number string without separating arbitrary prefix parts.
  if (cleaned.includes(',') || cleaned.includes('(')) {
    return {
      prefix: '',
      number: cleaned,
    };
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
