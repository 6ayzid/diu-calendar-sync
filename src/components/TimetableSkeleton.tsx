'use client';

import React from 'react';

interface TimetableSkeletonProps {
  viewMode?: 'matrix' | 'agenda';
}

export function TimetableSkeleton({ viewMode = 'matrix' }: TimetableSkeletonProps) {
  return (
    <div className="w-full space-y-3 sm:space-y-4 animate-pulse select-none" aria-busy="true" aria-label="Loading timetable schedule">
      {/* Skeleton Top Header Bar */}
      <div className="flex items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2">
          {/* Date title placeholder */}
          <div className="h-6 w-36 sm:w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          {/* Version badge placeholder */}
          <div className="h-5 w-10 rounded-md bg-slate-200/80 dark:bg-slate-800/80" />
          {/* Target subtitle placeholder */}
          <div className="h-5 w-24 sm:w-36 rounded-md bg-slate-200/60 dark:bg-slate-800/60 hidden sm:block" />
        </div>

        {/* View mode toggle pill skeleton */}
        <div className="h-8 w-32 rounded-xl bg-slate-200/80 dark:bg-slate-800/80" />
      </div>

      {/* Week Matrix Skeleton (Desktop / Tablet view) */}
      <div className={viewMode === 'matrix' ? 'block' : 'hidden'}>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080d1a] overflow-hidden p-2 sm:p-4 shadow-xs">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="h-6 rounded bg-slate-100 dark:bg-slate-800/40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-7 w-7 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            ))}
          </div>

          {/* Grid Slots Mock */}
          <div className="grid grid-cols-7 gap-2 pt-3 h-[420px]">
            {/* Time labels column */}
            <div className="flex flex-col justify-between py-2">
              {['08:30', '10:00', '11:30', '01:00', '02:30', '04:00'].map((time) => (
                <div key={time} className="h-3 w-8 rounded bg-slate-200/50 dark:bg-slate-800/50 text-[10px]" />
              ))}
            </div>

            {/* 6 Day columns with staggered class card placeholders */}
            {Array.from({ length: 6 }).map((_, colIdx) => (
              <div key={colIdx} className="relative flex flex-col gap-3 py-1">
                {colIdx % 2 === 0 ? (
                  <>
                    <div className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 p-2 space-y-1.5">
                      <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2.5 w-1/2 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                      <div className="h-2 w-2/3 rounded bg-slate-200/50 dark:bg-slate-700/50" />
                    </div>
                    <div className="h-32 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 p-2 space-y-1.5 mt-4">
                      <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2.5 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30 mt-6 p-2 space-y-1">
                      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2.5 w-1/2 rounded bg-slate-200/60 dark:bg-slate-700/60" />
                    </div>
                    <div className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 p-2 space-y-1.5 mt-2">
                      <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2.5 w-1/2 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda Skeleton (Mobile view) */}
      <div className={viewMode === 'agenda' ? 'block' : 'hidden'}>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, dayIdx) => (
            <div key={dayIdx} className="flex items-start gap-3 pt-1">
              {/* Left date pillar skeleton */}
              <div className="w-12 shrink-0 pt-0.5 flex flex-col items-center gap-1">
                <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Right event cards skeleton */}
              <div className="flex-1 min-w-0 space-y-2 pb-2">
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-16 rounded bg-slate-200/80 dark:bg-slate-700/80" />
                  </div>
                  <div className="h-3 w-40 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-2.5 w-20 rounded bg-slate-200/60 dark:bg-slate-700/60" />
                    <div className="h-2.5 w-16 rounded bg-slate-200/60 dark:bg-slate-700/60" />
                  </div>
                </div>

                {dayIdx % 2 === 0 && (
                  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-16 rounded bg-slate-200/80 dark:bg-slate-700/80" />
                    </div>
                    <div className="h-3 w-36 rounded bg-slate-200/70 dark:bg-slate-700/70" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
