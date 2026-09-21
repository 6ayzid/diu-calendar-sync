'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { SectionMeta } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavbarProps {
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  onOpenSectionPicker: () => void;
  onOpenSyncModal: () => void;
}

export function Navbar({
  selectedSection,
  selectedSubSection,
  onOpenSectionPicker,
  onOpenSyncModal,
}: NavbarProps) {
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

        {/* Center: Section Selector HUD Pill (Desktop/Tablet only; on mobile StickySyncBar is used) */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={`Select section, currently ${selectedSection.displayName}`}
          className="hidden sm:flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/80 px-2.5 py-1.5 transition-colors cursor-pointer min-h-[40px]"
        >
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
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Right: Docs Link, Theme Toggle & 1-Tap Sync */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Docs / Guide Link */}
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors min-h-[36px]"
            title="Setup guide & technical docs"
          >
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline">Docs &amp; Guide</span>
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
