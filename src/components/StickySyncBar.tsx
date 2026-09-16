'use client';

import React, { useState } from 'react';
import { Calendar, Copy, Check, ChevronUp } from 'lucide-react';
import { SectionMeta } from '@/types/schedule';

interface StickySyncBarProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  onOpenSectionPicker: () => void;
  onOpenSyncModal: () => void;
}

export function StickySyncBar({
  section,
  subSection,
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
      className="fixed bottom-4 left-3 right-3 z-40 mx-auto max-w-xl print:hidden"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2 px-3 shadow-xl backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/90">
        {/* Left: Active Section Trigger */}
        <button
          type="button"
          onClick={onOpenSectionPicker}
          aria-label={`Change academic section, currently ${section.displayName}`}
          className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer text-left min-h-[44px]"
        >
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-xs font-mono font-semibold text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              {section.id}
            </span>
            {subSection !== 'all' && (
              <span className="rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/25 dark:text-amber-300">
                {section.sectionLetter}{subSection}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden xs:inline">Change</span>
            <ChevronUp className="h-3 w-3 text-slate-400 dark:text-slate-500" />
          </div>
        </button>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Copy Feed URL Button */}
          <button
            type="button"
            onClick={handleCopyUrl}
            aria-label="Copy live iCal subscription URL"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 bg-slate-100/80 p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 px-4 py-2 text-xs font-bold text-emerald-950 transition-colors cursor-pointer shadow-sm border border-emerald-400/30"
          >
            <Calendar className="h-4 w-4 text-emerald-950" />
            <span>Sync Routine</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
