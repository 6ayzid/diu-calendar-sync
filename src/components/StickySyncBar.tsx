'use client';

import React, { useState } from 'react';
import { Calendar, Copy, Check, ChevronUp, LayoutGrid, CalendarDays } from 'lucide-react';
import { SectionMeta } from '@/types/schedule';

interface StickySyncBarProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  viewMode?: 'matrix' | 'agenda';
  onToggleViewMode?: (mode: 'matrix' | 'agenda') => void;
  onOpenSectionPicker: () => void;
  onOpenSyncModal: () => void;
}

export function StickySyncBar({
  section,
  subSection,
  viewMode,
  onToggleViewMode,
  onOpenSectionPicker,
  onOpenSyncModal,
}: StickySyncBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    if (typeof window === 'undefined') return;
    const subQuery = subSection !== 'all' ? `?sub=${subSection}` : '';
    const fullUrl = `${window.location.origin}/api/calendar/${section.id}.ics${subQuery}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside
      aria-label="Quick Section and Subscription Controller"
      className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-lg print:hidden sm:hidden"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 px-3 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/95">
        {/* Left: Active Section Trigger */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={`Change academic section, currently ${section.displayName}`}
          className="flex items-center gap-1.5 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer text-left min-h-[40px]"
        >
          <div className="flex items-center gap-1 font-mono">
            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              {section.id}
            </span>
            {subSection !== 'all' && (
              <span className="rounded bg-emerald-100 border border-emerald-300 px-1 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300">
                Lab {subSection}
              </span>
            )}
          </div>
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* Right: Quick View Switcher & Sync Button */}
        <div className="flex items-center gap-1.5">
          {/* Mobile View Toggle */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={() => onToggleViewMode(viewMode === 'matrix' ? 'agenda' : 'matrix')}
              aria-label={`Switch to ${viewMode === 'matrix' ? 'Agenda' : 'Week Matrix'} view`}
              className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-slate-100/80 p-2 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
              title={viewMode === 'matrix' ? 'Switch to Day Agenda' : 'Switch to Week View'}
            >
              {viewMode === 'matrix' ? (
                <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <LayoutGrid className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          )}

          {/* Quick Copy Link */}
          <button
            type="button"
            onClick={handleCopyUrl}
            aria-label="Copy live iCal subscription URL"
            className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-slate-100/80 p-2 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            title="Copy permanent calendar feed URL"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>

          {/* Primary 1-Tap Calendar Subscription Button */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            aria-label="Open Calendar Sync Modal"
            className="flex items-center gap-1.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 transition-colors cursor-pointer shadow-sm border border-emerald-500/30"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
