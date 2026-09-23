'use client';

import React from 'react';
import {
  ArrowLeftRight,
  EyeOff,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';
import { CompareState } from '@/types/schedule';
import { getTargetLabel } from '@/lib/compare-utils';

interface CompareBarProps {
  compareState: CompareState;
  onRemoveCompare: () => void;
  onSwapPriority: () => void;
  onToggleSecondaryVisibility: () => void;
  onToggleFreeTimeHighlight: () => void;
  sharedFreeHours: string;
  totalFreeSlots: number;
}

export function CompareBar({
  compareState,
  onRemoveCompare,
  onSwapPriority,
  onToggleSecondaryVisibility,
  onToggleFreeTimeHighlight,
  sharedFreeHours,
  totalFreeSlots,
}: CompareBarProps) {
  if (!compareState.active || !compareState.secondaryTarget) return null;

  const primaryLabel = getTargetLabel(compareState.primaryTarget);
  const secondaryLabel = getTargetLabel(compareState.secondaryTarget);

  const isSecondaryPriority = compareState.priority === 'secondary';
  const isBlockVisible = compareState.secondaryVisibility === 'block';

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white/90 dark:border-slate-800/90 dark:bg-slate-900/85 backdrop-blur-md px-3 py-2 shadow-xs transition-all print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left: Comparing Entities & Priority Swapper */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mr-0.5">
            Compare:
          </span>

          {/* Primary / Active Routine */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
              !isSecondaryPriority
                ? 'bg-emerald-500/10 text-emerald-900 border border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-600/50 font-bold shadow-2xs'
                : isBlockVisible
                ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
                : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200 dark:bg-slate-950/40 dark:text-slate-500 dark:border-slate-800 opacity-60'
            }`}
          >
            <span className="font-bold">{primaryLabel.badge}</span>
            <span className="text-[10px] hidden md:inline truncate max-w-[90px] font-sans font-normal opacity-85">
              {primaryLabel.type === 'faculty' ? primaryLabel.full : ''}
            </span>
            {!isSecondaryPriority && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            )}
          </div>

          {/* Priority Flip Button */}
          <button
            type="button"
            onClick={onSwapPriority}
            title="Swap active priority routine"
            aria-label="Swap active priority routine"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="h-3 w-3" />
          </button>

          {/* Secondary Routine */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
              isSecondaryPriority
                ? 'bg-emerald-500/10 text-emerald-900 border border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-600/50 font-bold shadow-2xs'
                : isBlockVisible
                ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
                : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200 dark:bg-slate-950/40 dark:text-slate-500 dark:border-slate-800 opacity-60'
            }`}
          >
            <span className="font-bold">{secondaryLabel.badge}</span>
            <span className="text-[10px] hidden md:inline truncate max-w-[90px] font-sans font-normal opacity-85">
              {secondaryLabel.type === 'faculty' ? secondaryLabel.full : ''}
            </span>
            {isSecondaryPriority && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Right: Actions & Free Time Highlight Pill */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Secondary routine display toggle (Blocks vs Hidden) */}
          <button
            type="button"
            onClick={onToggleSecondaryVisibility}
            className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-medium transition-colors cursor-pointer min-h-[30px] ${
              isBlockVisible
                ? 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200/80 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
            title={
              isBlockVisible
                ? 'Background routine shown as blocks (click to hide)'
                : 'Background routine is hidden (click to show as blocks)'
            }
          >
            {isBlockVisible ? <Layers className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span className="font-mono text-[11px]">{isBlockVisible ? 'Blocks' : 'Hidden'}</span>
          </button>

          {/* Shared Free Time Button (Primary Emerald Color) */}
          <button
            type="button"
            onClick={onToggleFreeTimeHighlight}
            aria-pressed={compareState.showFreeTimeHighlight}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer min-h-[30px] ${
              compareState.showFreeTimeHighlight
                ? 'border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'border-emerald-300/80 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
            }`}
            title="Highlight shared free windows on the timetable"
          >
            <Sparkles className="h-3 w-3" />
            <span>Shared Free: {sharedFreeHours}</span>
            <span className="text-[10px] font-mono opacity-85 font-normal">({totalFreeSlots})</span>
          </button>

          {/* Close Compare */}
          <button
            type="button"
            onClick={onRemoveCompare}
            aria-label="Remove comparison and close compare mode"
            title="Remove compared routine"
            className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
