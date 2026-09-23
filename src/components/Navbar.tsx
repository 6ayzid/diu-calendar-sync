'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  ChevronDown,
  BookOpen,
  Plus,
  X,
  DoorOpen,
  Search,
} from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget, CompareState } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getTargetLabel } from '@/lib/compare-utils';

interface NavbarProps {
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget;
  compareState?: CompareState;
  hasSavedPreference?: boolean;
  onOpenSectionPicker: () => void;
  onOpenComparePicker: () => void;
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
  onOpenSectionPicker,
  onOpenComparePicker,
  onRemoveCompare,
  onOpenSyncModal,
  onOpenRoomFinder,
}: NavbarProps) {
  const isFaculty = activeTarget?.type === 'faculty';
  const faculty = isFaculty ? activeTarget.faculty : null;

  const isComparing = Boolean(compareState?.active && compareState.secondaryTarget);
  const primaryLabel = isComparing && compareState ? getTargetLabel(compareState.primaryTarget) : null;
  const secondaryLabel = isComparing && compareState ? getTargetLabel(compareState.secondaryTarget) : null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md transition-colors print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 gap-2">
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0 hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-xs sm:text-base truncate block">
              DIU Routine
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block font-mono">
              CSE Department
            </span>
          </div>
        </Link>

        {/* Center: Section / Faculty Selector HUD Pill + Compare Plus Button */}
        <div className="hidden sm:flex items-center gap-1.5">
          {isComparing && primaryLabel && secondaryLabel ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/50 dark:border-emerald-800 dark:bg-slate-900/80 p-1 shadow-2xs font-mono text-xs">
              <button
                type="button"
                onClick={onOpenSectionPicker}
                title={`Primary: ${primaryLabel.full} (tap to change)`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{primaryLabel.badge}</span>
              </button>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">vs</span>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs">
                <span>{secondaryLabel.badge}</span>
                {onRemoveCompare && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCompare();
                    }}
                    title="Remove compared routine"
                    aria-label="Remove compared routine"
                    className="p-0.5 rounded text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {hasSavedPreference ? (
                <button
                  type="button"
                  onClick={onOpenSectionPicker}
                  aria-label={
                    isFaculty && faculty
                      ? `Select routine target, currently Faculty ${faculty.name} (${faculty.code})`
                      : `Select section, currently ${selectedSection.displayName}`
                  }
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 px-2.5 py-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  {isFaculty && faculty ? (
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-400 font-sans hidden md:inline">Faculty:</span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold bg-white dark:bg-slate-800 border border-emerald-300/80 dark:border-emerald-600/50 px-2 py-0.5 rounded shadow-2xs">
                        {faculty.code}
                      </strong>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-400 font-sans hidden md:inline">Section:</span>
                      <strong className="text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">
                        {selectedSection.id}
                      </strong>
                      {selectedSubSection !== 'all' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          • Lab {selectedSubSection}
                        </span>
                      )}
                    </div>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSectionPicker}
                  aria-label="Select section or teacher"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-3 py-1.5 transition-colors cursor-pointer min-h-[40px] text-emerald-800 dark:text-emerald-300 font-semibold text-xs"
                >
                  <Search className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Select Section</span>
                  <ChevronDown className="h-3.5 w-3.5 text-emerald-500/70" />
                </button>
              )}

              {hasSavedPreference && (
                <button
                  type="button"
                  onClick={onOpenComparePicker}
                  title="Compare with another section or teacher routine"
                  aria-label="Compare with another section or teacher routine"
                  className="flex items-center justify-center h-[40px] px-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 hover:border-emerald-400/60 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 dark:text-slate-300 transition-colors cursor-pointer gap-1 text-xs font-mono font-bold"
                >
                  <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline text-[11px]">Compare</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Rooms, Docs Link, Theme Toggle & 1-Tap Sync */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Room Finder Button - Hidden on mobile where StickySyncBar dock has it, visible from sm up */}
          {onOpenRoomFinder && (
            <button
              type="button"
              onClick={onOpenRoomFinder}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl px-2 lg:px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[36px] cursor-pointer"
              title="Find empty rooms & room occupancy"
              aria-label="Find empty rooms"
            >
              <DoorOpen className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Rooms</span>
            </button>
          )}

          {/* Docs / Guide Link */}
          <Link
            href="/docs"
            prefetch={true}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl px-2 lg:px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[36px]"
            title="Setup guide & technical docs"
            aria-label="Technical documentation and guide"
          >
            <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="hidden lg:inline">Docs</span>
          </Link>

          {/* Theme Mode Toggle (Light / System / Dark) */}
          <ThemeToggle />

          {/* 1-Tap Calendar Sync Button (Desktop / Tablet - on mobile StickySyncBar provides this) */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            aria-label="Open Calendar Subscription Sheet"
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 px-3 sm:px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer min-h-[40px] shadow-sm border border-emerald-500/30 dark:border-emerald-400/30 shrink-0"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sync Calendar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
