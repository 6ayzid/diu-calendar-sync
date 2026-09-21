export interface ParsedSectionQuery {
  batchNumber: number;
  sectionLetter: string;
  subSection: '1' | '2' | 'all';
  targetId: string; // e.g. "66_O"
  label: string;    // e.g. "Batch 66 - Section O (Lab 2)"
}

/**
 * Parses shorthand section queries like:
 * - "66o2"   -> Batch 66, Section O, Lab 2
 * - "68d1"   -> Batch 68, Section D, Lab 1
 * - "68d"    -> Batch 68, Section D, All classes
 * - "66_o_2" -> Batch 66, Section O, Lab 2
 * - "b66o2"  -> Batch 66, Section O, Lab 2
 * - "70 a"   -> Batch 70, Section A, All
 */
export function parseShorthandSectionQuery(raw: string): ParsedSectionQuery | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase().replace(/^b(atch)?\s*/i, '');

  // 1. Matches "66o2", "66-o-2", "66_o_2", "66 o 2"
  const fullMatch = clean.match(/^(\d{2,3})[\s_.-]*([a-z])[\s_.-]*([12])?$/i);
  if (fullMatch) {
    const batchNumber = parseInt(fullMatch[1], 10);
    const sectionLetter = fullMatch[2].toUpperCase();
    const subDigit = fullMatch[3];
    const subSection: '1' | '2' | 'all' = subDigit === '1' || subDigit === '2' ? subDigit : 'all';
    const targetId = `${batchNumber}_${sectionLetter}`;
    const subLabel = subSection === 'all' ? 'All Classes' : `Lab Group ${subSection}`;

    return {
      batchNumber,
      sectionLetter,
      subSection,
      targetId,
      label: `Batch ${batchNumber} - Section ${sectionLetter} (${subLabel})`,
    };
  }

  // 2. Matches "o2" or "d1" when batch is implicitly already set
  const subOnlyMatch = clean.match(/^([a-z])[\s_.-]*([12])$/i);
  if (subOnlyMatch) {
    const sectionLetter = subOnlyMatch[1].toUpperCase();
    const subDigit = subOnlyMatch[2] as '1' | '2';
    return {
      batchNumber: 0, // Placeholder
      sectionLetter,
      subSection: subDigit,
      targetId: '',
      label: `Section ${sectionLetter} (Lab Group ${subDigit})`,
    };
  }

  return null;
}
