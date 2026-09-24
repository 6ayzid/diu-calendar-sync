'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SectionSelector } from '@/components/SectionSelector';
import { SubscriptionActions } from '@/components/SubscriptionActions';
import { TimetableGrid } from '@/components/TimetableGrid';
import { TimetableSkeleton } from '@/components/TimetableSkeleton';
import { StickySyncBar } from '@/components/StickySyncBar';
import { CompareBar } from '@/components/CompareBar';
import { RoomFinderModal } from '@/components/RoomFinderModal';
import { FacultyInfoModal } from '@/components/FacultyInfoModal';
import { SectionInfoModal } from '@/components/SectionInfoModal';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { getFacultyByCode } from '@/data/faculty';
import {
  DayOfWeek,
  RoutineClass,
  SectionMeta,
  FacultyMeta,
  ActiveRoutineTarget,
  CompareState,
  FreeTimeSlot,
} from '@/types/schedule';
import {
  calculateSharedFreeTime,
  getTotalSharedFreeHours,
  parseTargetParam,
  targetToParamString,
} from '@/lib/compare-utils';
import { Search, Sparkles, CalendarDays, ArrowRight, WifiOff, RefreshCw } from 'lucide-react';

export default function Home() {
  // 1. Initialize Active Target State (Section or Faculty) - null when unselected
  const [activeTarget, setActiveTarget] = useState<ActiveRoutineTarget | null>(null);

  const [hasSavedPreference, setHasSavedPreference] = useState(false);

  // Derived student helpers
  const selectedSection: SectionMeta | null =
    activeTarget && activeTarget.type === 'section' ? activeTarget.section : null;

  const selectedSubSection: '1' | '2' | 'all' =
    activeTarget && activeTarget.type === 'section' ? activeTarget.subSection : 'all';

  // 2. View Mode (Defaults: agenda in mobile, matrix/week in desktop, unless changed by user or URL)
  const [viewMode, setViewMode] = useState<'matrix' | 'agenda'>('matrix');
  const [hasExplicitViewMode, setHasExplicitViewMode] = useState(false);

  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
      }).formatToParts(new Date());
      const weekday = parts.find((p) => p.type === 'weekday')?.value?.toUpperCase() || '';
      const dayMap: Record<string, DayOfWeek> = {
        SATURDAY: 'SATURDAY',
        SUNDAY: 'SUNDAY',
        MONDAY: 'MONDAY',
        TUESDAY: 'TUESDAY',
        WEDNESDAY: 'WEDNESDAY',
        THURSDAY: 'THURSDAY',
      };
      return dayMap[weekday] || 'SATURDAY';
    } catch {
      return 'SATURDAY';
    }
  });

  // 3. Modal Dialog Controls
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isComparePickerOpen, setIsComparePickerOpen] = useState(false);
  const [isRoomFinderOpen, setIsRoomFinderOpen] = useState(false);
  const [roomFinderInitialRoom, setRoomFinderInitialRoom] = useState<string | null>(null);
  const [isFacultyInfoOpen, setIsFacultyInfoOpen] = useState(false);
  const [facultyInfoCode, setFacultyInfoCode] = useState<string | null>(null);
  const [facultyInfoReturnSection, setFacultyInfoReturnSection] = useState<string | null>(null);
  const [facultyInfoInitial, setFacultyInfoInitial] = useState<FacultyMeta | null>(null);
  const [isSectionInfoOpen, setIsSectionInfoOpen] = useState(false);
  const [sectionInfoTargetId, setSectionInfoTargetId] = useState<string | null>(null);

  const handleOpenRoomFinder = (room?: string) => {
    setRoomFinderInitialRoom(room || null);
    setIsRoomFinderOpen(true);
  };

  const handleOpenFacultyInfo = (code: string, returnSection?: string, initial?: FacultyMeta) => {
    setFacultyInfoCode(code);
    setFacultyInfoReturnSection(returnSection || null);
    setFacultyInfoInitial(initial || getFacultyByCode(code) || null);
    setIsFacultyInfoOpen(true);
  };

  const handleOpenSectionInfo = (sectionId: string) => {
    setSectionInfoTargetId(sectionId);
    setIsSectionInfoOpen(true);
  };

  // 4. Routine Data State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [liveSchedule, setLiveSchedule] = useState<RoutineClass[] | null>(null);
  const [routineVersion, setRoutineVersion] = useState<string>('v2.2');
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // 5. Routine Compare State
  const [compareSettings, setCompareSettings] = useState<{
    active: boolean;
    secondaryTarget: ActiveRoutineTarget | null;
    priority: 'primary' | 'secondary';
    secondaryVisibility: 'block' | 'hidden';
    showFreeTimeHighlight: boolean;
  }>({
    active: false,
    secondaryTarget: null,
    priority: 'secondary', // latest added routine has highest priority to show most info
    secondaryVisibility: 'block',
    showFreeTimeHighlight: true,
  });

  const [secondaryLiveSchedule, setSecondaryLiveSchedule] = useState<RoutineClass[] | null>(null);

  // Derive full CompareState with guaranteed alignment to activeTarget
  const compareState: CompareState = useMemo(
    () => ({
      ...compareSettings,
      primaryTarget: activeTarget,
    }),
    [compareSettings, activeTarget]
  );

  // Read saved target and optional compare target from localStorage or URL on mount
  useEffect(() => {
    try {
      let teacherToUse: string | null = null;
      let secToUse: string | null = null;
      let subToUse: string | null = null;
      let compareParamToUse: string | null = null;

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        teacherToUse = params.get('teacher') || params.get('t');
        secToUse = params.get('section') || params.get('s');
        subToUse = params.get('sub');
        compareParamToUse = params.get('compare') || params.get('c');
        const v = params.get('view') || params.get('v');
        if (v === 'agenda' || v === 'matrix') {
          setViewMode(v);
          setHasExplicitViewMode(true);
        } else {
          // Default to agenda on mobile screens (< 768px), matrix (week view) on desktop
          const isMobile = window.innerWidth < 768;
          setViewMode(isMobile ? 'agenda' : 'matrix');
        }
      }

      let resolvedTarget: ActiveRoutineTarget | null = null;

      // 1. If explicit teacher in URL, prioritize
      if (teacherToUse) {
        const found = getFacultyByCode(teacherToUse);
        if (found) {
          resolvedTarget = { type: 'faculty', faculty: found };
        }
      }

      // 2. If explicit section in URL, prioritize
      if (!resolvedTarget) {
        const savedSub = (subToUse || localStorage.getItem('diu_routine_selected_subsection')) as
          | '1'
          | '2'
          | 'all'
          | null;
        const validSub: '1' | '2' | 'all' =
          savedSub === '1' || savedSub === '2' || savedSub === 'all' ? savedSub : 'all';

        if (secToUse) {
          const found = getSectionById(secToUse);
          if (found) {
            resolvedTarget = { type: 'section', section: found, subSection: validSub };
          }
        }

        // 3. Fallback to localStorage preferences
        if (!resolvedTarget) {
          const savedType = localStorage.getItem('diu_routine_selected_type');
          if (savedType === 'faculty') {
            const savedFaculty = localStorage.getItem('diu_routine_selected_faculty');
            if (savedFaculty) {
              const found = getFacultyByCode(savedFaculty);
              if (found) {
                resolvedTarget = { type: 'faculty', faculty: found };
              }
            }
          }
        }

        if (!resolvedTarget) {
          const localSec = localStorage.getItem('diu_routine_selected_section');
          if (localSec) {
            const found = getSectionById(localSec);
            if (found) {
              resolvedTarget = { type: 'section', section: found, subSection: validSub };
            }
          }
        }
      }

      if (resolvedTarget) {
        setActiveTarget(resolvedTarget);
        setHasSavedPreference(true);
      } else {
        setHasSavedPreference(false);
        // Automatically open the standard Select Routine modal directly for new visitors
        setIsSectionPickerOpen(true);
      }

      // Check if compare target was passed in URL
      if (compareParamToUse) {
        const parsedCompare = parseTargetParam(compareParamToUse);
        if (parsedCompare) {
          setCompareSettings((prev) => ({
            ...prev,
            active: true,
            secondaryTarget: parsedCompare,
            priority: 'secondary',
            secondaryVisibility: 'block',
            showFreeTimeHighlight: true,
          }));
          setViewMode('matrix');
          setHasExplicitViewMode(true);
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Responsively adapt viewMode on width resize if user hasn't explicitly toggled it and not in compare mode
  useEffect(() => {
    if (hasExplicitViewMode || compareSettings.active) return;

    let prevWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // On mobile browsers, scrolling down/up triggers 'resize' when the top address bar hides/shows.
      // We only care about horizontal width changes (device rotation or desktop window resizing).
      if (Math.abs(currentWidth - prevWidth) < 20) return;

      const wasMobile = prevWidth < 768;
      const isMobile = currentWidth < 768;
      prevWidth = currentWidth;

      if (wasMobile !== isMobile) {
        setViewMode(isMobile ? 'agenda' : 'matrix');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasExplicitViewMode, compareSettings.active]);

  // Wrapper for user-initiated view mode changes
  const handleUserViewModeChange = (mode: 'matrix' | 'agenda') => {
    setHasExplicitViewMode(true);
    setViewMode(mode);
  };

  // Save selected section to state, localStorage & URL
  const handleSelectSection = (newSec: SectionMeta, subSection?: '1' | '2' | 'all') => {
    const finalSub = subSection || 'all';
    setActiveTarget({ type: 'section', section: newSec, subSection: finalSub });
    setLiveSchedule(null);
    setHasSavedPreference(true);
    try {
      localStorage.setItem('diu_routine_selected_type', 'section');
      localStorage.setItem('diu_routine_selected_section', newSec.id);
      localStorage.setItem('diu_routine_selected_subsection', finalSub);
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('teacher');
        newUrl.searchParams.delete('t');
        if (finalSub !== 'all') {
          newUrl.searchParams.set('sub', finalSub);
        } else {
          newUrl.searchParams.delete('sub');
        }
        newUrl.searchParams.set('section', newSec.id);
        if (compareState.active && compareState.secondaryTarget) {
          newUrl.searchParams.set('compare', targetToParamString(compareState.secondaryTarget));
        }
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (e) {
      console.warn('LocalStorage / URL write error:', e);
    }
  };

  // Save selected subsection to state, localStorage & URL
  const handleSelectSubSection = (newSub: '1' | '2' | 'all') => {
    setActiveTarget((prev) => {
      if (prev && prev.type === 'section') {
        return { type: 'section', section: prev.section, subSection: newSub };
      }
      return prev;
    });
    setHasSavedPreference(true);
    try {
      localStorage.setItem('diu_routine_selected_subsection', newSub);
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        if (newSub !== 'all') {
          newUrl.searchParams.set('sub', newSub);
        } else {
          newUrl.searchParams.delete('sub');
        }
        if (compareState.active && compareState.secondaryTarget) {
          newUrl.searchParams.set('compare', targetToParamString(compareState.secondaryTarget));
        }
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  };

  // Save selected faculty to state, localStorage & URL
  const handleSelectFaculty = (newFaculty: FacultyMeta) => {
    setActiveTarget({ type: 'faculty', faculty: newFaculty });
    setLiveSchedule(null);
    setHasSavedPreference(true);
    try {
      localStorage.setItem('diu_routine_selected_type', 'faculty');
      localStorage.setItem('diu_routine_selected_faculty', newFaculty.code);
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('section');
        newUrl.searchParams.delete('s');
        newUrl.searchParams.delete('sub');
        newUrl.searchParams.set('teacher', newFaculty.code);
        if (compareState.active && compareState.secondaryTarget) {
          newUrl.searchParams.set('compare', targetToParamString(compareState.secondaryTarget));
        }
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (e) {
      console.warn('LocalStorage / URL write error:', e);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsComparePickerOpen(false);
        setIsSectionPickerOpen(true);
      } else if (e.key === '+' || e.key === '=') {
        if (!isSectionPickerOpen) {
          e.preventDefault();
          setIsComparePickerOpen(true);
          setIsSectionPickerOpen(true);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!isSectionPickerOpen) {
          e.preventDefault();
          setIsSyncModalOpen((prev) => !prev);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (!isSectionPickerOpen) {
          e.preventDefault();
          setRoomFinderInitialRoom(null);
          setIsRoomFinderOpen((prev) => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setViewMode((prev) => (prev === 'agenda' ? 'matrix' : 'agenda'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSectionPickerOpen]);

  // Cache helpers for offline support
  const getCacheKey = useCallback((target: ActiveRoutineTarget) => {
    if (target.type === 'faculty') {
      return `diu_cached_routine_t_${target.faculty.code.toUpperCase()}`;
    }
    return `diu_cached_routine_s_${target.section.id}_sub_${target.subSection}`;
  }, []);

  // Fetch live schedule whenever activeTarget changes
  useEffect(() => {
    if (!isInitialized || !hasSavedPreference || !activeTarget) {
      return;
    }

    let isCancelled = false;
    const currentTarget = activeTarget;
    const cacheKey = getCacheKey(currentTarget);

    // 1. Try reading real cached schedule from localStorage
    let cachedData: { classes: RoutineClass[]; version?: string } | null = null;
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.classes) && parsed.classes.length > 0) {
            cachedData = parsed;
          }
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }

    if (cachedData) {
      setLiveSchedule(cachedData.classes);
      if (cachedData.version) setRoutineVersion(cachedData.version);
      setIsOfflineCached(false);
      setFetchError(false);
      setIsScheduleLoading(false);
    } else {
      setLiveSchedule(null);
      setIsScheduleLoading(true);
      setFetchError(false);
      setIsOfflineCached(false);
    }

    const endpoint =
      currentTarget.type === 'faculty'
        ? `/api/schedule?teacher=${encodeURIComponent(currentTarget.faculty.code)}`
        : `/api/schedule?section=${currentTarget.section.id}&sub=${currentTarget.subSection}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isCancelled && data.success) {
          if (Array.isArray(data.classes)) {
            setLiveSchedule(data.classes);
            setIsOfflineCached(false);
            setFetchError(false);
            // Save valid real schedule to localStorage cache
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ classes: data.classes, version: data.version || 'v2.2' })
                );
              }
            } catch {
              // Ignore storage quota errors
            }
          }
          if (data.version) {
            setRoutineVersion(data.version);
          }
          if (data.faculty && currentTarget.type === 'faculty') {
            setActiveTarget((prev) =>
              prev && prev.type === 'faculty' ? { ...prev, faculty: { ...prev.faculty, ...data.faculty } } : prev
            );
          }
        } else if (!isCancelled && !data.success) {
          throw new Error(data.error || 'Failed to fetch schedule');
        }
      })
      .catch((err) => {
        console.warn('Live routine fetch failed:', err);
        if (!isCancelled) {
          if (cachedData) {
            // We have real cached data, mark as viewing offline cached version
            setIsOfflineCached(true);
            setFetchError(false);
          } else {
            // No cache available and network failed
            setFetchError(true);
          }
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsScheduleLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTarget, isInitialized, hasSavedPreference, reloadTrigger, getCacheKey]);

  // Fetch secondary live schedule whenever compare target changes
  const secondaryTargetKey =
    compareState.active && compareState.secondaryTarget
      ? targetToParamString(compareState.secondaryTarget)
      : null;

  useEffect(() => {
    if (!secondaryTargetKey || !compareState.secondaryTarget) {
      return;
    }

    let isCancelled = false;
    const target = compareState.secondaryTarget;
    const secondaryCacheKey = getCacheKey(target);

    // Check cached secondary schedule
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(secondaryCacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.classes)) {
            setSecondaryLiveSchedule(parsed.classes);
          }
        }
      }
    } catch {
      // Ignore
    }

    const endpoint =
      target.type === 'faculty'
        ? `/api/schedule?teacher=${encodeURIComponent(target.faculty.code)}`
        : `/api/schedule?section=${target.section.id}&sub=${target.subSection}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.classes)) {
          setSecondaryLiveSchedule(data.classes);
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                secondaryCacheKey,
                JSON.stringify({ classes: data.classes, version: data.version || 'v2.2' })
              );
            }
          } catch {
            // Ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Secondary routine fetch fallback:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [secondaryTargetKey, compareState.secondaryTarget, getCacheKey]);

  // Current real schedule (never synthetic mock data)
  const currentSchedule = useMemo(() => {
    if (!hasSavedPreference || !activeTarget) {
      return [];
    }
    return liveSchedule || [];
  }, [hasSavedPreference, activeTarget, liveSchedule]);

  // Secondary real schedule (never synthetic mock data)
  const secondarySchedule = useMemo(() => {
    if (!compareState.active || !compareState.secondaryTarget) return [];
    return secondaryLiveSchedule || [];
  }, [compareState.active, compareState.secondaryTarget, secondaryLiveSchedule]);

  // Compute shared free slots between primary and secondary schedules
  const sharedFreeSlotsMap = useMemo(() => {
    if (!compareState.active || !compareState.secondaryTarget) {
      const empty: Record<DayOfWeek, FreeTimeSlot[]> = {
        SATURDAY: [],
        SUNDAY: [],
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
      };
      return empty;
    }
    return calculateSharedFreeTime(currentSchedule, secondarySchedule, 30);
  }, [compareState.active, compareState.secondaryTarget, currentSchedule, secondarySchedule]);

  const { sharedFreeHours, totalFreeSlots } = useMemo(() => {
    if (!compareState.active) return { sharedFreeHours: '0h', totalFreeSlots: 0 };
    const stats = getTotalSharedFreeHours(sharedFreeSlotsMap);
    return {
      sharedFreeHours: stats.formattedHours,
      totalFreeSlots: stats.slotCount,
    };
  }, [compareState.active, sharedFreeSlotsMap]);

  // Add target to compare
  const handleSelectCompareTarget = (target: ActiveRoutineTarget) => {
    setCompareSettings({
      active: true,
      secondaryTarget: target,
      priority: 'secondary', // newly added routine has highest priority to show most info
      secondaryVisibility: 'block',
      showFreeTimeHighlight: true,
    });
    setHasExplicitViewMode(true);
    setViewMode('matrix'); // Compare mode is only for week view
    setSecondaryLiveSchedule(null);
    setIsComparePickerOpen(false);
    setIsSectionPickerOpen(false);
    try {
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('compare', targetToParamString(target));
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (e) {
      console.warn('URL write error:', e);
    }
  };

  // Remove comparison routine
  const handleRemoveCompare = () => {
    setCompareSettings((prev) => ({
      ...prev,
      active: false,
      secondaryTarget: null,
    }));
    setSecondaryLiveSchedule(null);
    try {
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('compare');
        newUrl.searchParams.delete('c');
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (e) {
      console.warn('URL remove error:', e);
    }
  };

  // Swap priority routine
  const handleSwapPriority = () => {
    setCompareSettings((prev) => ({
      ...prev,
      priority: prev.priority === 'secondary' ? 'primary' : 'secondary',
    }));
  };

  // Toggle secondary routine visibility (block mode vs completely hidden)
  const handleToggleSecondaryVisibility = () => {
    setCompareSettings((prev) => ({
      ...prev,
      secondaryVisibility: prev.secondaryVisibility === 'block' ? 'hidden' : 'block',
    }));
  };

  // Toggle free time highlight on the timetable
  const handleToggleFreeTimeHighlight = () => {
    setCompareSettings((prev) => ({
      ...prev,
      showFreeTimeHighlight: !prev.showFreeTimeHighlight,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d1a] dark:text-slate-100 antialiased pb-28 sm:pb-8 print:pb-0 relative transition-colors duration-150">
      {/* Background Ambience */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.06),rgba(14,165,233,0.03),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.08),rgba(14,165,233,0.04),transparent_70%)] print:hidden"
        aria-hidden="true"
      />

      {/* Top HUD Navbar */}
      <Navbar
        selectedSection={selectedSection}
        selectedSubSection={selectedSubSection}
        activeTarget={activeTarget}
        compareState={compareState}
        hasSavedPreference={hasSavedPreference}
        onOpenSectionPicker={() => {
          setIsComparePickerOpen(false);
          setIsSectionPickerOpen(true);
        }}
        onOpenComparePicker={() => {
          setIsComparePickerOpen(true);
          setIsSectionPickerOpen(true);
        }}
        onRemoveCompare={handleRemoveCompare}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenRoomFinder={() => handleOpenRoomFinder()}
      />

      {/* Official Academic Print Header */}
      <div className="hidden print:block mx-auto max-w-7xl px-4 pt-4 mb-3 border-b-2 border-slate-900 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Daffodil International University
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Department of Computer Science &amp; Engineering • Class Schedule
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-700">
            {activeTarget?.type === 'faculty' ? (
              <>
                <div><strong className="text-slate-900 font-bold">{activeTarget.faculty.name}</strong></div>
                <div>Department: {activeTarget.faculty.department}</div>
                <div>Semester: Fall 2026 • Timezone: Asia/Dhaka (UTC+6)</div>
              </>
            ) : selectedSection ? (
              <>
                <div>Section: <strong className="text-slate-900 font-bold">{selectedSection.id}</strong> ({selectedSection.batch})</div>
                <div>Subgroup: {selectedSubSection === 'all' ? 'All Classes' : `Sub ${selectedSection.sectionLetter}${selectedSubSection}`}</div>
                <div>Semester: Fall 2026 • Timezone: Asia/Dhaka (UTC+6)</div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <main id="main-content" className="mx-auto max-w-7xl px-2 sm:px-6 pt-2 sm:pt-4 space-y-3 sm:space-y-4 print:py-0 print:px-2">
        {/* Semantic H1 for crawler SEO matching exact high-volume queries */}
        <h1 className="sr-only">DIU Routine &amp; Routine Scraper – CSE Department</h1>

        {/* Routine Compare Bar HUD - Only shown in Week View */}
        {compareState.active && viewMode === 'matrix' && (
          <CompareBar
            compareState={compareState}
            onRemoveCompare={handleRemoveCompare}
            onSwapPriority={handleSwapPriority}
            onToggleSecondaryVisibility={handleToggleSecondaryVisibility}
            onToggleFreeTimeHighlight={handleToggleFreeTimeHighlight}
            sharedFreeHours={sharedFreeHours}
            totalFreeSlots={totalFreeSlots}
          />
        )}

        {/* Offline cached notification banner */}
        {isOfflineCached && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                You are currently offline. Showing saved routine for{' '}
                <strong className="font-semibold">
                  {activeTarget?.type === 'faculty' ? activeTarget.faculty.name : activeTarget?.section.id}
                </strong>
                .
              </span>
            </div>
            <button
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Fetch failure when no cached routine is available */}
        {fetchError && currentSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs my-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <WifiOff className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
              Unable to Load Routine
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
              We couldn&apos;t reach the server and no previously cached routine was found for this selection. Check your internet connection and try again.
            </p>
            <button
              onClick={() => {
                setFetchError(false);
                setIsScheduleLoading(true);
                setReloadTrigger((prev) => prev + 1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : !isInitialized || !hasSavedPreference || (isScheduleLoading && currentSchedule.length === 0) ? (
          <TimetableSkeleton viewMode={viewMode} />
        ) : (
          <TimetableGrid
            section={selectedSection}
            subSection={selectedSubSection}
            activeTarget={activeTarget}
            classes={currentSchedule}
            compareState={compareState}
            secondaryClasses={secondarySchedule}
            sharedFreeSlotsMap={sharedFreeSlotsMap}
            viewMode={viewMode}
            onViewModeChange={handleUserViewModeChange}
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            routineVersion={routineVersion}
            onOpenFacultyInfo={handleOpenFacultyInfo}
            onOpenSectionInfo={handleOpenSectionInfo}
          />
        )}
      </main>

      {/* Persistent Mobile Bottom Bar */}
      <StickySyncBar
        section={selectedSection}
        subSection={selectedSubSection}
        activeTarget={activeTarget}
        compareState={compareState}
        hasSavedPreference={hasSavedPreference}
        onOpenSectionPicker={() => {
          setIsComparePickerOpen(false);
          setIsSectionPickerOpen(true);
        }}
        onOpenComparePicker={() => {
          setIsComparePickerOpen(true);
          setIsSectionPickerOpen(false);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenRoomFinder={() => handleOpenRoomFinder()}
      />

      {/* Unified Search Modal for Sections and Teachers */}
      <SectionSelector
        sections={ALL_SECTIONS}
        selectedSection={selectedSection}
        selectedSubSection={selectedSubSection}
        activeTarget={activeTarget}
        onSelectSection={handleSelectSection}
        onSelectSubSection={handleSelectSubSection}
        onSelectFaculty={handleSelectFaculty}
        isCompareMode={isComparePickerOpen}
        onToggleCompareMode={(enabled) => setIsComparePickerOpen(enabled)}
        onSelectCompareTarget={handleSelectCompareTarget}
        onOpenRoomFinder={handleOpenRoomFinder}
        isOpen={isSectionPickerOpen || isComparePickerOpen}
        onClose={() => {
          setIsSectionPickerOpen(false);
          setIsComparePickerOpen(false);
        }}
      />

      {/* Room Finder Modal */}
      <RoomFinderModal
        isOpen={isRoomFinderOpen}
        initialRoom={roomFinderInitialRoom}
        onClose={() => {
          setIsRoomFinderOpen(false);
          setRoomFinderInitialRoom(null);
        }}
        onNavigateToSection={(sectionId) => {
          const sec = getSectionById(sectionId);
          if (sec) {
            handleSelectSection(sec);
          }
        }}
        onNavigateToFaculty={(facultyCode) => {
          const fac = getFacultyByCode(facultyCode);
          if (fac) {
            handleSelectFaculty(fac);
          } else {
            handleSelectFaculty({
              code: facultyCode,
              name: facultyCode,
              department: 'CSE',
            });
          }
        }}
      />

      {/* Calendar Subscription Sheet */}
      <SubscriptionActions
        section={selectedSection}
        subSection={selectedSubSection}
        activeTarget={activeTarget}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Faculty Profile Modal */}
      <FacultyInfoModal
        isOpen={isFacultyInfoOpen}
        facultyCode={facultyInfoCode}
        initialFaculty={
          facultyInfoInitial ||
          (activeTarget?.type === 'faculty' && activeTarget.faculty.code === facultyInfoCode
            ? activeTarget.faculty
            : null)
        }
        onClose={() => {
          setIsFacultyInfoOpen(false);
          setFacultyInfoCode(null);
          setFacultyInfoReturnSection(null);
          setFacultyInfoInitial(null);
        }}
        returnSectionId={facultyInfoReturnSection}
        onBackToSection={(secId) => {
          setIsFacultyInfoOpen(false);
          setFacultyInfoReturnSection(null);
          handleOpenSectionInfo(secId);
        }}
        onCompareWithFaculty={(fac) => {
          handleSelectCompareTarget({ type: 'faculty', faculty: fac });
        }}
        onOpenComparePicker={() => {
          setIsFacultyInfoOpen(false);
          setIsComparePickerOpen(true);
          setIsSectionPickerOpen(true);
        }}
        onNavigateToFaculty={(fac) => {
          handleSelectFaculty(fac);
        }}
      />

      {/* Section Info Modal */}
      <SectionInfoModal
        isOpen={isSectionInfoOpen}
        sectionId={sectionInfoTargetId}
        initialClasses={
          activeTarget?.type === 'section' && activeTarget.section.id === sectionInfoTargetId
            ? currentSchedule
            : null
        }
        onClose={() => {
          setIsSectionInfoOpen(false);
          setSectionInfoTargetId(null);
        }}
        onCompareWithSection={(sec) => {
          handleSelectCompareTarget({ type: 'section', section: sec, subSection: 'all' });
        }}
        onOpenComparePicker={() => {
          setIsSectionInfoOpen(false);
          setIsComparePickerOpen(true);
          setIsSectionPickerOpen(true);
        }}
        onNavigateToSection={(sec) => {
          handleSelectSection(sec);
        }}
        onOpenFacultyInfo={(code, initial) => {
          handleOpenFacultyInfo(code, sectionInfoTargetId || undefined, initial);
        }}
      />

      {/* App Footer */}
      <footer className="mt-8 border-t border-slate-200/80 bg-slate-100/50 py-6 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400 print:hidden">
        <div className="mx-auto max-w-2xl px-4 space-y-3">
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition-colors">
              Docs &amp; Calendar Setup
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsComparePickerOpen(false);
                setIsSectionPickerOpen(true);
              }}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 underline transition-colors cursor-pointer"
            >
              Change Routine (/)
            </button>
          </div>

          {/* Developer Attribution Tag */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Developed by</span>
            <a
              href="https://github.com/6ayzid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-800 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>@6ayzid</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <a
              href="https://linkedin.com/in/6ayzid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <a
              href="https://t.me/bayzidx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
