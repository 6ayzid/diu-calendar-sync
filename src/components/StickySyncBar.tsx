'use client';

import React from 'react';
import { Calendar, ChevronUp, DoorOpen, Search, Plus } from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget, CompareState } from '@/types/schedule';

interface StickySyncBarProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget;
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
      className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-lg print:hidden sm:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 px-3 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
        {/* Left: Active Section / Faculty Trigger */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={
            !hasSavedPreference
              ? 'Select section or teacher'
              : isFaculty && faculty
              ? `Change routine target, currently Faculty ${faculty.name} (${faculty.code})`
              : `Change academic section, currently ${section.displayName}`
          }
          className="flex items-center gap-1.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer text-left min-h-[38px] min-w-0 flex-1"
        >
          {!hasSavedPreference ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Search className="h-3.5 w-3.5" />
              <span>Select Section</span>
            </div>
          ) : isFaculty && faculty ? (
            <div className="flex items-center gap-1 font-mono truncate">
              <span className="rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-600/50 dark:text-emerald-300">
                {faculty.code}
              </span>
              <span className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                Faculty
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-mono truncate">
              <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                {section.id}
              </span>
              {subSection !== 'all' && (
                <span className="rounded bg-emerald-100 border border-emerald-300 px-1 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300">
                  Lab {subSection}
                </span>
              )}
            </div>
          )}
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Right: Rooms, Compare & Sync Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Room Finder */}
          {onOpenRoomFinder && (
            <button
              type="button"
              onClick={onOpenRoomFinder}
              aria-label="Find empty rooms"
              className="flex items-center justify-center h-[38px] w-[38px] rounded-xl border border-slate-200 bg-slate-100/80 text-slate-600 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors cursor-pointer"
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
              className={`relative flex items-center justify-center h-[38px] w-[38px] rounded-xl border transition-colors cursor-pointer ${
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
            className="flex items-center gap-1.5 h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 transition-colors cursor-pointer shadow-sm border border-emerald-500/30"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
