import { DIU_FACULTY_DIRECTORY } from '../src/data/faculty';
import { CURATED_ROUTINES } from '../src/data/routines';

function main() {
  console.log('=== AUDIT FACULTY DIRECTORY ===\n');

  // 1. Check duplicate codes
  const codeCount = new Map<string, number>();
  for (const f of DIU_FACULTY_DIRECTORY) {
    const c = f.code.toUpperCase();
    codeCount.set(c, (codeCount.get(c) || 0) + 1);
  }

  const duplicatesByCode: string[] = [];
  for (const [code, count] of codeCount.entries()) {
    if (count > 1) {
      duplicatesByCode.push(`${code} (${count} times)`);
    }
  }
  console.log('Duplicates by exact code:', duplicatesByCode);

  // 2. Check duplicate persons (same name, or alias loops)
  // E.g. MSR (aliases: [SRH]) and SRH (aliases: [MSR])
  const nameToFacs = new Map<string, typeof DIU_FACULTY_DIRECTORY>();
  for (const f of DIU_FACULTY_DIRECTORY) {
    // Normalize name: remove "Dr. ", "Mr. ", "Ms. ", "Md. ", "Prof. ", lowercase, remove punctuation
    const norm = f.name
      .toLowerCase()
      .replace(/^(dr|mr|ms|mrs|prof|md)\.?\s+/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim();

    if (!nameToFacs.has(norm)) {
      nameToFacs.set(norm, []);
    }
    nameToFacs.get(norm)!.push(f);
  }

  console.log('\nDuplicates by similar name or aliases:');
  for (const [norm, list] of nameToFacs.entries()) {
    if (list.length > 1) {
      console.log(`- "${norm}": ${list.map((f) => `${f.code} ("${f.name}")`).join(', ')}`);
    }
  }

  // Check alias overlap
  console.log('\nCross-referenced aliases:');
  for (const f of DIU_FACULTY_DIRECTORY) {
    if (f.aliases && f.aliases.length > 0) {
      for (const al of f.aliases) {
        const found = DIU_FACULTY_DIRECTORY.find((other) => other.code.toUpperCase() === al.toUpperCase());
        if (found) {
          console.log(`- Code "${f.code}" has alias "${al}" which is also an entry ("${found.name}")`);
        }
      }
    }
  }

  // 3. Check teachers present in CURATED_ROUTINES vs DIU_FACULTY_DIRECTORY
  const dirCodes = new Set(DIU_FACULTY_DIRECTORY.map((f) => f.code.toUpperCase()));
  const routineTeachers = new Map<string, string>();
  for (const r of CURATED_ROUTINES) {
    if (r.teacherCode) {
      routineTeachers.set(r.teacherCode.toUpperCase(), r.teacherName || '');
    }
  }

  const missingFromDir: { code: string; name: string }[] = [];
  for (const [code, name] of routineTeachers.entries()) {
    if (!dirCodes.has(code)) {
      missingFromDir.push({ code, name });
    }
  }

  console.log('\nTeachers in CURATED_ROUTINES but MISSING from DIU_FACULTY_DIRECTORY:');
  console.log(missingFromDir);
}

main();
