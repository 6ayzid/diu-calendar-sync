'use client';

import React from 'react';
import {
  CalendarDays,
  Calendar,
  Layers,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { SectionMeta } from '@/types/schedule';
import { Badge } from '@/components/ui';

import { ThemeToggle } from '@/components/ThemeToggle';

interface NavbarProps {
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  viewMode: 'agenda' | 'matrix';
  onToggleViewMode: (mode: 'agenda' | 'matrix') => void;
  onOpenSectionPicker: () => void;
  onOpenSyncModal: () => void;
}

export function Navbar({
  selectedSection,
  selectedSubSection,
  viewMode,
  onToggleViewMode,
  onOpenSectionPicker,
  onOpenSyncModal,
}: NavbarProps) {

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95 backdrop-blur-md transition-colors print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-emerald-50 text-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-xs sm:text-base truncate">
                DIU CSE Routine
              </span>
              <Badge variant="emerald" size="sm" dot mono className="hidden xl:inline-flex">
                Live iCal
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Dept. of Computer Science &amp; Engineering
            </p>
          </div>
        </div>

        {/* Center: Section Selector HUD Pill */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={`Select section, currently ${selectedSection.displayName}`}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 px-3 py-1.5 transition-colors cursor-pointer min-h-[44px]"
        >
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-sans hidden md:inline">Section:</span>
            <strong className="text-slate-900 dark:text-white font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs dark:shadow-none">
              {selectedSection.id}
            </strong>
            {selectedSubSection !== 'all' && (
              <span className="text-amber-600 dark:text-amber-400/90 font-medium">
                ({selectedSection.sectionLetter}{selectedSubSection})
              </span>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Right: View Switcher, Theme Toggle & 1-Tap Sync */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle: Agenda vs Matrix */}
          <div className="hidden md:flex items-center rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => onToggleViewMode('agenda')}
              aria-pressed={viewMode === 'agenda'}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('matrix')}
              aria-pressed={viewMode === 'matrix'}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700/60'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Matrix</span>
            </button>
          </div>

          {/* Theme Mode Toggle (Light / System / Dark) */}
          <ThemeToggle />

          {/* 1-Tap Calendar Sync Button */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            aria-label="Open Calendar Subscription Sheet"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer min-h-[44px] shadow-sm border border-emerald-500/30 dark:border-emerald-400/30"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sync Calendar</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
