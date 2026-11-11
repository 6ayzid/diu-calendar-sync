import { DayOfWeek, RoutineClass, ActiveRoutineTarget } from '@/types/schedule';
import { getCourseName } from '@/lib/courses';
import { getFacultyByCode } from '@/data/faculty';

export const COMPACT_DAYS: DayOfWeek[] = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
];

export const COMPACT_SLOTS: [string, string][] = [
  ['08:30', '10:00'],
  ['10:00', '11:30'],
  ['11:30', '13:00'],
  ['13:00', '14:30'],
  ['14:30', '16:00'],
  ['16:00', '17:30'],
  ['08:30', '11:30'],
  ['11:30', '14:30'],
  ['14:30', '17:30'],
];

/**
 * 6-number tuple representing a single class slot:
 * [courseIdx, teacherIdx, roomIdx, dayIdx, slotIdx, subNum (0 = common, 1 = sub1, 2 = sub2)]
 */
export type CompactClassTuple = [number, number, number, number, number, number];

export interface CompactRoutineBundle {
  /** Routine version, e.g. "v5.1" */
  v: string;
  /** Shared dictionary of unique room names */
  r: string[];
  /** Shared dictionary of bare course codes */
  c: string[];
  /** Shared dictionary of teacher initials */
  t: string[];
  /** Custom time slots if any class falls outside COMPACT_SLOTS */
  cs?: [string, string][];
  /** Map of sectionId -> array of 6-number class tuples */
  s: Record<string, CompactClassTuple[]>;
}

const COMPACT_BUNDLE_STORAGE_KEY = 'diu_compact_routine_bundle_v1';

export function encodeCompactRoutineBundle(
  sections: Record<string, RoutineClass[]>,
  version: string
): CompactRoutineBundle {
  const rooms: string[] = [];
  const roomMap = new Map<string, number>();

  const courses: string[] = [];
  const courseMap = new Map<string, number>();

  const teachers: string[] = [];
  const teacherMap = new Map<string, number>();

  const customSlots: [string, string][] = [];
  const slotMap = new Map<string, number>();
  COMPACT_SLOTS.forEach(([st, et], idx) => {
    slotMap.set(`${st}-${et}`, idx);
  });

  const getIndex = (val: string, list: string[], map: Map<string, number>): number => {
    const existing = map.get(val);
    if (existing !== undefined) return existing;
    const idx = list.length;
    list.push(val);
    map.set(val, idx);
    return idx;
  };

  const encodedSections: Record<string, CompactClassTuple[]> = {};

  for (const [secId, classList] of Object.entries(sections)) {
    const tuples: CompactClassTuple[] = [];
    for (const item of classList) {
      const bareCourse = item.courseCode.split('(')[0].trim().toUpperCase();
      const teacher = (item.teacherCode || 'TBA').trim().toUpperCase();
      const room = (item.room || 'TBA').trim();
      const dayIdx = Math.max(0, COMPACT_DAYS.indexOf(item.dayOfWeek));

      const slotKey = `${item.startTime}-${item.endTime}`;
      let slotIdx = slotMap.get(slotKey);
      if (slotIdx === undefined) {
        slotIdx = COMPACT_SLOTS.length + customSlots.length;
        customSlots.push([item.startTime, item.endTime]);
        slotMap.set(slotKey, slotIdx);
      }

      const subNum = item.subSection === '1' ? 1 : item.subSection === '2' ? 2 : 0;

      tuples.push([
        getIndex(bareCourse, courses, courseMap),
        getIndex(teacher, teachers, teacherMap),
        getIndex(room, rooms, roomMap),
        dayIdx,
        slotIdx,
        subNum,
      ]);
    }
    encodedSections[secId.toUpperCase()] = tuples;
  }

  const verMatch = version.match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
  const formattedVer = verMatch ? `v${verMatch[1]}` : version;

  const bundle: CompactRoutineBundle = {
    v: formattedVer,
    r: rooms,
    c: courses,
    t: teachers,
    s: encodedSections,
  };

  if (customSlots.length > 0) {
    bundle.cs = customSlots;
  }

  return bundle;
}

function hydrateTuple(
  tuple: CompactClassTuple,
  secId: string,
  idx: number,
  bundle: CompactRoutineBundle
): RoutineClass {
  const [courseIdx, teacherIdx, roomIdx, dayIdx, slotIdx, subNum] = tuple;
  const bareCourse = bundle.c[courseIdx] || 'COURSE';
  const teacherCode = bundle.t[teacherIdx] || 'TBA';
  const room = bundle.r[roomIdx] || 'TBA';
  const dayOfWeek = COMPACT_DAYS[dayIdx] || 'SATURDAY';

  const slotPair =
    slotIdx < COMPACT_SLOTS.length
      ? COMPACT_SLOTS[slotIdx]
      : bundle.cs?.[slotIdx - COMPACT_SLOTS.length] || ['08:30', '10:00'];
  const [startTime, endTime] = slotPair;

  const subSection: '1' | '2' | null = subNum === 1 ? '1' : subNum === 2 ? '2' : null;
  const [batch, section] = secId.split('_');

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const dur = eh * 60 + em - (sh * 60 + sm);

  const courseTitle = getCourseName(bareCourse) || bareCourse;
  const isLab =
    subSection !== null ||
    dur >= 150 ||
    courseTitle.toLowerCase().includes('lab') ||
    courseTitle.toLowerCase().includes('sessional');

  const subId = subSection ? `sub${subSection}` : 'common';
  const facMeta = getFacultyByCode(teacherCode);

  return {
    id: `${secId}-${bareCourse}-${subId}-${dayOfWeek}-${startTime.replace(':', '')}-${idx}`,
    batch: batch || '68',
    section: section || 'A',
    sectionId: secId,
    subSection,
    courseCode: subSection ? `${bareCourse}(${secId}${subSection})` : `${bareCourse}(${secId})`,
    courseTitle,
    teacherCode,
    teacherName: facMeta?.name || teacherCode,
    room,
    dayOfWeek,
    startTime,
    endTime,
    type: isLab ? 'Lab' : 'Theory',
    color: isLab ? (subSection === '1' ? 'amber' : 'rose') : 'indigo',
  };
}

export function decodeSectionFromBundle(
  bundle: CompactRoutineBundle,
  sectionId: string,
  subSection?: '1' | '2' | 'all' | null
): RoutineClass[] {
  const normId = sectionId.trim().toUpperCase().replace('-', '_');
  const tuples = bundle.s[normId];
  if (!tuples || tuples.length === 0) return [];

  const allClasses = tuples.map((t, i) => hydrateTuple(t, normId, i, bundle));
  if (!subSection || subSection === 'all') {
    return allClasses;
  }
  return allClasses.filter((c) => !c.subSection || c.subSection === subSection);
}

export function decodeFacultyFromBundle(
  bundle: CompactRoutineBundle,
  teacherCode: string
): RoutineClass[] {
  const cleanCode = teacherCode.trim().toUpperCase();
  const facMeta = getFacultyByCode(cleanCode);
  const targetCodes = new Set<string>([
    cleanCode,
    ...(facMeta?.aliases || []).map((a) => a.toUpperCase()),
  ]);

  const targetIndices = new Set<number>();
  bundle.t.forEach((code, idx) => {
    if (targetCodes.has(code.toUpperCase())) {
      targetIndices.add(idx);
    }
  });

  if (targetIndices.size === 0) return [];

  const map = new Map<string, RoutineClass>();
  for (const [secId, tuples] of Object.entries(bundle.s)) {
    tuples.forEach((tuple, idx) => {
      if (targetIndices.has(tuple[1])) {
        const c = hydrateTuple(tuple, secId, idx, bundle);
        const cleanCourse = c.courseCode.split('(')[0].trim();
        const key = `${c.dayOfWeek}_${c.startTime}_${c.endTime}_${cleanCourse}_${c.room}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          if (c.sectionId && !existing.sectionId.includes(c.sectionId)) {
            existing.sectionId = `${existing.sectionId}, ${c.sectionId}`;
          }
        } else {
          map.set(key, c);
        }
      }
    });
  }

  return Array.from(map.values());
}

export function saveCompactBundleToStorage(bundle: CompactRoutineBundle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPACT_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCompactBundleFromStorage(): CompactRoutineBundle | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COMPACT_BUNDLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompactRoutineBundle;
    if (parsed && parsed.v && Array.isArray(parsed.c) && parsed.s) {
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function getOfflineScheduleFromBundle(
  target: ActiveRoutineTarget
): { classes: RoutineClass[]; version: string } | null {
  const bundle = loadCompactBundleFromStorage();
  if (!bundle) return null;

  const classes =
    target.type === 'faculty'
      ? decodeFacultyFromBundle(bundle, target.faculty.code)
      : decodeSectionFromBundle(bundle, target.section.id, target.subSection);

  if (classes.length === 0) return null;
  return { classes, version: bundle.v };
}
