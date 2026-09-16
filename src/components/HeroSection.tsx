'use client';

import React from 'react';
import { Calendar, ArrowRight, Layers } from 'lucide-react';
import { SectionMeta } from '@/types/schedule';

interface HeroSectionProps {
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  isLiveSynced?: boolean;
  totalSectionsCount?: number;
  onOpenSectionPicker?: () => void;
  onOpenSyncModal?: () => void;
}

export function HeroSection({
  selectedSection,
  selectedSubSection,
  onOpenSectionPicker,
  onOpenSyncModal,
}: HeroSectionProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-sm p-6 sm:p-7 shadow-xs dark:shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Brand Mission & High-Conviction Value Statement */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Dynamic Routine &amp; Live Calendar Feeds
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Subscribe once on Apple Calendar or Google Calendar. Weekly schedule revisions, room changes, and routine shifts sync automatically with zero duplicate events.
          </p>
        </div>

        {/* High-Conviction Action Cluster */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenSectionPicker && (
            <button
              type="button"
              onClick={onOpenSectionPicker}
              className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 text-slate-800 dark:border-slate-700/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:hover:border-slate-600 dark:text-slate-200 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px] flex items-center gap-2"
            >
              <Layers className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="font-mono">
                Section <strong className="text-slate-900 dark:text-white font-semibold">{selectedSection.id}</strong>
                {selectedSubSection !== 'all' && (
                  <span className="text-amber-600 dark:text-amber-400/90 ml-1">
                    ({selectedSection.sectionLetter}{selectedSubSection})
                  </span>
                )}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </button>
          )}

          {onOpenSyncModal && (
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 px-5 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 shadow-sm border border-emerald-500/30 dark:border-emerald-400/40"
            >
              <Calendar className="h-4 w-4" />
              <span>Subscribe to Feeds</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
