'use client';

import React from 'react';
import { Calendar, DoorOpen, Search, Plus } from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget, CompareState } from '@/types/schedule';

interface StickySyncBarProps {
  section?: SectionMeta | null;
  subSection?: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget | null;
  compareState?: CompareState;
  hasSavedPreference?: boolean;
  onOpenSectionPicker: () => void;
  onOpenComparePicker?: () => void;
  onOpenSyncModal: () => void;
  onOpenRoomFinder?: () => void;
}

export function StickySyncBar({
  section,
  subSection,
  activeTarget,
  compareState,
  hasSavedPreference = true,
  onOpenSectionPicker,
  onOpenComparePicker,
  onOpenSyncModal,
  onOpenRoomFinder,
}: StickySyncBarProps) {
  const isFaculty = activeTarget?.type === 'faculty';
  const faculty = isFaculty ? activeTarget.faculty : null;
  const isComparing = Boolean(compareState?.active);

  return (
    <aside
      aria-label="Quick Section and Subscription Controller"
      className="fixed bottom-3 left-3 right-3 z-50 pointer-events-auto mx-auto max-w-lg print:hidden sm:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center justify-between gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 px-2.5 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
        {/* Left: Active Section / Faculty Trigger (Search Box Style) */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={
            !hasSavedPreference
              ? 'Search section or teacher initials to get started'
              : isFaculty && faculty
              ? `Search section or teacher, currently ${faculty.name} (${faculty.code})`
              : `Search section or teacher, currently ${section?.id || 'section'}`
          }
          className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-100/90 hover:bg-slate-200/80 hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-800 px-2.5 py-1.5 transition-all cursor-pointer text-left min-h-[44px] min-w-0 flex-1 group shadow-2xs touch-manipulation active:scale-[0.99]"
        >
          <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 transition-colors" />

          <div className="flex flex-col justify-center min-w-0 flex-1 leading-none">
            {!hasSavedPreference ? (
              <span className="text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400 font-sans truncate">
                Search section or initial to start...
              </span>
            ) : isFaculty && faculty ? (
              <>
                <div className="flex items-center gap-1 font-mono truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {faculty.code}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    • {faculty.name}
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-sans mt-0.5 truncate">
                  Search section or initial
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 font-mono truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {section?.id || '—'}
                  </span>
                  {subSection !== 'all' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      (Lab {subSection})
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-sans mt-0.5 truncate">
                  Search section or initial
                </span>
              </>
            )}
          </div>

          <span className="text-[10.5px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            Search
          </span>
        </button>

        {/* Right: Rooms, Compare & Sync Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Room Finder */}
          {onOpenRoomFinder && (
            <button
              type="button"
              onClick={onOpenRoomFinder}
              aria-label="Find empty rooms"
              className="flex items-center justify-center h-[42px] w-[40px] rounded-xl border border-slate-200 bg-slate-100/80 text-slate-600 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
              title="Find empty rooms"
            >
              <DoorOpen className="h-4 w-4" />
            </button>
          )}

          {/* Routine Compare Button */}
          {hasSavedPreference && onOpenComparePicker && (
            <button
              type="button"
              onClick={onOpenComparePicker}
              aria-label={isComparing ? 'Routine compare active' : 'Compare routine with another section or teacher'}
              title={isComparing ? 'Routine compare active (tap to change)' : 'Compare routines'}
              className={`relative flex items-center justify-center h-[42px] w-[40px] rounded-xl border transition-colors cursor-pointer touch-manipulation active:scale-[0.98] ${
                isComparing
                  ? 'border-emerald-400/80 bg-emerald-50 text-emerald-800 dark:border-emerald-600/70 dark:bg-emerald-950/70 dark:text-emerald-300 shadow-2xs'
                  : 'border-slate-200 bg-slate-100/80 text-slate-600 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
              }`}
            >
              <Plus className="h-4 w-4" />
              {isComparing && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              )}
            </button>
          )}

          {/* Primary 1-Tap Calendar Subscription Button */}
          <button
            type="button"
            onClick={hasSavedPreference ? onOpenSyncModal : onOpenSectionPicker}
            aria-label={hasSavedPreference ? 'Open Calendar Sync Modal' : 'Select section to sync calendar'}
            className="flex items-center gap-1 h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white transition-colors cursor-pointer shadow-sm border border-emerald-500/30 touch-manipulation active:scale-[0.98]"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
