'use client';

import React from 'react';
import { Search, ArrowLeftRight, X, Plus } from 'lucide-react';
import { motion, LayoutGroup } from 'motion/react';
import { ActiveRoutineTarget } from '@/types/schedule';
import { getTargetLabel } from '@/lib/compare-utils';
import { Tooltip } from '@/components/ui/Tooltip';

interface RoutineSwitcherProps {
  primaryTarget: ActiveRoutineTarget | null;
  secondaryTarget: ActiveRoutineTarget | null;
  isComparing: boolean;
  onOpenPrimaryPicker: () => void;
  onOpenComparePicker: () => void;
  onSwap: () => void;
  onExitCompare: () => void;
  variant?: 'navbar' | 'dock';
  className?: string;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export function RoutineSwitcher({
  primaryTarget,
  secondaryTarget,
  isComparing,
  onOpenPrimaryPicker,
  onOpenComparePicker,
  onSwap,
  onExitCompare,
  variant = 'navbar',
  className = '',
}: RoutineSwitcherProps) {
  const isDock = variant === 'dock';
  const primaryLabel = getTargetLabel(primaryTarget);
  const secondaryLabel = getTargetLabel(secondaryTarget);

  const primaryIsFaculty = primaryTarget?.type === 'faculty';
  const layoutGroupId = isDock ? 'dock-switcher' : 'navbar-switcher';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COMPARE MODE: Visibly merged pill with side-by-side spring chips
  // ──────────────────────────────────────────────────────────────────────────
  if (isComparing && secondaryTarget) {
    return (
      <LayoutGroup id={layoutGroupId}>
        <motion.div
          layout
          transition={springTransition}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-full border border-emerald-500/80 bg-white/95 dark:border-emerald-500/70 dark:bg-slate-900/95 p-0.5 sm:p-1 ${
            isDock ? 'h-9 max-w-full' : 'h-10 sm:h-11'
          } shadow-xs backdrop-blur-md select-none shrink-0 ${className}`}
        >
          {/* Leading Search Trigger (Desktop only to prevent dock overflow) */}
          {!isDock && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onOpenPrimaryPicker}
              title="Search to change primary routine"
              aria-label="Search to change primary routine"
              className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-0.5"
            >
              <Search className="h-3.5 w-3.5" />
            </motion.button>
          )}

          {/* CHIP 1: Primary Entity (Solid Brand Emerald Green) */}
          <Tooltip content={`Primary: ${primaryLabel.full}. Tap to change.`} side="bottom">
            <motion.button
              layout
              key={`chip-${primaryLabel.badge}-primary`}
              transition={springTransition}
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenPrimaryPicker}
              aria-label={`Primary routine: ${primaryLabel.full}. Tap to change.`}
              className={`flex items-center gap-1 rounded-full font-mono font-bold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border border-emerald-500/50 dark:border-emerald-400/50 shadow-2xs hover:opacity-95 transition-opacity cursor-pointer shrink-0 ${
                isDock ? 'px-2 py-0.5 text-xs h-7' : 'px-3 py-1.5 text-xs h-8'
              }`}
            >
              <span>{primaryLabel.badge}</span>
              {primaryTarget?.type === 'section' && primaryTarget.subSection !== 'all' && (
                <span className="text-[10px] text-emerald-200 dark:text-emerald-950 font-bold">
                  {primaryTarget.section.sectionLetter}{primaryTarget.subSection}
                </span>
              )}
            </motion.button>
          </Tooltip>

          {/* SWAP ICON BUTTON (No rotating hover nonsense, pure functional swap) */}
          <Tooltip content="Swap primary and secondary routines" side="bottom">
            <motion.button
              layout
              transition={springTransition}
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={onSwap}
              title="Swap primary and secondary routines"
              aria-label="Swap primary and secondary routines"
              className={`flex items-center justify-center rounded-full text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer shrink-0 ${
                isDock ? 'h-6 w-6' : 'h-7 w-7 sm:h-8 sm:w-8'
              }`}
            >
              <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </motion.button>
          </Tooltip>

          {/* CHIP 2: Secondary Entity (Tonal Emerald / Tap to Change Secondary) */}
          <Tooltip content={`Secondary: ${secondaryLabel.badge}. Tap to change.`} side="bottom">
            <motion.button
              layout
              key={`chip-${secondaryLabel.badge}-secondary`}
              transition={springTransition}
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={onOpenComparePicker}
              aria-label={`Secondary routine: ${secondaryLabel.full}. Tap to change.`}
              className={`flex items-center gap-1 rounded-full font-mono font-bold bg-emerald-50 text-emerald-950 border border-emerald-300/90 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-600/70 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs shrink-0 ${
                isDock ? 'px-2 py-0.5 text-xs h-7' : 'px-3 py-1.5 text-xs h-8'
              }`}
            >
              <span>{secondaryLabel.badge}</span>
              {secondaryTarget?.type === 'section' && secondaryTarget.subSection !== 'all' && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                  {secondaryTarget.section.sectionLetter}{secondaryTarget.subSection}
                </span>
              )}
            </motion.button>
          </Tooltip>

          {/* EXIT COMPARE BUTTON (Guaranteed shrink-0, never overflows) */}
          <Tooltip content="Exit compare mode (keep primary routine)" side="bottom">
            <motion.button
              layout
              transition={springTransition}
              whileTap={{ scale: 0.88 }}
              type="button"
              onClick={onExitCompare}
              aria-label="Exit compare mode"
              title="Exit compare mode"
              className={`flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0 ${
                isDock ? 'h-6 w-6 ml-0.5 mr-0.5' : 'h-7 w-7 sm:h-8 sm:w-8 mr-0.5'
              }`}
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          </Tooltip>
        </motion.div>
      </LayoutGroup>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SINGLE MODE: Generous Material 3 Search Bar + Plus Icon Compare Button
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <LayoutGroup id={layoutGroupId}>
      <motion.div
        layout
        transition={springTransition}
        className={`flex items-center gap-1.5 sm:gap-2 ${isDock ? 'w-full' : ''} ${className}`}
      >
        {/* Main Routine Search Trigger Button (Material 3 Expressive Pill) */}
        <motion.button
          layout
          transition={springTransition}
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={onOpenPrimaryPicker}
          aria-label={
            primaryIsFaculty && primaryTarget
              ? `Change routine, currently Faculty ${primaryTarget.faculty.name} (${primaryTarget.faculty.code})`
              : `Change section, currently ${primaryTarget?.type === 'section' ? primaryTarget.section.id : 'none'}`
          }
          title="Search section, teacher, room..."
          className={`flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-slate-100/90 hover:bg-slate-200/90 hover:border-emerald-400/60 dark:border-slate-800/90 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 dark:hover:border-emerald-500/50 transition-colors cursor-pointer group shadow-2xs ${
            isDock
              ? 'h-9 px-2.5 flex-1 min-w-0'
              : 'h-10 sm:h-11 px-3.5 sm:px-4 w-full min-w-[240px] sm:min-w-[300px] md:min-w-[340px] max-w-[420px]'
          }`}
        >
          <Search className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400 shrink-0 transition-colors" />

          {/* Routine Badge & Descriptive Label */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs shrink-0">
              {primaryLabel.badge}
            </span>

            {primaryIsFaculty && primaryTarget ? (
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {primaryTarget.faculty.name}
              </span>
            ) : primaryTarget?.type === 'section' ? (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate flex items-center gap-1.5">
                {primaryTarget.subSection !== 'all' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    • {primaryTarget.section.sectionLetter}{primaryTarget.subSection}
                  </span>
                ) : (
                  <span className="hidden md:inline text-slate-400 dark:text-slate-500">
                    All Classes
                  </span>
                )}
                <span className="hidden sm:inline text-slate-400 dark:text-slate-500">
                  {primaryTarget.section.batch}
                </span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                Search routine...
              </span>
            )}
          </div>

          {/* Trailing Keyboard Shortcut Hint */}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto shrink-0 shadow-2xs group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors">
            /
          </kbd>
        </motion.button>

        {/* Compare Plus Button (Material 3 Expressive Icon Button) */}
        {primaryTarget && (
          <Tooltip
            content={`Compare routine with ${primaryLabel.badge} (+)`}
            side="bottom"
          >
            <motion.button
              layout
              transition={springTransition}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onOpenComparePicker}
              aria-label={`Compare routine with ${primaryLabel.badge}`}
              title={`Compare routine (+)`}
              className={`flex items-center justify-center rounded-full border border-slate-200/90 bg-slate-100/90 hover:bg-emerald-50 hover:border-emerald-300 text-slate-600 hover:text-emerald-600 dark:border-slate-800/90 dark:bg-slate-900/90 dark:hover:bg-emerald-950/60 dark:hover:border-emerald-700/60 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0 shadow-2xs ${
                isDock ? 'h-9 w-9' : 'h-10 w-10 sm:h-11 sm:w-11'
              }`}
            >
              <Plus className={isDock ? 'h-3.5 w-3.5 stroke-[2.25]' : 'h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.25]'} />
            </motion.button>
          </Tooltip>
        )}
      </motion.div>
    </LayoutGroup>
  );
}
