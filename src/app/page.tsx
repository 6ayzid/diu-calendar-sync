'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ClassRadar } from '@/components/ClassRadar';
import { SectionSelector } from '@/components/SectionSelector';
import { SubscriptionActions } from '@/components/SubscriptionActions';
import { TimetableGrid } from '@/components/TimetableGrid';
import { SyncExplainer } from '@/components/SyncExplainer';
import { StickySyncBar } from '@/components/StickySyncBar';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { generateScheduleForSection } from '@/data/routines';
import { DayOfWeek, RoutineClass, SectionMeta } from '@/types/schedule';

export default function Home() {
  // 1. Initialize Section State with local storage fallback
  const [selectedSection, setSelectedSection] = useState<SectionMeta>(() => {
    return getSectionById('68_D') || ALL_SECTIONS[0];
  });
  const [selectedSubSection, setSelectedSubSection] = useState<'1' | '2' | 'all'>('all');

  // 2. View Mode & Day Navigation State (Default to Mobile-First Agenda)
  const [viewMode, setViewMode] = useState<'agenda' | 'matrix'>('agenda');
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
      }).formatToParts(new Date());
      const weekday = parts.find((p) => p.type === 'weekday')?.value?.toUpperCase() || '';
      const dayMap: Record<string, DayOfWeek> = {
        SATURDAY: 'SATURDAY',
        SUNDAY: 'SUNDAY',
        MONDAY: 'MONDAY',
        TUESDAY: 'TUESDAY',
        WEDNESDAY: 'WEDNESDAY',
        THURSDAY: 'THURSDAY',
      };
      return dayMap[weekday] || 'SATURDAY';
    } catch {
      return 'SATURDAY';
    }
  });

  // 3. Modal Dialog Controls
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 4. Routine Data State
  const [liveSchedule, setLiveSchedule] = useState<RoutineClass[] | null>(null);
  const [isLiveSynced, setIsLiveSynced] = useState(false);

  // Read saved section & subsection from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedSecId = localStorage.getItem('diu_routine_selected_section');
        if (savedSecId) {
          const found = getSectionById(savedSecId);
          if (found) setSelectedSection(found);
        }
        const savedSub = localStorage.getItem('diu_routine_selected_subsection');
        if (savedSub === '1' || savedSub === '2' || savedSub === 'all') {
          setSelectedSubSection(savedSub);
        }
      } catch (e) {
        console.warn('LocalStorage read error:', e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save selected section to localStorage
  const handleSelectSection = (newSec: SectionMeta) => {
    setSelectedSection(newSec);
    setLiveSchedule(null); // Trigger fresh schedule fetch
    try {
      localStorage.setItem('diu_routine_selected_section', newSec.id);
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  };

  // Save selected subsection to localStorage
  const handleSelectSubSection = (newSub: '1' | '2' | 'all') => {
    setSelectedSubSection(newSub);
    try {
      localStorage.setItem('diu_routine_selected_subsection', newSub);
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsSectionPickerOpen(true);
      } else if (e.key === 's' || e.key === 'S') {
        if (!isSectionPickerOpen) {
          e.preventDefault();
          setIsSyncModalOpen((prev) => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setViewMode((prev) => (prev === 'agenda' ? 'matrix' : 'agenda'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSectionPickerOpen]);

  // Fetch live schedule whenever section or subsection changes
  useEffect(() => {
    let isCancelled = false;

    fetch(`/api/schedule?section=${selectedSection.id}&sub=${selectedSubSection}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && Array.isArray(data.classes)) {
          setLiveSchedule(data.classes);
          setIsLiveSynced(true);
        }
      })
      .catch((err) => {
        console.warn('Live routine fetch fallback:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSection.id, selectedSubSection]);

  // Fallback / Optimistic local schedule
  const currentSchedule = useMemo(() => {
    if (liveSchedule && liveSchedule.length > 0) {
      return liveSchedule;
    }
    const raw = generateScheduleForSection(selectedSection.id);
    if (selectedSubSection === 'all') {
      return raw;
    }
    return raw.filter((c) => {
      if (c.subSection === null || c.subSection === undefined) return true;
      return c.subSection === selectedSubSection;
    });
  }, [liveSchedule, selectedSection.id, selectedSubSection]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d1a] dark:text-slate-100 antialiased pb-[max(6rem,calc(5rem+env(safe-area-inset-bottom,1rem)))] print:pb-0 print:pt-0 relative overflow-x-hidden transition-colors duration-150">
      {/* Uplifting Dawn/Spring Ambient Wash */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.06),rgba(14,165,233,0.03),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.08),rgba(14,165,233,0.04),transparent_70%)] print:hidden"
        aria-hidden="true"
      />

      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-1.5 focus:rounded-md focus:bg-emerald-500 focus:text-emerald-950 focus:text-xs focus:font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-lg print:hidden"
      >
        Skip to timetable
      </a>

      {/* Top App Cockpit HUD Navbar */}
      <Navbar
        selectedSection={selectedSection}
        selectedSubSection={selectedSubSection}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenSectionPicker={() => setIsSectionPickerOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Official Academic Print Header (Only visible on print / PDF export) */}
      <div className="hidden print:block mx-auto max-w-7xl px-4 pt-4 mb-4 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Daffodil International University
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Department of Computer Science &amp; Engineering • Class Schedule
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-700">
            <div>Section: <strong className="text-slate-900 text-sm font-bold">{selectedSection.id}</strong> ({selectedSection.batch})</div>
            <div>Subgroup: {selectedSubSection === 'all' ? 'All Classes (Both Labs)' : `Sub ${selectedSection.sectionLetter}${selectedSubSection}`}</div>
            <div>Semester: Fall 2026 • Timezone: Asia/Dhaka (UTC+6)</div>
          </div>
        </div>
      </div>

      <main id="main-content" className="mx-auto max-w-7xl px-3 py-6 sm:px-6 space-y-6 print:py-0 print:px-2">
        {/* 1. Class Radar: Immediate Glanceability for Current/Next Lecture */}
        <div className="print:hidden">
          <ClassRadar
            classes={currentSchedule}
            selectedSection={selectedSection}
            selectedSubSection={selectedSubSection}
            onViewAgendaDay={(day) => {
              setViewMode('agenda');
              setActiveDay(day);
            }}
          />
        </div>

        {/* 2. Brand Mission Header & Terminal Telemetry Console */}
        <div className="print:hidden">
          <HeroSection
            selectedSection={selectedSection}
            selectedSubSection={selectedSubSection}
            isLiveSynced={isLiveSynced}
            totalSectionsCount={ALL_SECTIONS.length}
            onOpenSectionPicker={() => setIsSectionPickerOpen(true)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        </div>

        {/* 3. Primary Class Timetable: Mobile-First Pocket Agenda ↔ Matrix Grid */}
        <TimetableGrid
          section={selectedSection}
          subSection={selectedSubSection}
          classes={currentSchedule}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeDay={activeDay}
          onActiveDayChange={setActiveDay}
        />

        {/* 4. Calendar Sync Architecture & Technical Guarantees */}
        <div className="print:hidden">
          <SyncExplainer />
        </div>
      </main>

      {/* Persistent Mobile-First Sticky Sync Bar */}
      <StickySyncBar
        section={selectedSection}
        subSection={selectedSubSection}
        onOpenSectionPicker={() => setIsSectionPickerOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Dedicated Section Picker Modal Sheet */}
      <SectionSelector
        sections={ALL_SECTIONS}
        selectedSection={selectedSection}
        selectedSubSection={selectedSubSection}
        onSelectSection={handleSelectSection}
        onSelectSubSection={handleSelectSubSection}
        isOpen={isSectionPickerOpen}
        onClose={() => setIsSectionPickerOpen(false)}
      />

      {/* Dedicated 1-Tap Calendar Subscription Modal Sheet */}
      <SubscriptionActions
        section={selectedSection}
        subSection={selectedSubSection}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-slate-100/70 py-8 text-center text-xs text-slate-500 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-400 print:hidden">
        <div className="mx-auto max-w-2xl px-4 space-y-3">
          <p className="text-slate-700 dark:text-slate-300 max-w-prose mx-auto">
            Dept. of Computer Science &amp; Engineering • Dynamic Calendar Subscription Engine
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-prose mx-auto">
            Compliant with RFC 5545 (iCalendar), RFC 7986 (Refresh Interval), and WebCal Protocol handlers. Timezone calibrated to Asia/Dhaka.
          </p>
          {/* Developer Attribution Tag */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Developed by</span>
            <a
              href="https://github.com/6ayzid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-800 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>@6ayzid</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <a
              href="https://linkedin.com/in/6ayzid"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.5a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
            <a
              href="https://t.me/bayzidx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
