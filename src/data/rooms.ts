export type BuildingZone = 'KT' | 'ANX1' | 'Labs' | 'Other';

export interface CategorizedRoom {
  name: string;
  zone: BuildingZone;
  floor: string;
}

/**
 * Categorizes a room into its campus building zone.
 * Order: KT -> ANX1 (between standard rooms and labs) -> Labs (all labs together) -> Other
 */
export function categorizeRoom(roomName: string): CategorizedRoom {
  const name = roomName.trim();
  const upper = name.toUpperCase();

  // All labs grouped together
  if (
    upper.includes('LAB') ||
    upper.startsWith('G1-') ||
    upper.startsWith('G1 ')
  ) {
    return { name, zone: 'Labs', floor: '0' };
  }

  // Annex rooms (between standard rooms and lab rooms)
  if (upper.startsWith('ANX1-') || upper.startsWith('ANX1 ') || upper.startsWith('ANNEX')) {
    const num = name.replace(/^ANX1[-\s]?/i, '').replace(/^ANNEX\s*1?\s*[-\s]?/i, '');
    const floor = num.charAt(0) || '?';
    return { name, zone: 'ANX1', floor };
  }

  // Knowledge Tower classrooms
  if (upper.startsWith('KT-') || upper.startsWith('KT ')) {
    const num = name.replace(/^KT[-\s]?/i, '');
    const floor = num.charAt(0) || '?';
    return { name, zone: 'KT', floor };
  }

  return { name, zone: 'Other', floor: '?' };
}

/**
 * Formats a room name for display:
 * - Only Physics lab retains its parenthetical descriptor: "KT-804 (Physics)"
 * - All other lab tags like "(COM LAB)", "(E.C. & D.E. Lab)" are removed: "G1-006", "KT-503"
 */
export function formatRoomDisplay(roomName: string): string {
  if (/physics/i.test(roomName)) {
    return roomName.replace(/\s*\([^)]*Physics[^)]*\)/i, ' (Physics)').trim();
  }
  return roomName.replace(/\s*\([^)]*(?:Lab|LAB|E\.C\.)[^)]*\)/gi, '').trim();
}

/**
 * Strips display annotations like "(COM LAB)", "(Physics Lab)" to extract the exact room code
 * expected by the upstream schedule query endpoint (e.g. "G1-006 (COM LAB)" -> "G1-006").
 */
export function getQueryRoomCode(roomName: string): string {
  return roomName
    .replace(/\s*\([^)]*(?:Lab|LAB|E\.C\.)[^)]*\)/gi, '')
    .trim();
}

export interface CampusRoom {
  id: string;
  name: string;
  cleanName: string;
  zone: BuildingZone;
  floor: string;
  isLab: boolean;
  labType?: string;
}

/**
 * All verified CSE & campus rooms extracted from the university routine schedule.
 */
export const ALL_CAMPUS_ROOM_NAMES = [
  'ANX1-101',
  'ANX1-102',
  'ANX1-103',
  'ANX1-201',
  'ANX1-202',
  'ANX1-203',
  'ANX1-204',
  'ANX1-207',
  'ANX1-208',
  'ANX1-209',
  'ANX1-210',
  'ANX1-302',
  'ANX1-307',
  'ANX1-401',
  'ANX1-403',
  'EMBED LAB-KT-301',
  'G1-001 (COM LAB)',
  'G1-002 (COM LAB)',
  'G1-003 (COM LAB)',
  'G1-004 (COM LAB)',
  'G1-005 (COM LAB)',
  'G1-006 (COM LAB)',
  'G1-007 (COM LAB)',
  'G1-008 (COM LAB)',
  'G1-009 (COM LAB)',
  'G1-010 (COM LAB)',
  'G1-011 (COM LAB)',
  'G1-012 (COM LAB)',
  'G1-013 (COM LAB)',
  'G1-014 (COM LAB)',
  'G1-016 (COM LAB)',
  'G1-017 (COM LAB)',
  'G1-018 (COM LAB)',
  'G1-020 (COM LAB)',
  'G1-021 (COM LAB)',
  'G1-022 (COM LAB)',
  'G1-026',
  'G1-027',
  'IOT LAB- KT-502',
  'KT-201',
  'KT-208',
  'KT-216',
  'KT-217',
  'KT-218',
  'KT-219',
  'KT-220',
  'KT-221',
  'KT-222',
  'KT-223',
  'KT-224',
  'KT-303',
  'KT-304',
  'KT-305',
  'KT-306',
  'KT-307',
  'KT-318(A)',
  'KT-318(B)',
  'KT-320',
  'KT-501(A) (COM LAB)',
  'KT-501(B) (COM LAB)',
  'KT-503 (COM LAB)',
  'KT-504 (COM LAB)',
  'KT-510 (COM LAB)',
  'KT-513 (COM LAB)',
  'KT-514',
  'KT-515',
  'KT-516',
  'KT-517(A)',
  'KT-518',
  'KT-804 (Physics Lab)',
  'KT-809 (E.C. & D.E. Lab)',
  'KT-810 (E.C. & B.E. Lab)',
  'KT-815 (Physics Lab)',
  'KT-816 (Physics Lab)',
  'SH-103 (E.C. & B.E. Lab)',
  'SH-105 (E.C. & B.E. Lab)',
] as const;

/**
 * Normalizes a room name by stripping lab descriptors and prefixes while preserving sub-room identifiers like (A), (B).
 */
export function stripLabSuffix(str: string): string {
  return str
    .replace(/\s*\((?:[^)]*(?:Lab|LAB|E\.C\.|COM LAB|COMPUTER LAB|Physics Lab)[^)]*)\)/gi, '')
    .replace(/^(?:IOT\s*LAB\s*[-–]\s*|EMBED\s*LAB\s*[-–]\s*)/i, '')
    .trim()
    .toUpperCase();
}

/**
 * Normalizes a room name to alphanumeric uppercase without lab descriptors,
 * preserving sub-room identifiers like A or B (e.g. "KT-501(A) (COM LAB)" -> "KT501A").
 */
export function normalizeRoomKey(str: string): string {
  return str
    .replace(/\s*\((?:[^)]*(?:Lab|LAB|E\.C\.|COM LAB|COMPUTER LAB|Physics Lab)[^)]*)\)/gi, '')
    .replace(/^(?:IOT\s*LAB\s*[-–]\s*|EMBED\s*LAB\s*[-–]\s*)/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

/**
 * Resolves any raw room name, query string, or variant to its authoritative canonical room name in ALL_CAMPUS_ROOM_NAMES.
 */
export function resolveCanonicalRoomName(rawName: string): string {
  const s = rawName.trim();
  if (!s) return '';

  // 1. Direct case-insensitive match
  for (const r of ALL_CAMPUS_ROOM_NAMES) {
    if (r.toLowerCase() === s.toLowerCase()) {
      return r;
    }
  }

  const normS = normalizeRoomKey(s);

  // 2. Exact normalized alphanumeric match (e.g. "G1-004", "G1 004", "KT-502", "KT 502")
  for (const r of ALL_CAMPUS_ROOM_NAMES) {
    if (normalizeRoomKey(r) === normS) {
      return r;
    }
  }

  // 3. Strip lab descriptors and prefixes for normalized comparison
  const cleanS = stripLabSuffix(s);
  for (const r of ALL_CAMPUS_ROOM_NAMES) {
    const cleanR = stripLabSuffix(r);
    if (cleanS === cleanR) {
      return r;
    }
  }

  // 4. Lab numbers starting with 0: e.g. "004", "001", "026" -> G1 computer labs!
  if (/^0\d{2}$/.test(cleanS)) {
    const target = `G1${cleanS}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      if (normalizeRoomKey(r) === target) {
        return r;
      }
    }
  }

  // 5. Short lab number (e.g. "4" -> G1-004)
  if (/^\d{1,2}$/.test(cleanS) && parseInt(cleanS, 10) <= 27) {
    const padded = cleanS.padStart(3, '0');
    const target = `G1${padded}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      if (normalizeRoomKey(r) === target) {
        return r;
      }
    }
  }

  // 6. 3-digit numbers >= 100 (e.g. "201", "501", "103")
  if (/^\d{3}$/.test(cleanS)) {
    // Check KT first (KT-201, KT-501(A), etc.)
    const ktTarget = `KT${cleanS}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      const normR = normalizeRoomKey(r);
      if (normR === ktTarget || normR.startsWith(ktTarget)) {
        return r;
      }
    }
    // Check SH (SH-103, SH-105)
    const shTarget = `SH${cleanS}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      const normR = normalizeRoomKey(r);
      if (normR === shTarget || normR.startsWith(shTarget)) {
        return r;
      }
    }
    // Check ANX1 (ANX1-103, ANX1-201)
    const anxTarget = `ANX1${cleanS}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      const normR = normalizeRoomKey(r);
      if (normR === anxTarget || normR.startsWith(anxTarget)) {
        return r;
      }
    }
  }

  // 7. Handle "ANX" shorthand: e.g. "ANX 201" -> "ANX1-201"
  if (normS.startsWith('ANX') && !normS.startsWith('ANX1')) {
    const afterAnx = normS.replace(/^ANX/, '');
    const target = `ANX1${afterAnx}`;
    for (const r of ALL_CAMPUS_ROOM_NAMES) {
      if (normalizeRoomKey(r) === target) {
        return r;
      }
    }
  }

  // 8. Prefix match (e.g. "KT-501" matching "KT-501(A) (COM LAB)")
  for (const r of ALL_CAMPUS_ROOM_NAMES) {
    const normR = normalizeRoomKey(r);
    if (normR.startsWith(normS)) {
      return r;
    }
  }

  return s;
}

/**
 * Parsed and structured list of all campus rooms.
 */
export const ALL_CAMPUS_ROOMS: CampusRoom[] = ALL_CAMPUS_ROOM_NAMES.map((name) => {
  const cat = categorizeRoom(name);
  const isLab = name.toLowerCase().includes('lab');
  const labMatch = name.match(/\(([^)]+Lab|COM LAB|E\.C\.[^)]*)\)/i);
  const cleanName = stripLabSuffix(name);

  return {
    id: name,
    name,
    cleanName,
    zone: cat.zone,
    floor: cat.floor,
    isLab,
    labType: labMatch ? labMatch[1] : isLab ? 'Lab' : undefined,
  };
});

/**
 * Normalizes a string by stripping punctuation, extra spaces, and hyphens for fuzzy matching.
 */
function normalizeForSearch(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Fuzzy matches a user search query against a room.
 * Supports:
 * - Direct room numbers: "201" -> matches "KT-201", "ANX1-201"
 * - Compact names: "kt201" -> matches "KT-201"
 * - Lab search: "com lab", "lab 5", "embed"
 * - Substring and token matching
 */
export function fuzzyMatchRoom(query: string, room: CampusRoom): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const roomRaw = room.name.toLowerCase();
  const roomClean = room.cleanName.toLowerCase();
  const roomNormalized = normalizeForSearch(room.name);
  const qNormalized = normalizeForSearch(q);

  // Exact or direct substring match on raw or clean name
  if (roomRaw.includes(q) || roomClean.includes(q)) {
    return true;
  }

  // Normalized alphanumeric match (e.g. "kt201" in "kt201" or "anx307" in "anx1307")
  if (qNormalized && roomNormalized.includes(qNormalized)) {
    return true;
  }

  // Handle building shorthand: e.g. "anx 307" -> "anx1-307"
  if (q.startsWith('anx') && !q.startsWith('anx1')) {
    const afterAnx = q.replace(/^anx\s*/, '');
    if (afterAnx && normalizeForSearch(room.name).includes('anx1' + normalizeForSearch(afterAnx))) {
      return true;
    }
  }

  // Space-separated tokens all match somewhere
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) => {
      const normToken = normalizeForSearch(token);
      return roomRaw.includes(token) || (normToken && roomNormalized.includes(normToken));
    });
    if (allTokensMatch) return true;
  }

  return false;
}
