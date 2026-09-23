'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowLeftRight,
  CalendarDays,
  Plus,
  ChevronRight,
  User,
} from 'lucide-react';
import { SectionMeta, RoutineClass, FacultyMeta } from '@/types/schedule';
import { getSectionById } from '@/data/sections';
import { generateScheduleForSection } from '@/data/routines';
import { getFacultyByCode } from '@/data/faculty';

interface SectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string | null;
  initialClasses?: RoutineClass[] | null;
  onCompareWithSection?: (section: SectionMeta) => void;
  onOpenComparePicker?: () => void;
  onNavigateToSection?: (section: SectionMeta) => void;
  onOpenFacultyInfo?: (facultyCode: string, initialFaculty?: FacultyMeta) => void;
}

interface TeacherEntry {
  code: string;
  name: string;
  image?: string;
  room?: string;
  courses: string[];
}

function TeacherAvatar({ teacher }: { teacher: TeacherEntry }) {
  const [imgError, setImgError] = useState(false);
  const proxiedSrc = `/api/faculty/image?code=${encodeURIComponent(teacher.code)}`;

  if (!imgError) {
    return (
      <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
        <img
          src={proxiedSrc}
          alt={teacher.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover object-center rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
      <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
    </div>
  );
}

export function SectionInfoModal({
  isOpen,
  onClose,
  sectionId,
  initialClasses,
  onCompareWithSection,
  onOpenComparePicker,
  onNavigateToSection,
  onOpenFacultyInfo,
}: SectionInfoModalProps) {
  const [section, setSection] = useState<SectionMeta | null>(null);
  const [classes, setClasses] = useState<RoutineClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !sectionId) {
      setSection(null);
      setClasses([]);
      setCopiedKey(null);
      return;
    }

    const cleanId = sectionId.trim().split(' ')[0].split('(')[0].toUpperCase();
    const found =
      getSectionById(cleanId) ||
      getSectionById(cleanId.replace(/([A-Z])([12])$/, '$1')) ||
      getSectionById(cleanId.replace(/[12]$/, ''));

    const resolvedSection: SectionMeta =
      found ||
      (() => {
        const [batchNum, letter] = cleanId.split('_');
        return {
          id: cleanId,
          batch: `Batch ${batchNum || 'CSE'}`,
          batchNumber: parseInt(batchNum, 10) || 0,
          sectionLetter: letter || cleanId,
          displayName: `Batch ${batchNum || ''} - Section ${letter || cleanId}`,
          hasSubSections: true,
          subSections: [`${letter || ''}1`, `${letter || ''}2`],
        };
      })();

    setSection(resolvedSection);

    // 1. If passed initialClasses from active screen and matches this section
    if (initialClasses && initialClasses.length > 0) {
      const match = initialClasses.some(
        (c) => c.sectionId === resolvedSection.id || (c.batch && `${c.batch}_${c.section}` === resolvedSection.id)
      );
      if (match) {
        setClasses(initialClasses);
        setLoading(false);
        return;
      }
    }

    // 2. Immediate local fallback while network request processes
    const localFallback = generateScheduleForSection(resolvedSection.id);
    setClasses(localFallback);
    setLoading(true);

    // 3. Fetch live section routine from API
    let isCancelled = false;
    fetch(`/api/schedule?section=${encodeURIComponent(resolvedSection.id)}&sub=all`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.classes) && data.classes.length > 0) {
          setClasses(data.classes);
        }
      })
      .catch((err) => {
        console.warn('Section schedule fetch error:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, sectionId, initialClasses]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy helper
  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  }, []);

  // Extract unique teachers taking classes for this section
  const teachers = useMemo<TeacherEntry[]>(() => {
    if (!classes || classes.length === 0) return [];
    const map = new Map<string, TeacherEntry>();

    for (const c of classes) {
      const code = (c.teacherCode || '').trim().toUpperCase();
      if (!code || code === 'TBA' || code === 'NONE') continue;

      const cleanCourse = c.courseCode.split('(')[0].trim();

      if (!map.has(code)) {
        const fac = getFacultyByCode(code);
        let displayName = fac?.name || c.teacherName || code;
        const ntMatch = code.match(/^NT-?(\d+)$/i);
        if (ntMatch && (!fac || displayName === code || displayName.startsWith('NT-'))) {
          displayName = `New Teacher ${ntMatch[1]} (CSE)`;
        }

        map.set(code, {
          code,
          name: displayName,
          image: fac?.image,
          room: fac?.room || (c.room ? c.room.split('(')[0].trim() : undefined),
          courses: [],
        });
      }

      const item = map.get(code)!;
      if (!item.courses.includes(cleanCourse)) {
        item.courses.push(cleanCourse);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  if (!isOpen || !sectionId || !section) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] transition-all overflow-hidden p-4 sm:p-5 space-y-3">
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 z-20 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Minimal Header: Just the Section ID with copy button */}
        <div className="flex items-center gap-1.5 pr-8">
          <h3
            id="section-modal-title"
            className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white leading-tight select-all"
          >
            {section.id}
          </h3>
          <button
            type="button"
            onClick={() => handleCopy(section.id, 'id')}
            title="Copy section ID"
            aria-label="Copy section ID"
            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            {copiedKey === 'id' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Scrollable Body: ONLY Teachers Taking Classes */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-[140px]">
          {teachers.length > 0 ? (
            teachers.map((teacher) => (
              <button
                key={teacher.code}
                type="button"
                onClick={() => {
                  const fac = getFacultyByCode(teacher.code);
                  const initialFac: FacultyMeta = {
                    code: teacher.code,
                    name: teacher.name,
                    department: fac?.department || 'CSE',
                    designation: fac?.designation || 'Faculty Member',
                    room: teacher.room || fac?.room,
                    phone: fac?.phone,
                    email: fac?.email,
                    image: teacher.image || fac?.image,
                  };
                  onOpenFacultyInfo?.(teacher.code, initialFac);
                }}
                title={`View profile for ${teacher.name}`}
                className="w-full text-left p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/90 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TeacherAvatar teacher={teacher} />
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      {teacher.courses.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60">
                    {teacher.code}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs font-mono text-slate-400">
              {loading ? 'Loading teachers...' : 'No teachers found.'}
            </div>
          )}
        </div>

        {/* Bottom Action Row: Exactly 3 balanced buttons (No double plus!) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 shrink-0">
          {/* 1. Compare */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onCompareWithSection?.(section);
            }}
            title={`Compare ${section.id} with current routine`}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs truncate"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Compare</span>
          </button>

          {/* 2. Add Compare: Single Plus icon + Add text */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenComparePicker?.();
            }}
            title="Compare with another section or teacher routine"
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs truncate"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Add</span>
          </button>

          {/* 3. View */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToSection?.(section);
            }}
            title={`View full routine for ${section.id}`}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs truncate"
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
