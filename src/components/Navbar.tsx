'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  BookOpen,
  DoorOpen,
  WifiOff,
} from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget, CompareState } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { RoutineSwitcher } from '@/components/RoutineSwitcher';

interface NavbarProps {
  selectedSection?: SectionMeta | null;
  selectedSubSection?: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget | null;
  compareState?: CompareState;
  hasSavedPreference?: boolean;
  isOffline?: boolean;
  onRetryOffline?: () => void;
  onOpenSectionPicker: () => void;
  onOpenComparePicker: () => void;
  onSwapPriority?: () => void;
  onRemoveCompare?: () => void;
  onOpenSyncModal: () => void;
  onOpenRoomFinder?: () => void;
}

export function Navbar({
  selectedSection,
  selectedSubSection,
  activeTarget,
  compareState,
  hasSavedPreference = true,
  isOffline = false,
  onRetryOffline,
  onOpenSectionPicker,
  onOpenComparePicker,
  onSwapPriority,
  onRemoveCompare,
  onOpenSyncModal,
  onOpenRoomFinder,
}: NavbarProps) {
  const isComparing = Boolean(compareState?.active && compareState.secondaryTarget);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md transition-colors print:hidden">
      <div className="mx-auto flex max-w-7xl 2xl:max-w-[1600px] items-center justify-between px-3 py-2 sm:px-6 gap-2 sm:gap-4">
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0 hover:opacity-90 transition-opacity shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0 hidden xs:block">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-xs sm:text-base truncate block">
              DIU Routine
            </span>
          </div>
        </Link>

        {/* Center: RoutineSwitcher (Unified Search & Compare Controller) */}
        <div className="hidden sm:flex items-center justify-center flex-1 max-w-xl mx-2 lg:mx-6">
          <RoutineSwitcher
            primaryTarget={activeTarget || null}
            secondaryTarget={isComparing ? compareState?.secondaryTarget || null : null}
            isComparing={isComparing}
            onOpenPrimaryPicker={onOpenSectionPicker}
            onOpenComparePicker={onOpenComparePicker}
            onSwap={onSwapPriority || (() => {})}
            onExitCompare={onRemoveCompare || (() => {})}
            variant="navbar"
          />
        </div>

        {/* Right: Offline Indicator, Rooms, Docs Link, Theme Toggle & 1-Tap Sync */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isOffline && (
            <Tooltip content="Offline (saved routine) · Click to retry" side="bottom">
              <button
                type="button"
                onClick={onRetryOffline}
                aria-label="Offline saved routine, click to retry"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <WifiOff className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}

          {/* Room Finder Button - Hidden on mobile where StickySyncBar dock has it, visible from sm up */}
          {onOpenRoomFinder && (
            <Tooltip content="Find empty rooms & room occupancy" side="bottom">
              <button
                type="button"
                onClick={onOpenRoomFinder}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl px-2 lg:px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[36px] cursor-pointer"
                aria-label="Find empty rooms"
              >
                <DoorOpen className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Rooms</span>
              </button>
            </Tooltip>
          )}

          {/* Docs / Guide Link */}
          <Tooltip content="Setup guide & technical docs" side="bottom">
            <Link
              href="/docs"
              prefetch={true}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl px-2 lg:px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[36px]"
              aria-label="Technical documentation and guide"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Docs</span>
            </Link>
          </Tooltip>

          {/* Theme Mode Toggle (Light / System / Dark) */}
          <ThemeToggle />

          {/* 1-Tap Calendar Sync Button (Desktop / Tablet - on mobile StickySyncBar provides this) */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            aria-label="Sync Calendar"
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 px-3 sm:px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer min-h-[40px] shadow-sm border border-emerald-500/30 dark:border-emerald-400/30 shrink-0"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
