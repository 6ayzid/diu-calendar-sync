'use client';

import React, { useState, useEffect } from 'react';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { getFacultyByCode } from '@/data/faculty';
import { ActiveRoutineTarget, SectionMeta } from '@/types/schedule';
import { SubscriptionActions } from '@/components/SubscriptionActions';

export function DocsSyncCard() {
  const defaultSec = getSectionById('66_O') || ALL_SECTIONS[0];
  const [section, setSection] = useState<SectionMeta>(defaultSec);
  const [subSection, setSubSection] = useState<'1' | '2' | 'all'>('all');
  const [activeTarget, setActiveTarget] = useState<ActiveRoutineTarget>({
    type: 'section',
    section: defaultSec,
    subSection: 'all',
  });

  useEffect(() => {
    try {
      const savedType = localStorage.getItem('diu_routine_selected_type');
      const savedSubRaw = localStorage.getItem('diu_routine_selected_subsection');
      const validSub: '1' | '2' | 'all' =
        savedSubRaw === '1' || savedSubRaw === '2' ? savedSubRaw : 'all';

      if (savedType === 'faculty') {
        const savedFaculty = localStorage.getItem('diu_routine_selected_faculty');
        const foundFaculty = savedFaculty ? getFacultyByCode(savedFaculty) : undefined;
        if (foundFaculty) {
          setActiveTarget({ type: 'faculty', faculty: foundFaculty });
          return;
        }
      }

      const savedSecId = localStorage.getItem('diu_routine_selected_section');
      const foundSec = savedSecId ? getSectionById(savedSecId) : undefined;
      if (foundSec) {
        setSection(foundSec);
        setSubSection(validSub);
        setActiveTarget({ type: 'section', section: foundSec, subSection: validSub });
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleSectionChange = (newSecId: string) => {
    const found = getSectionById(newSecId);
    if (!found) return;
    setSection(found);
    setActiveTarget({ type: 'section', section: found, subSection });
    try {
      localStorage.setItem('diu_routine_selected_type', 'section');
      localStorage.setItem('diu_routine_selected_section', found.id);
    } catch {
      // Ignore
    }
  };

  const handleSubChange = (newSub: '1' | '2' | 'all') => {
    setSubSection(newSub);
    setActiveTarget({ type: 'section', section, subSection: newSub });
    try {
      localStorage.setItem('diu_routine_selected_type', 'section');
      localStorage.setItem('diu_routine_selected_subsection', newSub);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      {/* Quick Section & Lab Group Picker so the guide works standalone */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label
            htmlFor="docs-section-select"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            Section:
          </label>
          <select
            id="docs-section-select"
            value={section.id}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white cursor-pointer"
          >
            {ALL_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </div>

        {/* Lab Group Filter */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-950">
          {(['all', '1', '2'] as const).map((sub) => {
            const active = subSection === sub && activeTarget.type === 'section';
            const label =
              sub === 'all' ? 'All Labs' : `${section.sectionLetter}${sub} Only`;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubChange(sub)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? sub === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400'
                      : sub === '1'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Device-Aware Sync Actions */}
      <SubscriptionActions
        section={section}
        subSection={subSection}
        activeTarget={activeTarget}
        isOpen={true}
      />
    </div>
  );
}
