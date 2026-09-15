'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { SectionSelector } from '@/components/SectionSelector';
import { SubscriptionActions } from '@/components/SubscriptionActions';
import { TimetableGrid } from '@/components/TimetableGrid';
import { SyncExplainer } from '@/components/SyncExplainer';
import { SheetsAdaptationDoc } from '@/components/SheetsAdaptationDoc';
import { ALL_SECTIONS, getSectionById } from '@/data/sections';
import { generateScheduleForSection } from '@/data/routines';
import { RoutineClass } from '@/types/schedule';
import { Calendar, Radio, Sparkles, GraduationCap, CheckCircle } from 'lucide-react';

export default function Home() {
  // Default to Batch 68 - Section D (highlighting D1 and D2 subsections)
  const [selectedSection, setSelectedSection] = useState(() => {
    return getSectionById('68_D') || ALL_SECTIONS[0];
  });

  const [selectedSubSection, setSelectedSubSection] = useState<'1' | '2' | 'all'>('all');
  const [liveSchedule, setLiveSchedule] = useState<RoutineClass[] | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLiveSynced, setIsLiveSynced] = useState(false);

  // Fetch live schedule whenever section or subsection changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingLive(true);

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
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingLive(false);
        }
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

  const handleSelectSection = (newSec: typeof selectedSection) => {
    setSelectedSection(newSec);
    setLiveSchedule(null); // Trigger fresh fetch
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top University Brand Navbar */}
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 sm:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Autumn / Fall 2026 Semester Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Dynamic Class Routine &amp; Live Calendar Feeds
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Permanent RFC 5545 iCalendar/WebCal subscription feeds connected with live university schedule data.
              Subscribe once on Apple Calendar, Google Calendar, or Outlook — all weekly revisions, room changes, and teacher swaps update automatically in the background!
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-400" />
                <span>Dept. of CSE Routine Committee</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Routine V1.1 (Effective: Sept 09, 2026)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                {isLiveSynced ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Live Campus Sync Active</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-indigo-300 font-medium">
                    <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                    <span>174 Active Sections Ready</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </section>

        {/* 1. Section & Subsection Selector */}
        <section>
          <SectionSelector
            sections={ALL_SECTIONS}
            selectedSection={selectedSection}
            selectedSubSection={selectedSubSection}
            onSelectSection={handleSelectSection}
            onSelectSubSection={setSelectedSubSection}
          />
        </section>

        {/* 2. One-Click Subscription Actions Bar */}
        <section>
          <SubscriptionActions
            section={selectedSection}
            subSection={selectedSubSection}
          />
        </section>

        {/* 3. Live Timetable Grid Preview */}
        <section>
          <TimetableGrid
            section={selectedSection}
            subSection={selectedSubSection}
            classes={currentSchedule}
          />
        </section>

        {/* 4. Auto-Sync 2-Step Instructions & Sync Frequencies */}
        <section>
          <SyncExplainer />
        </section>

        {/* 5. Google Sheets + Google Apps Script Architecture Guide */}
        <section>
          <SheetsAdaptationDoc />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 space-y-2">
          <p>
            Dept. of Computer Science &amp; Engineering • Dynamic Calendar Subscription Engine
          </p>
          <p className="text-[11px] text-slate-600">
            Compliant with RFC 5545 (iCalendar), RFC 7986 (Refresh Interval), and WebCal Protocol handlers. Timezone calibrated to Asia/Dhaka.
          </p>
        </div>
      </footer>
    </div>
  );
}
