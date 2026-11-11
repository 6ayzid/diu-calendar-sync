'use client';

import React from 'react';
import { Calendar, DoorOpen } from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget, CompareState } from '@/types/schedule';
import { RoutineSwitcher } from '@/components/RoutineSwitcher';

interface StickySyncBarProps {
  section?: SectionMeta | null;
  subSection?: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget | null;
  compareState?: CompareState;
  hasSavedPreference?: boolean;
  onOpenSectionPicker: () => void;
  onOpenComparePicker?: () => void;
  onSwapPriority?: () => void;
  onRemoveCompare?: () => void;
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
  onSwapPriority,
  onRemoveCompare,
  onOpenSyncModal,
  onOpenRoomFinder,
}: StickySyncBarProps) {
  const isComparing = Boolean(compareState?.active && compareState.secondaryTarget);

  return (
    <aside
      aria-label="Quick Section and Subscription Controller"
      className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-lg print:hidden sm:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 px-2 sm:px-2.5 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
        {/* Left: Merged Search & Compare Controller */}
        <div className="min-w-0 flex-1 flex items-center">
          <RoutineSwitcher
            primaryTarget={activeTarget || null}
            secondaryTarget={isComparing ? compareState?.secondaryTarget || null : null}
            isComparing={isComparing}
            onOpenPrimaryPicker={onOpenSectionPicker}
            onOpenComparePicker={onOpenComparePicker || onOpenSectionPicker}
            onSwap={onSwapPriority || (() => {})}
            onExitCompare={onRemoveCompare || (() => {})}
            variant="dock"
          />
        </div>

        {/* Right: Rooms & Sync Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Room Finder */}
          {onOpenRoomFinder && (
            <button
              type="button"
              onClick={onOpenRoomFinder}
              aria-label="Find empty rooms"
              className="flex items-center justify-center h-[36px] w-[36px] rounded-xl border border-slate-200 bg-slate-100/80 text-slate-600 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="Find empty rooms"
            >
              <DoorOpen className="h-4 w-4" />
            </button>
          )}

          {/* Primary 1-Tap Calendar Subscription Button */}
          <button
            type="button"
            onClick={hasSavedPreference ? onOpenSyncModal : onOpenSectionPicker}
            aria-label={hasSavedPreference ? 'Open Calendar Sync Modal' : 'Select section to sync calendar'}
            className="flex items-center gap-1.5 h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 transition-colors cursor-pointer shadow-sm border border-emerald-500/30 shrink-0"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
