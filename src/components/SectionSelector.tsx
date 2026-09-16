'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Layers, Check, Users, Info, X } from 'lucide-react';
import { SectionMeta } from '@/types/schedule';
import { BATCH_DEFINITIONS } from '@/data/sections';

interface SectionSelectorProps {
  sections: SectionMeta[];
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  onSelectSection: (section: SectionMeta) => void;
  onSelectSubSection: (sub: '1' | '2' | 'all') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface ScoredSection {
  section: SectionMeta;
  score: number;
}

function searchAndRankSections(
  sections: SectionMeta[],
  rawQuery: string,
  activeBatch: number | 'ALL'
): SectionMeta[] {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    if (activeBatch === 'ALL') return sections;
    return sections.filter((s) => s.batchNumber === activeBatch);
  }

  // Normalized alphanumeric query (e.g. "66o", "68d", "71a")
  const normQuery = query.replace(/[^a-z0-9]/g, '');
  const queryHasDigits = /\d/.test(query);

  const results: ScoredSection[] = [];

  for (const s of sections) {
    // If the query does not contain numbers, restrict to active batch if one is picked
    if (!queryHasDigits && activeBatch !== 'ALL' && s.batchNumber !== activeBatch) {
      continue;
    }

    const normId = s.id.toLowerCase().replace(/[^a-z0-9]/g, ''); // e.g. "66o"
    const compactCode = `${s.batchNumber}${s.sectionLetter}`.toLowerCase(); // e.g. "66o"
    const batchStr = `batch${s.batchNumber}`.toLowerCase(); // e.g. "batch66"
    const bStr = `b${s.batchNumber}`.toLowerCase(); // e.g. "b66"
    const secLetter = s.sectionLetter.toLowerCase(); // e.g. "o"

    let score = -1;

    // 1. Exact match on compact code (e.g. "66o" === "66o")
    if (compactCode === normQuery || normId === normQuery) {
      score = 0;
    }
    // 2. Starts with compact code (e.g. "66" matches "66o" at start)
    else if (compactCode.startsWith(normQuery) || normId.startsWith(normQuery)) {
      score = 10;
    }
    // 3. Compact code contains query
    else if (compactCode.includes(normQuery) || normId.includes(normQuery)) {
      score = 20;
    }
    // 4. Matches batch string (e.g. "b66" or "batch 66")
    else if (
      normQuery === bStr ||
      normQuery === batchStr ||
      batchStr.includes(normQuery) ||
      bStr.includes(normQuery)
    ) {
      score = 30;
    }
    // 5. Query is a single letter matching section letter (e.g. "o")
    else if (normQuery.length === 1 && secLetter === normQuery) {
      score = 40;
    }
    // 6. Display name match (e.g. "Batch 66 - Section O")
    else if (
      s.displayName.toLowerCase().includes(query) ||
      s.displayName.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normQuery)
    ) {
      score = 50;
    }

    if (score >= 0) {
      results.push({ section: s, score });
    }
  }

  // Sort by score ascending (best match first), then batch descending, then section letter
  results.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (b.section.batchNumber !== a.section.batchNumber) {
      return b.section.batchNumber - a.section.batchNumber;
    }
    return a.section.sectionLetter.localeCompare(b.section.sectionLetter);
  });

  return results.map((r) => r.section);
}

export function SectionSelector({
  sections,
  selectedSection,
  selectedSubSection,
  onSelectSection,
  onSelectSubSection,
  isOpen = true,
  onClose,
}: SectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchFilter, setActiveBatchFilter] = useState<number | 'ALL'>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter & rank sections using fuzzy/smart matcher
  const filteredSections = useMemo(() => {
    return searchAndRankSections(sections, searchQuery, activeBatchFilter);
  }, [sections, searchQuery, activeBatchFilter]);

  // Keyboard shortcut: pressing Enter selects the top matched section
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSections.length > 0) {
      e.preventDefault();
      onSelectSection(filteredSections[0]);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 id="section-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Select Academic Section
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {selectedSection.id} ({selectedSection.batch})
              </strong>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close section selector modal"
            className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 1. Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search section (e.g. 66o, 68_D)..."
          aria-label="Search academic section by name or batch"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono transition-colors outline-none focus:outline-none focus-visible:outline-none focus:border-slate-400 focus-visible:ring-0 focus:ring-0 min-h-[44px] dark:border-slate-800/90 dark:bg-slate-950/90 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-slate-600"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Batch Quick Filter Tabs */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin touch-pan-x overscroll-x-contain"
        role="toolbar"
        aria-label="Batch filter tabs"
      >
        <button
          type="button"
          onClick={() => setActiveBatchFilter('ALL')}
          aria-pressed={activeBatchFilter === 'ALL'}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium font-mono transition-colors cursor-pointer min-h-[40px] ${
            activeBatchFilter === 'ALL'
              ? 'bg-slate-900 text-white border border-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white dark:border-slate-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
          }`}
        >
          All Batches
        </button>
        {BATCH_DEFINITIONS.map((b) => (
          <button
            key={b.batchNumber}
            type="button"
            onClick={() => setActiveBatchFilter(b.batchNumber)}
            aria-pressed={activeBatchFilter === b.batchNumber}
            className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium font-mono transition-colors cursor-pointer min-h-[40px] ${
              activeBatchFilter === b.batchNumber
                ? 'bg-slate-900 text-white border border-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white dark:border-slate-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
            }`}
          >
            Batch {b.batchNumber}
          </button>
        ))}
      </div>

      {/* 3. Section Results Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
          <span>
            {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} available
          </span>
          {searchQuery && (
            <span className="text-slate-500 font-mono hidden sm:inline">
              Press ↵ to select first match
            </span>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto pr-1">
          {filteredSections.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>
                No sections match &quot;{searchQuery}&quot;
                {activeBatchFilter !== 'ALL' ? ` in Batch ${activeBatchFilter}` : ''}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveBatchFilter('ALL');
                }}
                className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline font-medium cursor-pointer"
              >
                Reset search and batch filter
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
              role="group"
              aria-label="Available academic sections"
            >
              {filteredSections.map((s) => {
                const isSelected = selectedSection.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(s);
                      if (onClose) onClose();
                    }}
                    aria-pressed={isSelected}
                    aria-label={`Select section ${s.displayName}`}
                    className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl p-2 text-center transition-colors border cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-950 ring-1 ring-sky-400/50 shadow-2xs dark:border-sky-500/80 dark:bg-slate-800 dark:text-white dark:ring-sky-500/40'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-slate-100/80 shadow-2xs dark:border-slate-800/80 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${
                        isSelected ? 'text-sky-950 dark:text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        {s.id}
                      </span>
                      {isSelected && <Check className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />}
                    </div>
                    <span className={`text-xs font-mono ${
                      isSelected ? 'text-sky-700 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Batch {s.batchNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Lab Subgroup Segmented Control */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>
              Lab Subgroup for <strong className="text-slate-900 dark:text-white font-mono">{selectedSection.id}</strong>:
            </span>
          </span>
          <span className="text-slate-500 font-mono hidden sm:inline">
            Filter lab periods
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Lab subgroup filter">
          <button
            type="button"
            role="radio"
            onClick={() => onSelectSubSection('all')}
            aria-checked={selectedSubSection === 'all'}
            className={`min-h-[44px] rounded-lg px-2 py-1.5 text-xs font-medium font-mono transition-colors cursor-pointer border ${
              selectedSubSection === 'all'
                ? 'bg-white text-slate-900 border-slate-300 shadow-2xs dark:bg-slate-800 dark:text-white dark:border-slate-700'
                : 'border-slate-200 bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
            }`}
          >
            All Classes (Both)
          </button>
          <button
            type="button"
            role="radio"
            onClick={() => onSelectSubSection('1')}
            aria-checked={selectedSubSection === '1'}
            className={`min-h-[44px] rounded-lg px-2 py-1.5 text-xs font-medium font-mono transition-colors cursor-pointer border ${
              selectedSubSection === '1'
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs dark:bg-slate-800 dark:text-amber-300 dark:border-amber-500/40'
                : 'border-slate-200 bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
            }`}
          >
            {selectedSection.sectionLetter}1 Only (Lab)
          </button>
          <button
            type="button"
            role="radio"
            onClick={() => onSelectSubSection('2')}
            aria-checked={selectedSubSection === '2'}
            className={`min-h-[44px] rounded-lg px-2 py-1.5 text-xs font-medium font-mono transition-colors cursor-pointer border ${
              selectedSubSection === '2'
                ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-2xs dark:bg-slate-800 dark:text-rose-300 dark:border-rose-500/40'
                : 'border-slate-200 bg-white/50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60'
            }`}
          >
            {selectedSection.sectionLetter}2 Only (Lab)
          </button>
        </div>
      </div>

      {/* 5. Modal Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Preference saves to browser storage automatically.</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-emerald-950 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 px-4 py-2 rounded-xl transition-colors cursor-pointer min-h-[44px] shadow-sm border border-emerald-400/30"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );

  // If used as a modal with onClose, render overlay
  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-modal-title"
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
          {content}
        </div>
      </div>
    );
  }

  // Inline fallback
  return <section aria-labelledby="section-modal-title">{content}</section>;
}
