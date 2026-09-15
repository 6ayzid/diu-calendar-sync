import { SectionMeta } from '@/types/schedule';

export const BATCH_DEFINITIONS = [
  { batchNumber: 73, name: 'Batch 73 (1st Year, 1st Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'] },
  { batchNumber: 72, name: 'Batch 72 (1st Year, 2nd Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V'] },
  { batchNumber: 71, name: 'Batch 71 (2nd Year, 1st Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L'] },
  { batchNumber: 70, name: 'Batch 70 (2nd Year, 2nd Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'] },
  { batchNumber: 69, name: 'Batch 69 (3rd Year, 1st Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] },
  { batchNumber: 68, name: 'Batch 68 (3rd Year, 2nd Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'] },
  { batchNumber: 67, name: 'Batch 67 (4th Year, 1st Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] },
  { batchNumber: 66, name: 'Batch 66 (4th Year, 2nd Sem)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] },
  { batchNumber: 65, name: 'Batch 65 (Senior Batch)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] },
  { batchNumber: 64, name: 'Batch 64 (Graduating Batch)', letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'] },
  { batchNumber: 63, name: 'Batch 63 (Final Term / Thesis)', letters: ['A','B','C','D','E','F','G','H'] },
];

export const ALL_SECTIONS: SectionMeta[] = BATCH_DEFINITIONS.flatMap((batch) =>
  batch.letters.map((letter) => {
    const id = `${batch.batchNumber}_${letter}`;
    return {
      id,
      batch: `Batch ${batch.batchNumber}`,
      batchNumber: batch.batchNumber,
      sectionLetter: letter,
      displayName: `Batch ${batch.batchNumber} - Section ${letter}`,
      hasSubSections: true,
      subSections: [`${letter}1`, `${letter}2`],
    };
  })
);

export const SECTION_LOOKUP: Map<string, SectionMeta> = new Map(
  ALL_SECTIONS.map((s) => [s.id.toUpperCase(), s])
);

export function getSectionById(id: string): SectionMeta | undefined {
  if (!id) return undefined;
  const normalized = id.replace('-', '_').toUpperCase();
  return SECTION_LOOKUP.get(normalized);
}
