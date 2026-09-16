'use client';

import React, { useState, useMemo, useRef } from 'react';
import { DayOfWeek, RoutineClass, SectionMeta } from '@/types/schedule';
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  FlaskConical,
  ArrowRight,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';
import { Badge } from '@/components/ui';

interface TimetableGridProps {
  section: SectionMeta;
  subSection?: '1' | '2' | 'all';
  classes: RoutineClass[];
  viewMode?: 'matrix' | 'agenda';
  onViewModeChange?: (mode: 'matrix' | 'agenda') => void;
  activeDay?: DayOfWeek;
  onActiveDayChange?: (day: DayOfWeek) => void;
}

const DAYS: { key: DayOfWeek; label: string; short: string; colIndex: number }[] = [
  { key: 'SATURDAY', label: 'Saturday', short: 'Sat', colIndex: 2 },
  { key: 'SUNDAY', label: 'Sunday', short: 'Sun', colIndex: 3 },
  { key: 'MONDAY', label: 'Monday', short: 'Mon', colIndex: 4 },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue', colIndex: 5 },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed', colIndex: 6 },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu', colIndex: 7 },
];

const STANDARD_SLOTS = [
  { start: '08:30', end: '10:00', label: '08:30 - 10:00', period: 'Period 1', rowIndex: 2 },
  { start: '10:00', end: '11:30', label: '10:00 - 11:30', period: 'Period 2', rowIndex: 3 },
  { start: '11:30', end: '13:00', label: '11:30 - 01:00', period: 'Period 3', rowIndex: 4 },
  { start: '13:00', end: '14:30', label: '01:00 - 02:30', period: 'Period 4', rowIndex: 5 },
  { start: '14:30', end: '16:00', label: '02:30 - 04:00', period: 'Period 5', rowIndex: 6 },
  { start: '16:00', end: '17:30', label: '04:00 - 05:30', period: 'Period 6', rowIndex: 7 },
];

export function TimetableGrid({
  section,
  classes,
  viewMode,
  onViewModeChange,
  activeDay,
  onActiveDayChange,
}: TimetableGridProps) {
  // Default to agenda for mobile-first companion
  const [internalViewMode, setInternalViewMode] = useState<'matrix' | 'agenda'>('agenda');
  const effectiveViewMode = viewMode !== undefined ? viewMode : internalViewMode;
  const setEffectiveViewMode = onViewModeChange || setInternalViewMode;

  // Determine current day in Bangladesh
  const todayDay = useMemo<DayOfWeek>(() => {
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
  }, []);

  const [internalActiveDay, setInternalActiveDay] = useState<DayOfWeek>(todayDay);
  const effectiveActiveDay = activeDay !== undefined ? activeDay : internalActiveDay;
  const setEffectiveActiveDay = onActiveDayChange || setInternalActiveDay;

  // Matrix view mobile scroll reference and selected day
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const [selectedMatrixDay, setSelectedMatrixDay] = useState<DayOfWeek>(todayDay);

  const scrollToDay = (dayKey: DayOfWeek) => {
    if (!matrixScrollRef.current) return;
    if (dayKey === 'SATURDAY') {
      matrixScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    const el = matrixScrollRef.current.querySelector<HTMLElement>(`#matrix-col-${dayKey}`);
    if (el) {
      const containerLeft = matrixScrollRef.current.getBoundingClientRect().left;
      const colLeft = el.getBoundingClientRect().left;
      const timeColWidth = window.innerWidth < 640 ? 62 : 112;
      matrixScrollRef.current.scrollBy({
        left: (colLeft - containerLeft) - timeColWidth,
        behavior: 'smooth',
      });
    }
  };

  const totalClasses = classes.length;
  const theoryClasses = classes.filter((c) => c.type === 'Theory').length;
  const labClasses = classes.filter((c) => c.type === 'Lab').length;

  const dayClasses = useMemo(() => {
    return classes
      .filter((c) => c.dayOfWeek === effectiveActiveDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [classes, effectiveActiveDay]);

  /**
   * Checks if a slot is already covered by a 3-hour class starting in the prior period.
   */
  const isSlotCoveredByPriorClass = (day: DayOfWeek, slotIdx: number): boolean => {
    if (slotIdx === 0) return false;
    const prevSlot = STANDARD_SLOTS[slotIdx - 1];
    const prevClass = classes.find(
      (c) => c.dayOfWeek === day && c.startTime === prevSlot.start
    );
    if (!prevClass) return false;

    const [startH, startM] = prevClass.startTime.split(':').map(Number);
    const [endH, endM] = prevClass.endTime.split(':').map(Number);
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
    return durationMinutes >= 150; // Spans 2 periods
  };

  return (
    <section
      aria-labelledby="timetable-heading"
      className="rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/40 transition-colors space-y-4 sm:space-y-5"
    >
      {/* Timetable Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 id="timetable-heading" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Class Timetable</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({section.displayName})
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-prose print:hidden">
            {effectiveViewMode === 'agenda'
              ? "Touch-friendly daily agenda with high-glance room numbers and instructor initials."
              : "Full semester schedule matrix across standard academic periods."}
          </p>
        </div>

        {/* View Toggle & Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs print:hidden">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setEffectiveViewMode('agenda')}
              aria-pressed={effectiveViewMode === 'agenda'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                effectiveViewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Today&apos;s Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => setEffectiveViewMode('matrix')}
              aria-pressed={effectiveViewMode === 'matrix'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                effectiveViewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Full Week Matrix</span>
            </button>
          </div>

          <Badge variant="slate" size="sm" className="hidden sm:inline-flex">
            <BookOpen className="h-3 w-3" />
            <span>{theoryClasses} Theory</span>
          </Badge>
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
            <FlaskConical className="h-3 w-3" />
            <span>{labClasses} Lab{labClasses !== 1 ? 's' : ''} (3h)</span>
          </Badge>
          <Badge variant="slate" size="sm" mono>
            <span>{totalClasses} Classes/Wk</span>
          </Badge>
        </div>
      </div>

      {/* 1. Daily Agenda View (Mobile-First) */}
      <div className={`space-y-4 print:hidden ${effectiveViewMode === 'agenda' ? 'block' : 'hidden'}`}>
        {/* Day Selector Tabs Slider */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin touch-pan-x overscroll-x-contain"
          role="tablist"
          aria-label="Select day of week"
        >
            {DAYS.map((d) => {
              const count = classes.filter((c) => c.dayOfWeek === d.key).length;
              const isActive = effectiveActiveDay === d.key;
              const isToday = d.key === todayDay;

              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setEffectiveActiveDay(d.key)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors min-h-[44px] cursor-pointer whitespace-nowrap border ${
                    isActive && isToday
                      ? 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 shadow-xs hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-500 dark:hover:bg-emerald-900/40'
                      : isActive
                      ? 'bg-white text-slate-900 border-2 border-slate-300 shadow-xs hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700/80'
                      : isToday
                      ? 'bg-emerald-50/60 text-emerald-900 border border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300 hover:text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-100 dark:hover:border-emerald-500/60'
                      : 'bg-slate-100/80 text-slate-600 border border-slate-200 hover:bg-slate-200/70 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-950/70 dark:text-slate-400 dark:border-slate-800/70 dark:hover:bg-slate-900 dark:hover:text-slate-100 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{d.label}</span>
                  {isToday && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Today</span>
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-mono text-xs transition-colors">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Agenda Cards */}
          {dayClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
              <p className="text-slate-800 dark:text-slate-300 font-medium">
                No classes scheduled for {DAYS.find((d) => d.key === effectiveActiveDay)?.label}.
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-500">Free study day or off-schedule period.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayClasses.map((classItem) => {
                const [startH, startM] = classItem.startTime.split(':').map(Number);
                const [endH, endM] = classItem.endTime.split(':').map(Number);
                const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
                const isDoubleSlot = durationMinutes >= 150;
                const isLab = classItem.type === 'Lab';
                const cleanCourseCode = classItem.courseCode.split('(')[0].trim();

                const isSub1 = classItem.subSection === '1';
                const isSub2 = classItem.subSection === '2';
                const cardStyle = isLab
                  ? 'border-2 border-amber-300 bg-amber-50/80 hover:border-amber-400 shadow-xs hover:shadow-md dark:border-amber-500/30 dark:bg-amber-950/15 dark:hover:border-amber-500/40'
                  : 'border-2 border-slate-200/90 bg-white hover:border-slate-300 shadow-xs hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-slate-700';

                return (
                  <div
                    key={`agenda-${classItem.id}`}
                    tabIndex={0}
                    role="region"
                    aria-label={`${cleanCourseCode}: ${classItem.courseTitle}, Room ${classItem.room.split('(')[0].trim()}, ${classItem.startTime} to ${classItem.endTime}`}
                    className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 ${cardStyle}`}
                  >
                    {/* Top Row: Course Code, Title & Refined Room */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {isLab && <FlaskConical className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                          <span className={`font-semibold text-sm sm:text-base font-mono tracking-tight ${
                            isLab ? 'text-amber-950 dark:text-amber-100' : 'text-slate-900 dark:text-white'
                          }`}>
                            {cleanCourseCode}
                          </span>
                          {isDoubleSlot && (
                            <span className="text-xs font-mono text-amber-900 dark:text-amber-300 font-semibold bg-amber-100 border border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/30 px-1.5 py-0.2 rounded">
                              3h Lab
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                          {classItem.courseTitle}
                        </h3>
                      </div>

                      {/* Quiet Room Tag */}
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-mono font-medium ${
                          isLab
                            ? 'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-500/30 dark:bg-slate-950 dark:text-amber-200'
                            : 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                        }`}>
                          <MapPin className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          <span>{classItem.room.split('(')[0].trim()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Time, Faculty & Subgroup */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <span>
                          {classItem.startTime} – {classItem.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
                        <span>
                          Faculty: <strong className="text-slate-800 dark:text-slate-200 font-medium">{classItem.teacherCode}</strong>
                        </span>
                        {classItem.subSection ? (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              isSub1
                                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                                : isSub2
                                ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800'
                            }`}
                          >
                            Sec {section.sectionLetter}{classItem.subSection}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            Theory
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Full Week Matrix Grid (Always visible when printing) */}
        <div className={effectiveViewMode === 'matrix' ? 'block' : 'hidden print:block'}>
          {/* Mobile Quick Day Jump Bar & Swipe Hint */}
          <div className="sm:hidden mt-2 mb-2 flex flex-col gap-1.5 print:hidden">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">
                Jump:
              </span>
              {DAYS.map((d) => {
                const isToday = d.key === todayDay;
                const isCurrentJump = selectedMatrixDay === d.key;
                return (
                  <button
                    key={`jump-${d.key}`}
                    type="button"
                    onClick={() => {
                      setSelectedMatrixDay(d.key);
                      scrollToDay(d.key);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 min-h-[32px] cursor-pointer border ${
                      isCurrentJump
                        ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 dark:hover:bg-white shadow-2xs'
                        : isToday
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-100 dark:hover:border-emerald-500'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-100 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{d.short}</span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="text-slate-500 dark:text-slate-400">
                Sticky time column
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                <span>Swipe Sat to Thu</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </span>
            </div>
          </div>

          {/* Timetable Grid: Time on Y-Axis, Days on X-Axis */}
          <div
            ref={matrixScrollRef}
            className="mt-2 sm:mt-4 overflow-x-auto pb-3 scrollbar-thin overscroll-x-contain touch-pan-x print:overflow-visible print:pb-0"
          >
            <div className="matrix-grid-layout gap-1.5 sm:gap-2 min-w-[686px] sm:min-w-[960px] print:min-w-0 print:gap-1.5">
              {/* HEADER ROW: Time label in Col 1, Days in Cols 2 to 7 */}
              <div
                className="sticky left-0 z-20 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1.5 sm:p-2.5 text-center shadow-xs"
                style={{ gridColumn: 1, gridRow: 1 }}
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Time \ Day</span>
                  <span className="sm:hidden">Time</span>
                </span>
              </div>

              {DAYS.map((d) => {
                const isToday = d.key === todayDay;
                return (
                  <div
                    key={d.key}
                    id={`matrix-col-${d.key}`}
                    className={`flex flex-col items-center justify-center rounded-lg sm:rounded-xl py-1.5 sm:py-2.5 px-1 sm:px-2 text-center transition-colors border ${
                      isToday
                        ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 shadow-2xs dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-white'
                        : 'bg-slate-100/80 border border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-white'
                    }`}
                    style={{ gridColumn: d.colIndex, gridRow: 1 }}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className={`text-xs font-bold tracking-wide ${isToday ? 'text-emerald-950 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                        <span className="sm:hidden">{d.short}</span>
                        <span className="hidden sm:inline">{d.label}</span>
                      </span>
                      {isToday && (
                        <span className="rounded bg-emerald-600 text-white px-1 sm:px-1.5 py-0.2 text-xs font-bold font-mono shadow-2xs">
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-mono mt-0.5 hidden sm:inline ${isToday ? 'text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {d.short}
                    </span>
                  </div>
                );
              })}

              {/* TIME Y-AXIS LABELS (Col 1, Rows 2 to 7) */}
              {STANDARD_SLOTS.map((slot) => (
                <div
                  key={`time-col-${slot.rowIndex}`}
                  className="sticky left-0 z-10 flex flex-col items-center justify-center rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 sm:p-2 text-center shadow-xs"
                  style={{ gridColumn: 1, gridRow: slot.rowIndex }}
                >
                  {/* Mobile Compact View */}
                  <div className="sm:hidden flex flex-col items-center">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {slot.start}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      {slot.end}
                    </span>
                    <span className="mt-0.5 rounded bg-slate-200/80 dark:bg-slate-800 px-1 py-0.2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      P{slot.rowIndex - 1}
                    </span>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:flex flex-col items-center">
                    <span className="font-mono font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {slot.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-mono">
                      {slot.period}
                    </span>
                  </div>
                </div>
              ))}

              {/* TIMETABLE CELLS (Cols 2 to 7, Rows 2 to 7) */}
              {DAYS.map((day) => {
                const isToday = day.key === todayDay;

                return STANDARD_SLOTS.map((slot, sIdx) => {
                  if (isSlotCoveredByPriorClass(day.key, sIdx)) {
                    return null;
                  }

                  const matchedClasses = classes.filter(
                    (c) => c.dayOfWeek === day.key && c.startTime === slot.start
                  );

                  if (matchedClasses.length === 0) {
                    return (
                      <div
                        key={`cell-${day.key}-${slot.start}`}
                        className={`rounded-lg sm:rounded-xl border border-dashed p-1.5 sm:p-2 flex items-center justify-center transition-colors ${
                          isToday
                            ? 'border-emerald-200 bg-emerald-50/20 text-emerald-600/40 dark:border-emerald-500/15 dark:bg-emerald-950/10 dark:text-emerald-500/30'
                            : 'border-slate-200 bg-slate-50/50 text-slate-300 dark:border-slate-800/50 dark:bg-slate-950/40 dark:text-slate-700'
                        }`}
                        style={{
                          gridColumn: day.colIndex,
                          gridRow: slot.rowIndex,
                        }}
                      >
                        <span className="text-xs font-mono select-none">
                          —
                        </span>
                      </div>
                    );
                  }

                  const firstClass = matchedClasses[0];
                  const [startH, startM] = firstClass.startTime.split(':').map(Number);
                  const [endH, endM] = firstClass.endTime.split(':').map(Number);
                  const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
                  const isDoubleSlot = durationMinutes >= 150;
                  const rowSpan = isDoubleSlot ? 2 : 1;
                  const isLab = matchedClasses.some((c) => c.type === 'Lab');

                  const cellBg = isLab
                    ? 'bg-amber-50/90 border-2 border-amber-300 hover:border-amber-400 shadow-xs hover:shadow-md dark:bg-amber-950/20 dark:border-amber-500/35 dark:hover:border-amber-500/60'
                    : isToday
                    ? 'bg-emerald-50/40 border-2 border-emerald-400/90 hover:border-emerald-500 shadow-xs hover:shadow-md dark:bg-slate-900/90 dark:border-emerald-500/50 dark:hover:border-emerald-400'
                    : 'bg-white border-2 border-slate-200/90 hover:border-slate-400 shadow-xs hover:shadow-md dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-slate-700';

                  return (
                    <div
                      key={`cell-${day.key}-${slot.start}`}
                      tabIndex={0}
                      role="region"
                      aria-label={`${matchedClasses.map(c => `${c.courseCode} in Room ${c.room}`).join(', ')} on ${day.label} at ${slot.label}`}
                      className={`group relative rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 transition-all flex flex-col justify-between focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 ${cellBg}`}
                      style={{
                        gridColumn: day.colIndex,
                        gridRow: `${slot.rowIndex} / span ${rowSpan}`,
                      }}
                    >
                      <div className="space-y-1 sm:space-y-1.5">
                        {matchedClasses.map((c) => {
                          const cleanCode = c.courseCode.split('(')[0].trim();
                          const isSub1 = c.subSection === '1';
                          const isSub2 = c.subSection === '2';

                          return (
                            <div key={c.id} className="text-xs">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  {c.type === 'Lab' && (
                                    <FlaskConical className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  )}
                                  <span className={`font-bold tracking-tight font-mono truncate ${
                                    c.type === 'Lab' ? 'text-amber-950 dark:text-amber-100' : 'text-slate-900 dark:text-white'
                                  }`}>
                                    {cleanCode}
                                  </span>
                                </div>
                                {c.subSection ? (
                                  <span
                                    className={`shrink-0 rounded px-1 sm:px-1.5 py-0.5 text-xs font-bold font-mono ${
                                      isSub1
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                                        : isSub2
                                        ? 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {section.sectionLetter}{c.subSection}
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-1 sm:px-1.5 py-0.5 text-xs font-mono font-semibold">
                                    Th
                                  </span>
                                )}
                              </div>
                              <div className={`hidden sm:block truncate text-xs mt-0.5 ${isLab ? 'text-amber-800/90 dark:text-amber-200/90' : 'text-slate-600 dark:text-slate-300'}`} title={c.courseTitle}>
                                {c.courseTitle}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className={`mt-1.5 sm:mt-2.5 pt-1 sm:pt-1.5 border-t flex items-center justify-between text-xs font-mono ${
                        isLab ? 'border-amber-200/80 dark:border-amber-500/20' : 'border-slate-100 dark:border-slate-800/80'
                      }`}>
                        <span className={`flex items-center gap-0.5 font-bold truncate ${
                          isLab ? 'text-amber-950 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          <MapPin className={`h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 ${isLab ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className="truncate">{firstClass.room.split('(')[0].trim()}</span>
                        </span>
                        <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-950 px-1 sm:px-1.5 py-0.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs">
                          {matchedClasses.map((c) => c.teacherCode).join('/')}
                        </span>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>

      {/* Footer Legend */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium print:text-slate-800 print:border-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
          <span>Shared Theory Class (1.5 Hours)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          <span>Subsection {section.sectionLetter}1 Lab (3-Hour Merged Slot)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
          <span>Subsection {section.sectionLetter}2 Lab (3-Hour Merged Slot)</span>
        </div>
      </div>
    </section>
  );
}
