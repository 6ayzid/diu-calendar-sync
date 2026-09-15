'use client';

import React, { useState, useMemo } from 'react';
import { Search, Layers, Check, Users } from 'lucide-react';
import { SectionMeta } from '@/types/schedule';
import { BATCH_DEFINITIONS } from '@/data/sections';

interface SectionSelectorProps {
  sections: SectionMeta[];
  selectedSection: SectionMeta;
  selectedSubSection: '1' | '2' | 'all';
  onSelectSection: (section: SectionMeta) => void;
  onSelectSubSection: (sub: '1' | '2' | 'all') => void;
}

export function SectionSelector({
  sections,
  selectedSection,
  selectedSubSection,
  onSelectSection,
  onSelectSubSection,
}: SectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchFilter, setActiveBatchFilter] = useState<number | 'ALL'>('ALL');

  // Filter sections by search and batch
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sectionLetter.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBatch =
        activeBatchFilter === 'ALL' || s.batchNumber === activeBatchFilter;

      return matchesSearch && matchesBatch;
    });
  }, [sections, searchQuery, activeBatchFilter]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            Select Your Section & Subsection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose from 70+ sections across Batches 63–73.
          </p>
        </div>

        {/* Subsection Selector Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <span className="px-2 text-xs font-medium text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3" /> Group:
          </span>
          <button
            type="button"
            onClick={() => onSelectSubSection('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedSubSection === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All ({selectedSection.sectionLetter}1 & {selectedSection.sectionLetter}2)
          </button>
          <button
            type="button"
            onClick={() => onSelectSubSection('1')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedSubSection === '1'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {selectedSection.sectionLetter}1 Only
          </button>
          <button
            type="button"
            onClick={() => onSelectSubSection('2')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedSubSection === '2'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {selectedSection.sectionLetter}2 Only
          </button>
        </div>
      </div>

      {/* Search Input & Batch Filter Pills */}
      <div className="mt-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search section (e.g. 68_D, 70_Q)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Batch Quick Tabs */}
        <div className="flex w-full md:w-auto items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveBatchFilter('ALL')}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              activeBatchFilter === 'ALL'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            All Batches
          </button>
          {BATCH_DEFINITIONS.map((b) => (
            <button
              key={b.batchNumber}
              type="button"
              onClick={() => setActiveBatchFilter(b.batchNumber)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                activeBatchFilter === b.batchNumber
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Batch {b.batchNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Section Badges */}
      <div className="mt-4 max-h-48 overflow-y-auto pr-1">
        {filteredSections.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No sections match &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
            {filteredSections.map((s) => {
              const isSelected = selectedSection.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSection(s)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all border ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-200 shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs font-bold tracking-tight">
                    {s.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sec {s.sectionLetter}
                  </span>
                  {isSelected && (
                    <span className="mt-0.5 inline-flex items-center text-[9px] text-indigo-400 font-semibold">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SubSection Context Helper */}
      <div className="mt-3.5 rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          💡 <strong className="text-slate-300">{selectedSection.displayName}</strong>: Theory lectures are shared.
          {selectedSubSection === 'all'
            ? ` Showing all classes including both ${selectedSection.sectionLetter}1 and ${selectedSection.sectionLetter}2 labs.`
            : ` Filtered to show ${selectedSection.sectionLetter}${selectedSubSection} lab sessions only.`}
        </span>
        <span className="font-mono text-slate-500 text-[10px]">
          ID: {selectedSection.id}{selectedSubSection !== 'all' ? selectedSubSection : ''}
        </span>
      </div>
    </div>
  );
}
