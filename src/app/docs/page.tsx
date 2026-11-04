import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Metadata } from 'next';
import { DocsSyncCard } from '@/components/DocsSyncCard';

export const metadata: Metadata = {
  title: 'Calendar Sync Setup Guide | DIU CSE Routine',
  description:
    'Step-by-step guide to syncing live DIU CSE class routines on Android, iPhone, Mac, Google Calendar, and Outlook.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d1a] dark:text-slate-100 antialiased py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/"
            prefetch={true}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timetable</span>
          </Link>
          <span className="text-xs font-mono text-slate-400">Setup Guide</span>
        </div>

        {/* Live Interactive Sync Widget right on the Guide Page */}
        <DocsSyncCard />

        {/* ─────────── TROUBLESHOOTING CHECKLIST ─────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/60 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Troubleshooting
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>1. No &quot;URL of calendar&quot; box?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Open in <strong>Chrome</strong> (logged into Google), tap <strong className="font-mono">⋮</strong> &rarr; enable <strong>Desktop site</strong>, paste URL &rarr; tap{' '}
                <span className="inline-block rounded-full bg-[#a8c7fa] text-[#062e6f] px-2 py-0.2 text-[10px] font-semibold leading-tight select-none">
                  Add calendar
                </span>
                .
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>2. Added, but app is blank?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                In Google Calendar app: <strong className="font-mono">☰</strong> &rarr; <strong>Settings</strong> &rarr; tap <strong>&quot;Show more&quot;</strong> under your email &rarr; tap <strong>DIU Routine</strong> &rarr; turn <strong>Sync ON</strong>.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>3. Not under &quot;Show more&quot;?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Check the top-right profile icon in Chrome—make sure you added it to the <strong>same Google account</strong> selected in your Calendar app.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 transition-colors shadow-sm"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Back to Timetable</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
