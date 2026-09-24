'use client';

import React from 'react';
import {
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { CompareState } from '@/types/schedule';
import { getTargetLabel } from '@/lib/compare-utils';

interface CompareBarProps {
  compareState: CompareState;
  onRemoveCompare: () => void;
  onSwapPriority: () => void;
  onToggleSecondaryVisibility?: () => void;
  onToggleFreeTimeHighlight?: () => void;
  sharedFreeHours?: string;
  totalFreeSlots?: number;
}

export function CompareBar({
  compareState,
  onRemoveCompare,
  onSwapPriority,
}: CompareBarProps) {
  if (!compareState.active || !compareState.secondaryTarget) return null;

  const primaryLabel = getTargetLabel(compareState.primaryTarget);
  const secondaryLabel = getTargetLabel(compareState.secondaryTarget);

  const isSecondaryPriority = compareState.priority === 'secondary';

  return (
    <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-900/50 backdrop-blur-xs text-xs font-mono select-none print:hidden">
      {/* Routine labels & swap */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mr-0.5">
          Compare:
        </span>

        {/* Section A (Primary - Slate / Solid) */}
        <button
          type="button"
          onClick={onSwapPriority}
          title="Click to prioritize this routine"
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
            !isSecondaryPriority
              ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100 ring-1 ring-slate-400/40 dark:ring-slate-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {primaryLabel.badge}
        </button>

        <button
          type="button"
          onClick={onSwapPriority}
          title="Swap routine priority"
          aria-label="Swap routine priority"
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeftRight className="h-3 w-3" />
        </button>

        {/* Section B (Secondary - Light Green / Dashed) */}
        <button
          type="button"
          onClick={onSwapPriority}
          title="Click to prioritize this routine"
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
            isSecondaryPriority
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/80 ring-1 ring-emerald-400/40 dark:ring-emerald-600/60'
              : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200'
          }`}
        >
          <span className="border-b border-dashed border-current pb-0.5">{secondaryLabel.badge}</span>
        </button>
      </div>

      {/* Exit compare button */}
      <button
        type="button"
        onClick={onRemoveCompare}
        aria-label="Exit compare"
        title="Exit compare mode"
        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
