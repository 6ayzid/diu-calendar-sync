'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Layers, GraduationCap, DoorOpen } from 'lucide-react';
import { SectionMeta, FacultyMeta, ActiveRoutineTarget } from '@/types/schedule';
import { BATCH_DEFINITIONS } from '@/data/sections';
import { parseShorthandSectionQuery, ParsedSectionQuery } from '@/lib/section-parser';
import { searchAndRankFaculty } from '@/data/faculty';
import { Tooltip } from '@/components/ui/Tooltip';

interface SectionSelectorProps {
  sections: SectionMeta[];
  selectedSection?: SectionMeta | null;
  selectedSubSection?: '1' | '2' | 'all' | null;
  activeTarget?: ActiveRoutineTarget | null;
  onSelectSection: (section: SectionMeta) => void;
  onSelectSubSection: (sub: '1' | '2' | 'all') => void;
  onSelectFaculty?: (faculty: FacultyMeta) => void;
  isCompareMode?: boolean;
  onToggleCompareMode?: (enabled: boolean) => void;
  onSelectCompareTarget?: (target: ActiveRoutineTarget) => void;
  onOpenRoomFinder?: (room?: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface ScoredSection {
  section: SectionMeta;
  score: number;
}

function searchAndRankSections(
  sections: SectionMeta[],
  rawQuery: string
): { results: SectionMeta[]; shorthandMatch: { section: SectionMeta; parsed: ParsedSectionQuery } | null } {
  const query = rawQuery.trim().toLowerCase();

  // 1. Shorthand match (e.g. "66o2", "68d1", "66o")
  const parsed = parseShorthandSectionQuery(query);
  let shorthandMatch: { section: SectionMeta; parsed: ParsedSectionQuery } | null = null;

  if (parsed && parsed.targetId) {
    const directHit = sections.find(
      (s) => s.id.toLowerCase() === parsed.targetId.toLowerCase()
    );
    if (directHit) {
      shorthandMatch = { section: directHit, parsed };
    }
  }

  if (!query) {
    return { results: sections, shorthandMatch: null };
  }

  const normQuery = query.replace(/[^a-z0-9]/g, '');
  const scoredList: ScoredSection[] = [];

  for (const s of sections) {
    const normId = s.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const compactCode = `${s.batchNumber}${s.sectionLetter}`.toLowerCase();
    const batchStr = `batch${s.batchNumber}`.toLowerCase();
    const bStr = `b${s.batchNumber}`.toLowerCase();
    const secLetter = s.sectionLetter.toLowerCase();

    let score = -1;

    if (parsed && s.id.toLowerCase() === parsed.targetId.toLowerCase()) {
      score = 0;
    } else if (compactCode === normQuery || normId === normQuery) {
      score = 1;
    } else if (compactCode.startsWith(normQuery) || normId.startsWith(normQuery)) {
      score = 10;
    } else if (compactCode.includes(normQuery) || normId.includes(normQuery)) {
      score = 20;
    } else if (
      normQuery === bStr ||
      normQuery === batchStr ||
      batchStr.includes(normQuery) ||
      bStr.includes(normQuery)
    ) {
      score = 30;
    } else if (normQuery.length === 1 && secLetter === normQuery) {
      score = 40;
    } else if (
      s.displayName.toLowerCase().includes(query) ||
      s.displayName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normQuery)
    ) {
      score = 50;
    }

    if (score >= 0) {
      scoredList.push({ section: s, score });
    }
  }

  scoredList.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (b.section.batchNumber !== a.section.batchNumber) {
      return b.section.batchNumber - a.section.batchNumber;
    }
    return a.section.sectionLetter.localeCompare(b.section.sectionLetter);
  });

  return {
    results: scoredList.map((r) => r.section),
    shorthandMatch,
  };
}

export function SectionSelector({
  sections,
  selectedSection,
  selectedSubSection,
  activeTarget,
  onSelectSection,
  onSelectSubSection,
  onSelectFaculty,
  isCompareMode = false,
  onToggleCompareMode,
  onSelectCompareTarget,
  onOpenRoomFinder,
  isOpen = true,
  onClose,
}: SectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [prevCompareProp, setPrevCompareProp] = useState(isCompareMode);
  const [internalIsComparing, setInternalIsComparing] = useState(isCompareMode);
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (prevCompareProp !== isCompareMode) {
    setPrevCompareProp(isCompareMode);
    setInternalIsComparing(isCompareMode);
  }

  const isComparing = internalIsComparing;

  const handleToggleComparing = (val?: boolean) => {
    const next = typeof val === 'boolean' ? val : !isComparing;
    setInternalIsComparing(next);
    onToggleCompareMode?.(next);
  };

  // Keyboard auto-focus & clear previous input whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter & rank sections using fuzzy/smart matcher
  const { results: filteredSections, shorthandMatch } = useMemo(() => {
    return searchAndRankSections(sections, searchQuery);
  }, [sections, searchQuery]);

  const [liveFacultyResults, setLiveFacultyResults] = useState<FacultyMeta[]>([]);

  // Live faculty auto-discovery from backend
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2 || /^\d+$/.test(query)) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/faculty/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.results && Array.isArray(data.results)) {
            setLiveFacultyResults(
              data.results.map((r: { code: string; name: string; department?: string; designation?: string; aliases?: string[] }) => ({
                code: r.code,
                name: r.name,
                department: r.department || 'CSE',
                designation: r.designation,
                aliases: r.aliases || [],
              }))
            );
          }
        }
      } catch {
        // Ignore background fetch errors
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Filter & rank faculty using local fuzzy/initials matcher
  const facultyResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchAndRankFaculty(searchQuery);
  }, [searchQuery]);

  // Combine local fuzzy results with live-discovered faculty
  const combinedFacultyResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const map = new Map<string, { faculty: FacultyMeta; score: number; isLive: boolean }>();

    for (const r of facultyResults) {
      map.set(r.faculty.code.toUpperCase(), { ...r, isLive: false });
    }

    for (const lf of liveFacultyResults) {
      const codeUpper = lf.code.toUpperCase();
      if (!map.has(codeUpper)) {
        map.set(codeUpper, {
          faculty: lf,
          score: 2,
          isLive: true,
        });
      } else {
        const existing = map.get(codeUpper)!;
        existing.isLive = true;
        if (lf.designation && !existing.faculty.designation) {
          existing.faculty.designation = lf.designation;
        }
      }
    }

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.faculty.name.localeCompare(b.faculty.name);
    });
    return list;
  }, [searchQuery, facultyResults, liveFacultyResults]);

  const isFacultyTop = useMemo(() => {
    if (combinedFacultyResults.length === 0) return false;
    if (shorthandMatch) return false;
    if (filteredSections.length === 0) return true;
    return combinedFacultyResults[0].score >= 60 && !/\d/.test(searchQuery);
  }, [combinedFacultyResults, shorthandMatch, filteredSections, searchQuery]);

  // Detect if query looks like a classroom search (e.g. "201", "KT-502", "ANX1")
  const roomMatch = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return null;
    if (/^(KT|ANX|G1|LAB|ROOM)/i.test(q)) {
      const cleaned = q.replace(/^ROOM\s*/i, '').trim();
      return cleaned || q;
    }
    if (/^\d{3}$/.test(q)) {
      return `KT-${q}`;
    }
    return null;
  }, [searchQuery]);

  const handleApplySelection = (sec: SectionMeta, sub?: '1' | '2' | 'all') => {
    if (isComparing && onSelectCompareTarget) {
      onSelectCompareTarget({ type: 'section', section: sec, subSection: sub || 'all' });
      if (onClose) onClose();
      return;
    }
    onSelectSection(sec);
    if (sub) {
      onSelectSubSection(sub);
    }
    if (onClose) onClose();
  };

  const handleApplyFaculty = (fac: FacultyMeta) => {
    if (isComparing && onSelectCompareTarget) {
      onSelectCompareTarget({ type: 'faculty', faculty: fac });
      if (onClose) onClose();
      return;
    }
    if (onSelectFaculty) {
      onSelectFaculty(fac);
    }
    if (onClose) onClose();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (shorthandMatch) {
        handleApplySelection(shorthandMatch.section, shorthandMatch.parsed.subSection);
      } else if (isFacultyTop && combinedFacultyResults.length > 0) {
        handleApplyFaculty(combinedFacultyResults[0].faculty);
      } else if (filteredSections.length > 0) {
        handleApplySelection(filteredSections[0]);
      } else if (combinedFacultyResults.length > 0) {
        handleApplyFaculty(combinedFacultyResults[0].faculty);
      } else if (roomMatch && onOpenRoomFinder) {
        onOpenRoomFinder(roomMatch);
        if (onClose) onClose();
      }
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        e.preventDefault();
        setSearchQuery('');
      } else if (onClose) {
        e.preventDefault();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xl space-y-3 dark:border-slate-800 dark:bg-slate-900">
      {/* ─── Modal Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 shrink-0">
            {activeTarget?.type === 'faculty' ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <Layers className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <h2 id="section-modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {isComparing ? 'Compare Routine' : 'Select Routine'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
              {activeTarget ? (
                <>
                  Current:{' '}
                  {activeTarget.type === 'faculty' ? (
                    <strong className="text-slate-700 dark:text-slate-300">
                      {activeTarget.faculty.name} ({activeTarget.faculty.code})
                    </strong>
                  ) : (
                    <strong className="text-slate-700 dark:text-slate-300">
                      {selectedSection?.id}
                      {selectedSubSection && selectedSubSection !== 'all' && selectedSection
                        ? ` (${selectedSection.sectionLetter}${selectedSubSection})`
                        : ''}
                    </strong>
                  )}
                </>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">No routine selected</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Header Compare Mode Pill Toggle */}
          <button
            type="button"
            onClick={() => handleToggleComparing()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              isComparing
                ? 'bg-emerald-500 text-emerald-950 border-emerald-400 dark:bg-emerald-500 dark:text-emerald-950 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white'
            }`}
            title={isComparing ? 'Switch to primary selection' : 'Enable routine comparison'}
          >
            {isComparing ? 'Comparing' : '+ Compare'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close selector modal"
              className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Search Bar (The ONLY Primary Focus) ──────────────────────── */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          ref={searchInputRef}
          autoFocus
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={
            isComparing
              ? "Search routine to compare (e.g. 66o2, 67e, MSR)..."
              : "Search routine (e.g. 66o2, 67e, MSR, or teacher name)..."
          }
          aria-label="Search section, teacher, or room"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 placeholder:font-sans font-mono transition-all duration-150 outline-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 focus:shadow-[0_0_12px_rgba(16,185,129,0.15)] min-h-[44px] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search query"
            className="absolute right-2.5 top-2.5 h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ─── Content Area: Browsing Peek vs Search Results ───────────── */}
      {!searchQuery ? (
        /* ─────────────────────────────────────────────────────────────────
           VIEW A: COMPACT BATCH BROWSING (Peek with scroll reveal)
        ─────────────────────────────────────────────────────────────────── */
        <div>
          <div className="relative">
            <div className="max-h-[240px] overflow-y-auto pr-1.5 scrollbar-thin">
              {/* Empty spacer + divider scroll away with content */}
              <div className="pt-4">
                <div className="relative flex items-center py-1.5 mb-2">
                  <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800/80"></div>
                  <span className="shrink-0 px-2.5 text-xs font-mono text-slate-400 dark:text-slate-500">
                    or browse manually
                  </span>
                  <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800/80"></div>
                </div>
              </div>
              <div className="space-y-2">
              {BATCH_DEFINITIONS.map((b) => (
                <div key={b.batchNumber} className="flex items-start gap-2 py-0.5">
                  <span className="w-12 shrink-0 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 pt-1">
                    B-{b.batchNumber}
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {b.letters.map((letter) => {
                      const secId = `${b.batchNumber}_${letter}`;
                      const isSelected = activeTarget && activeTarget.type !== 'faculty' && selectedSection?.id === secId;

                      return (
                        <Tooltip key={secId} content={`Select section ${secId}`} side="top">
                          <button
                            type="button"
                            onClick={() => {
                              const sec = sections.find((s) => s.id === secId);
                              if (sec) handleApplySelection(sec);
                            }}
                            className={`h-7 min-w-[1.85rem] px-1 rounded-lg text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-emerald-950 border border-emerald-400 shadow-xs dark:bg-emerald-500 dark:text-emerald-950'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60 dark:hover:bg-slate-700 dark:hover:text-white'
                            }`}
                            aria-label={`Section ${secId}`}
                          >
                            {letter}
                          </button>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>
            {/* Subtle bottom fade hint indicating scrollable content */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
          </div>

          {/* Compact Inline Lab Group Selector (Only in student browsing mode when section is chosen) */}
          {activeTarget && activeTarget.type !== 'faculty' && selectedSection && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-mono text-slate-400 text-xs">
                Lab group: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedSection.id}</strong>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => onSelectSubSection('all')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSubSection === 'all'
                      ? 'bg-emerald-500 text-emerald-950 font-bold dark:bg-emerald-500 dark:text-emerald-950 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubSection('1')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSubSection === '1'
                      ? 'bg-emerald-500 text-emerald-950 font-bold dark:bg-emerald-500 dark:text-emerald-950 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {selectedSection.sectionLetter}1
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubSection('2')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSubSection === '2'
                      ? 'bg-emerald-500 text-emerald-950 font-bold dark:bg-emerald-500 dark:text-emerald-950 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {selectedSection.sectionLetter}2
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────
           VIEW B: ACTIVE SEARCH RESULTS (Sections, Faculty & Rooms)
        ─────────────────────────────────────────────────────────────────── */
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1.5 scrollbar-thin">
          {/* Shorthand Quick Match (e.g. 66o2) */}
          {shorthandMatch && (
            <button
              type="button"
              onClick={() => handleApplySelection(shorthandMatch.section, shorthandMatch.parsed.subSection)}
              className="w-full rounded-xl border border-emerald-500/80 bg-emerald-50/80 dark:bg-emerald-950/40 dark:border-emerald-500/60 p-2.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs text-left"
            >
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-emerald-500 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  ↵
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 font-mono">
                  {shorthandMatch.section.id}
                  {shorthandMatch.parsed.subSection !== 'all' ? ` (Lab ${shorthandMatch.parsed.subSection})` : ''}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                Press Enter to select →
              </span>
            </button>
          )}

          {/* Room Inspection Match */}
          {roomMatch && onOpenRoomFinder && (
            <button
              type="button"
              onClick={() => {
                onOpenRoomFinder(roomMatch);
                if (onClose) onClose();
              }}
              className="w-full rounded-xl border border-sky-400/80 bg-sky-50/80 dark:bg-sky-950/40 dark:border-sky-500/60 p-2.5 flex items-center justify-between cursor-pointer hover:bg-sky-100/80 dark:hover:bg-sky-900/40 transition-colors shadow-2xs text-left"
            >
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-sky-950 dark:text-sky-100 font-mono">
                  Room {roomMatch}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-300">
                View Schedule →
              </span>
            </button>
          )}

          {/* Faculty Results */}
          {combinedFacultyResults.length > 0 && (
            <div className={`space-y-1 ${isFacultyTop ? 'order-first' : 'order-last'}`}>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-0.5">
                Faculty ({combinedFacultyResults.length})
              </div>
              <div className="space-y-1">
                {combinedFacultyResults.slice(0, 10).map(({ faculty: f }) => (
                  <button
                    key={f.code}
                    type="button"
                    onClick={() => handleApplyFaculty(f)}
                    className="w-full flex items-center justify-between p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/20 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800/40 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0 px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                        {f.code}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {f.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono truncate block">
                          {f.designation ? `${f.designation} • ` : ''}CSE
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2">
                      {isComparing ? 'Compare →' : 'Select →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Results */}
          {filteredSections.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-0.5">
                Sections ({filteredSections.length})
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {filteredSections.slice(0, 24).map((s) => {
                  const isSelected = activeTarget && activeTarget.type !== 'faculty' && selectedSection?.id === s.id;
                  return (
                    <Tooltip key={s.id} content={`Select section ${s.id}`} side="top">
                      <button
                        type="button"
                        onClick={() => handleApplySelection(s)}
                        className={`py-2 px-1.5 rounded-xl border text-center transition-colors cursor-pointer w-full ${
                          isSelected
                            ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-xs dark:bg-emerald-500 dark:text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/20 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/50'
                        }`}
                        aria-label={`Section ${s.id}`}
                      >
                        <span className="text-xs sm:text-sm font-bold font-mono block">
                          {s.id}
                        </span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Search State */}
          {combinedFacultyResults.length === 0 && filteredSections.length === 0 && !roomMatch && (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
              <p>No sections or teachers found matching &quot;{searchQuery}&quot;.</p>
              {searchQuery.trim().length >= 2 && !/\d/.test(searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() =>
                    handleApplyFaculty({
                      code: searchQuery.trim().toUpperCase(),
                      name: searchQuery.trim().toUpperCase(),
                      department: 'CSE',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Load teacher &quot;{searchQuery.trim().toUpperCase()}&quot; schedule
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-modal-title"
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
          {content}
        </div>
      </div>
    );
  }

  return <section aria-labelledby="section-modal-title">{content}</section>;
}
