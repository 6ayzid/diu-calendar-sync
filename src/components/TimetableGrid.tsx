'use client';

import React from 'react';
import { DayOfWeek, RoutineClass, SectionMeta } from '@/types/schedule';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

interface TimetableGridProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  classes: RoutineClass[];
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

export function TimetableGrid({ section, subSection, classes }: TimetableGridProps) {
  const totalClasses = classes.length;
  const theoryClasses = classes.filter((c) => c.type === 'Theory').length;
  const labClasses = classes.filter((c) => c.type === 'Lab').length;

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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-2xl">
      {/* Timetable Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Weekly Class Timetable Preview</span>
            <span className="text-xs font-normal text-slate-400">
              ({section.displayName})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Days on horizontal X-axis • Time periods on vertical Y-axis • 3-Hour lab sessions merged into single vertical slots.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
            <BookOpen className="h-3 w-3 text-blue-400" />
            <span>{theoryClasses} Theory</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
            <FlaskConical className="h-3 w-3 text-amber-400" />
            <span>{labClasses} Lab{labClasses !== 1 ? 's' : ''} (3h Slots)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-semibold text-indigo-300">
            <span>{totalClasses} Classes/Wk</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid: Time on Y-Axis, Days on X-Axis */}
      <div className="mt-4 overflow-x-auto pb-3 scrollbar-thin">
        <div
          className="grid gap-2 min-w-[1020px]"
          style={{
            gridTemplateColumns: '110px repeat(6, minmax(150px, 1fr))',
            gridTemplateRows: 'auto repeat(6, minmax(115px, auto))',
          }}
        >
          {/* ========================================================================= */}
          {/* HEADER ROW (Row 1): Time label in Col 1, Days in Cols 2 to 7 */}
          {/* ========================================================================= */}
          <div
            className="flex items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 text-center"
            style={{ gridColumn: 1, gridRow: 1 }}
          >
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Time \ Day
            </span>
          </div>

          {DAYS.map((d) => (
            <div
              key={d.key}
              className="flex flex-col items-center justify-center rounded-xl bg-slate-950/90 border border-slate-800/90 py-2.5 px-2 text-center shadow-sm"
              style={{ gridColumn: d.colIndex, gridRow: 1 }}
            >
              <span className="text-xs font-bold text-white tracking-wide">
                {d.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {d.short}
              </span>
            </div>
          ))}

          {/* ========================================================================= */}
          {/* TIME Y-AXIS LABELS (Col 1, Rows 2 to 7) */}
          {/* ========================================================================= */}
          {STANDARD_SLOTS.map((slot) => (
            <div
              key={`time-col-${slot.rowIndex}`}
              className="flex flex-col items-center justify-center rounded-xl bg-slate-950/70 border border-slate-800/70 p-2 text-center"
              style={{ gridColumn: 1, gridRow: slot.rowIndex }}
            >
              <span className="font-mono font-extrabold text-xs text-indigo-300">
                {slot.label}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                {slot.period}
              </span>
            </div>
          ))}

          {/* ========================================================================= */}
          {/* TIMETABLE CELLS (Cols 2 to 7, Rows 2 to 7) */}
          {/* ========================================================================= */}
          {DAYS.map((day) => {
            return STANDARD_SLOTS.map((slot, sIdx) => {
              // If covered by a 3-hour lab from prior slot, skip rendering (row-span occupies it)
              if (isSlotCoveredByPriorClass(day.key, sIdx)) {
                return null;
              }

              // Check if a class starts in this slot
              const classItem = classes.find(
                (c) => c.dayOfWeek === day.key && c.startTime === slot.start
              );

              // Empty Slot Placeholder
              if (!classItem) {
                return (
                  <div
                    key={`empty-${day.key}-${slot.rowIndex}`}
                    className="flex items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/20 p-2 text-center text-slate-700 hover:bg-slate-900/30 transition-colors"
                    style={{ gridColumn: day.colIndex, gridRow: slot.rowIndex }}
                  >
                    <span className="font-mono text-xs text-slate-700">—</span>
                  </div>
                );
              }

              // Class Exists: Calculate duration
              const [startH, startM] = classItem.startTime.split(':').map(Number);
              const [endH, endM] = classItem.endTime.split(':').map(Number);
              const durationMinutes = endH * 60 + endM - (startH * 60 + startM);

              // 3-hour lab sessions span 2 vertical periods as ONE single big slot
              const isDoubleSlot = durationMinutes >= 150;
              const rowSpan = isDoubleSlot ? 2 : 1;

              const isLab = classItem.type === 'Lab';
              const isSub1 = classItem.subSection === '1';
              const isSub2 = classItem.subSection === '2';

              // Clean Course Code (e.g., "CSE224" even if upstream passed "CSE224(68_D1)")
              const cleanCourseCode = classItem.courseCode.split('(')[0].trim();

              return (
                <div
                  key={`class-${day.key}-${classItem.id}`}
                  className={`group relative flex flex-col justify-between rounded-xl p-3 transition-all shadow-md border overflow-hidden ${
                    isDoubleSlot ? 'ring-1 z-10' : 'z-0'
                  } ${
                    isLab
                      ? isSub1
                        ? 'bg-gradient-to-br from-amber-950/50 via-amber-900/20 to-slate-950 border-amber-500/50 text-amber-100 ring-amber-500/30 hover:border-amber-400'
                        : 'bg-gradient-to-br from-rose-950/50 via-rose-900/20 to-slate-950 border-rose-500/50 text-rose-100 ring-rose-500/30 hover:border-rose-400'
                      : 'bg-gradient-to-br from-indigo-950/40 via-indigo-900/20 to-slate-950 border-indigo-500/40 text-indigo-100 hover:border-indigo-400'
                  }`}
                  style={{
                    gridColumn: day.colIndex,
                    gridRow: `${slot.rowIndex} / span ${rowSpan}`,
                  }}
                >
                  {/* Top Section: Course Code, Badges, Title */}
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isLab && (
                          <FlaskConical className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white truncate">
                          {cleanCourseCode}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isDoubleSlot && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/25 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 whitespace-nowrap shadow-sm">
                            <Sparkles className="h-2.5 w-2.5 shrink-0" /> 3h Lab
                          </span>
                        )}
                        {classItem.subSection ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-sm ${
                              isSub1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {section.sectionLetter}{classItem.subSection}
                          </span>
                        ) : (
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                            Theory
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="text-[11px] text-slate-200 line-clamp-2 font-medium mt-1 leading-snug break-words"
                      title={classItem.courseTitle}
                    >
                      {classItem.courseTitle}
                    </div>
                  </div>

                  {/* Bottom Section: Room, Teacher & Time Details (Non-overflowing layout) */}
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="flex items-center gap-1 font-semibold text-slate-200 min-w-0"
                        title={classItem.room}
                      >
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {classItem.room.split('(')[0].trim()}
                        </span>
                      </span>

                      <span className="rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-indigo-300 border border-slate-800 shrink-0">
                        {classItem.teacherCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span className="flex items-center gap-1 text-amber-300 font-bold whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                        <span>
                          {classItem.startTime} - {classItem.endTime}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Detailed Hover Popover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl text-xs text-white">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      {isLab && <FlaskConical className="h-3.5 w-3.5 text-amber-400" />}
                      <span>{classItem.courseCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{classItem.courseTitle}</div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400 border-t border-slate-800 pt-1.5">
                      <div><strong className="text-slate-300">Instructor:</strong> {classItem.teacherCode} {classItem.teacherName ? `(${classItem.teacherName})` : ''}</div>
                      <div><strong className="text-slate-300">Room / Lab:</strong> {classItem.room}</div>
                      <div><strong className="text-slate-300">Time:</strong> {classItem.startTime} - {classItem.endTime} {isDoubleSlot ? '(3-Hour Merged Slot)' : '(1.5 Hours)'}</div>
                      <div><strong className="text-slate-300">Target Group:</strong> {classItem.subSection ? `Subsection ${section.sectionLetter}${classItem.subSection}` : 'All Section Students'}</div>
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
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

        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
          <Clock className="h-3 w-3" /> Timezone: Asia/Dhaka (UTC+6)
        </div>
      </div>
    </div>
  );
}
