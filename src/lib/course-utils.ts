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
 * - "Social and Professional Issues in Computing" -> "Social & Ethics"
 *
 * CRITICAL RULE: DIU reassigns course codes across semesters/batches.
 * We must always prioritize the actual courseTitle (from upstream schedule / catalog)
 * rather than hardcoded course code lookups.
 */
export function getCourseShortTitle(code: string, rawTitle?: string, isLab?: boolean): string {
  const cleanCode = code.split('(')[0].trim().toUpperCase();

  // Prefer provided rawTitle; fallback to catalog name if not unknown/generic
  let title = (rawTitle || '').trim();
  if (!title || title.toLowerCase() === 'unknown' || title.toLowerCase().endsWith('course')) {
    title = COURSE_CATALOG[cleanCode]?.name || '';
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
  if (lower.includes('data science')) return (hasLabInTitle ? 'Data Science Lab' : 'Data Science' + labSuffix);
  if (lower.includes('social and professional') || lower.includes('cyber ethics')) return 'Social & Ethics';
  if (lower.includes('computer network')) return (hasLabInTitle ? 'Networks Lab' : 'Networks' + labSuffix);
  if (lower.includes('software engineering')) return (hasLabInTitle ? 'Software Eng Lab' : 'Software Eng' + labSuffix);
  if (lower.includes('microprocessor') || lower.includes('microcontroller')) return (hasLabInTitle ? 'Microprocessor Lab' : 'Microprocessor' + labSuffix);
  if (lower.includes('object oriented programming') || lower.includes('oop')) return (hasLabInTitle ? 'OOP Lab' : 'OOP' + labSuffix);
  if (lower.includes('data structure')) return (hasLabInTitle ? 'DS Lab' : 'Data Structures' + labSuffix);
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
    return 'Computer Fund';
  }

  // 4. University Core / GED
  if (lower.includes('bangladesh studies')) return 'BD Studies';
  if (lower.includes('art of living')) return 'Art of Living';
  if (lower.includes('accounting')) return 'Accounting';
  if (lower.includes('biology') || lower.includes('chemistry')) return 'Bio & Chem';

  // 5. Physics & Math
  if (lower.includes('physics')) {
    const num = (lower.includes('ii') || lower.includes('- ii') || lower.includes('2')) ? ' II' : ' I';
    return (hasLabInTitle ? 'Physics' + num + ' Lab' : 'Physics' + num + labSuffix);
  }
  if (lower.includes('mathematics') || lower.includes('calculus') || lower.includes('linear algebra')) {
    if (lower.includes('ii') || lower.includes('- ii') || lower.includes('2')) return 'Math II';
    if (lower.includes('engineering mathematics')) return 'Engr Math';
    return 'Math I';
  }
  if (lower.includes('english') || lower.includes('writing and comprehension')) {
    if (lower.includes('spoken') || lower.includes('basic') || lower.includes('functional')) return 'English I';
    return 'English';
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
