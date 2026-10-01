export interface ParsedSectionQuery {
  batchNumber: number;
  sectionLetter: string;
  subSection: '1' | '2' | 'all';
  targetId: string; // e.g. "66_O"
  label: string;    // e.g. "Batch 66 - Section O (Lab 2)"
}

const VALID_LETTERS = new Set('ABCDEFGHIJKLMNOPQRSTUV'.split(''));

function isValidBatchNumber(batch: number): boolean {
  return batch >= 50 && batch <= 99;
}

function createResult(batchNum: number, letterChar: string, subChar?: string): ParsedSectionQuery | null {
  let letter = letterChar.toUpperCase();
  if (letter === '0') {
    letter = 'O';
  }
  if (!isValidBatchNumber(batchNum) || !VALID_LETTERS.has(letter)) {
    return null;
  }

  const subSection: '1' | '2' | 'all' = subChar === '1' || subChar === '2' ? subChar : 'all';
  const targetId = `${batchNum}_${letter}`;
  const subLabel = subSection === 'all' ? 'All Classes' : `Lab Group ${subSection}`;

  return {
    batchNumber: batchNum,
    sectionLetter: letter,
    subSection,
    targetId,
    label: `Batch ${batchNum} - Section ${letter} (${subLabel})`,
  };
}

/**
 * Parses shorthand section queries like:
 * - "o@66"     -> Batch 66, Section O, All (arbitrary symbol separators)
 * - "o@66@2"   -> Batch 66, Section O, Lab 2
 * - "66@o"     -> Batch 66, Section O, All
 * - "66#o#2"   -> Batch 66, Section O, Lab 2
 * - "66/o/2"   -> Batch 66, Section O, Lab 2
 * - "o/66"     -> Batch 66, Section O, All
 * - "66o2"     -> Batch 66, Section O, Lab 2
 * - "68d1"     -> Batch 68, Section D, Lab 1
 * - "66_o_2"   -> Batch 66, Section O, Lab 2
 * - "b66o2"    -> Batch 66, Section O, Lab 2
 * - "70 a"     -> Batch 70, Section A, All
 * - "o-66"     -> Batch 66, Section O, All (reversed order)
 * - "o2-66"    -> Batch 66, Section O, Lab 2 (reversed order)
 * - "o66-2"    -> Batch 66, Section O, Lab 2 (reversed order)
 * - "6602"     -> Batch 66, Section O, Lab 2 (0 substituted for O)
 * - "0-66"     -> Batch 66, Section O, All (0 substituted for O)
 * - "sfj66o2"  -> Batch 66, Section O, Lab 2 (embedded typo tolerance)
 */
export function parseShorthandSectionQuery(raw: string): ParsedSectionQuery | null {
  if (!raw) return null;
  // Normalize common words like "batch", "section", "sec", "lab", "group"
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/\b(?:batch|section|sec|group|lab)\b/gi, ' ')
    .trim();

  // Match ANY arbitrary non-alphanumeric separator: @, #, /, \, *, +, =, ~, |, !, ?, $, %, ^, &, ., -, _, etc.
  const SEP = '[^a-z0-9]*';

  // 1. Standard batch-first: e.g. "66@o", "66#o#2", "66/o/2", "66-o-2", "66o2", "66 0 2", "66o", "660"
  const m1 = clean.match(new RegExp(`^(\\d{2,3})${SEP}([a-z0])(?:${SEP}([12]))?(?!\\d)$`, 'i'));
  if (m1) {
    const res = createResult(parseInt(m1[1], 10), m1[2], m1[3]);
    if (res) return res;
  }

  // 2. Reversed order:
  // Case 2a: Section letter + sub first, then batch: e.g. "o2@66", "o@2@66", "o2-66", "o2 66", "02-66"
  const m2a = clean.match(new RegExp(`^([a-z0])(?:${SEP}([12]))?${SEP}(\\d{2,3})$`, 'i'));
  if (m2a) {
    const res = createResult(parseInt(m2a[3], 10), m2a[1], m2a[2]);
    if (res) return res;
  }

  // Case 2b: Section letter first, then batch, then sub: e.g. "o@66", "o@66@2", "o-66-2", "o66-2", "0@66"
  const m2b = clean.match(new RegExp(`^([a-z0])${SEP}(\\d{2,3})(?:${SEP}([12]))?$`, 'i'));
  if (m2b) {
    const res = createResult(parseInt(m2b[2], 10), m2b[1], m2b[3]);
    if (res) return res;
  }

  // 3. Matches "o2" or "d1" when batch is implicitly already set
  const subOnlyMatch = clean.match(new RegExp(`^([a-z0])${SEP}([12])$`, 'i'));
  if (subOnlyMatch) {
    let letter = subOnlyMatch[1].toUpperCase();
    if (letter === '0') letter = 'O';
    const subDigit = subOnlyMatch[2] as '1' | '2';
    return {
      batchNumber: 0, // Placeholder
      sectionLetter: letter,
      subSection: subDigit,
      targetId: '',
      label: `Section ${letter} (Lab Group ${subDigit})`,
    };
  }

  // 4. Embedded substring extraction for typo prefixes (e.g. "sfj66o2", "asdf660", "sfj6602", "sec: o @ 66 (lab 2)")
  const batchMatches = Array.from(clean.matchAll(/(\d{2})/g));
  for (const bMatch of batchMatches) {
    const batchStr = bMatch[0];
    const batchNum = parseInt(batchStr, 10);
    const idx = bMatch.index!;

    const before = clean.slice(0, idx);
    const after = clean.slice(idx + 2);

    const mAfter = after.match(new RegExp(`^${SEP}([a-z0])(?:${SEP}([12]))?`, 'i'));
    const mAfterSubOnly = after.match(new RegExp(`^${SEP}([12])(?!\\d)`, 'i'));

    // Check after batch first for standard batch-first patterns (e.g. "66 @ o", "66o2", "sfj66o2")
    if (mAfter) {
      const res = createResult(batchNum, mAfter[1], mAfter[2]);
      if (res) return res;
    }

    // Check before batch if not matched after (e.g. "sec: o @ 66 (lab 2)", "o @ 66", "o2 @ 66")
    const mBeforeIsolated = before.match(new RegExp(`(?:^|[^a-z0-9])([a-z0])(?:${SEP}([12]))?${SEP}$`, 'i'));
    if (mBeforeIsolated) {
      const sub = mBeforeIsolated[2] || (mAfterSubOnly ? mAfterSubOnly[1] : undefined);
      const res = createResult(batchNum, mBeforeIsolated[1], sub);
      if (res) return res;
    }
  }

  return null;
}
