import React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Check,
  X,
  Smartphone,
  Calendar,
  Share2,
  ShieldCheck,
  Zap,
  Laptop,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendar Sync Guide & Architecture | DIU CSE Routine',
  description:
    'Comprehensive guide on subscribing to live DIU class routines on Google Calendar, Apple Calendar, and Outlook with zero duplicate events.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080d1a] dark:text-slate-100 antialiased py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Top Breadcrumb & Return to App */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/"
            prefetch={true}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Timetable</span>
          </Link>
          <span className="text-xs font-mono text-slate-400">RFC 5545 &amp; WebCal Architecture</span>
        </div>

        {/* Page Title & Intro */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            <span>Setup &amp; Technical Guarantees</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How Live Calendar Sync Works
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Unlike static PDF routines or screenshot sharing, this platform compiles live, dynamic WebCal feeds. Follow the quick guide below to connect your personal calendar client.
          </p>
        </div>

        {/* Platform Quick-Setup Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Apple Calendar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Apple Calendar (iOS / macOS)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tap the <strong className="text-slate-700 dark:text-slate-300">Sync Calendar</strong> button on the home screen, select Apple Calendar, and iOS will open the native subscription sheet automatically.
            </p>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Protocol: native webcal://
            </div>
          </div>

          {/* Google Calendar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Calendar (Web &amp; PC)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Click <strong className="text-slate-700 dark:text-slate-300">Add to Google Calendar</strong> on a PC or browser. <span className="text-amber-700 dark:text-amber-300 font-semibold">Note: The Android app cannot add URLs directly</span> — see the dedicated Android guide below.
            </p>
            <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Direct web-add URL</span>
              <a href="#android-setup" className="text-amber-600 dark:text-amber-400 font-sans font-bold hover:underline">
                Android Guide &darr;
              </a>
            </div>
          </div>

          {/* Microsoft Outlook */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Microsoft Outlook</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              In Outlook, go to <strong className="text-slate-700 dark:text-slate-300">Add Calendar &rarr; Subscribe from web</strong>, paste your section&apos;s feed URL, and check &quot;Automatically update&quot;.
            </p>
            <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              Internet Calendar Feed
            </div>
          </div>
        </div>

        {/* Android Dedicated Setup Guide */}
        <section
          id="android-setup"
          className="rounded-2xl border-2 border-amber-300/80 bg-amber-50/70 p-5 sm:p-7 dark:border-amber-500/30 dark:bg-amber-950/20 space-y-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-200/80 text-amber-900 border border-amber-300 px-2 py-0.2 text-[11px] font-mono font-bold dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                    ANDROID NOTICE
                  </span>
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Crucial Setup Instruction
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-amber-950 dark:text-amber-100 mt-0.5">
                  Adding Calendar URL on Android
                </h2>
              </div>
            </div>
            <a
              href="https://calendar.google.com/calendar/r/settings/addbyurl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Google Add URL Page</span>
            </a>
          </div>

          {/* Why Android App Cannot Add URL Directly */}
          <div className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-500/20 p-4 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Why is there no &quot;Add by URL&quot; option in the Google Calendar Android app?</span>
            </p>
            <p>
              Google restricts external webcal/iCal subscriptions strictly to the <strong>Google Calendar Web interface</strong>. The mobile app can only display calendars that are already subscribed under your Google account.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              To view your live class routine on your Android phone, you must add the feed URL once via a <strong>PC/Desktop browser</strong> (recommended) or on your phone using <strong>Chrome Desktop Mode</strong>, and then <strong>turn on &quot;Sync&quot;</strong> in your mobile app settings.
            </p>
          </div>

          {/* Two Methods Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: PC / Laptop */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Method A: Use a PC / Laptop
                  </h3>
                </div>
                <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 px-2 py-0.2 text-[10px] font-mono font-bold">
                  EASIEST
                </span>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 list-decimal ml-4 leading-relaxed">
                <li>
                  Click <strong>Copy Feed URL</strong> on this website for your section.
                </li>
                <li>
                  On your PC or laptop, open{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 dark:text-blue-400 font-mono"
                  >
                    calendar.google.com
                  </a>
                  .
                </li>
                <li>
                  In the left sidebar, locate <strong>&quot;Other calendars&quot;</strong> and click the <strong>&quot;+&quot;</strong> icon &rarr; select <strong>&quot;From URL&quot;</strong>.
                </li>
                <li>
                  Paste your copied URL and click <strong>&quot;Add calendar&quot;</strong>.
                </li>
                <li className="font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <strong>Turn on Mobile Sync:</strong> Open the Google Calendar app on your phone &rarr; tap the top-left menu (☰) &rarr; <strong>Settings</strong> &rarr; tap your Google Account &rarr; tap your new DIU routine calendar &rarr; toggle <strong>&quot;Sync&quot; to ON</strong>.
                </li>
              </ol>
            </div>

            {/* Method B: Android Phone (Desktop Mode) */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Method B: On Mobile (Desktop Mode)
                  </h3>
                </div>
                <span className="rounded bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/60 px-2 py-0.2 text-[10px] font-mono font-bold">
                  NO PC NEEDED
                </span>
              </div>

              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 list-decimal ml-4 leading-relaxed">
                <li>
                  Click <strong>Copy Feed URL</strong> on this website for your section.
                </li>
                <li>
                  Open <strong>Google Chrome</strong> (or your browser) on your phone and go to{' '}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 dark:text-blue-400 font-mono"
                  >
                    calendar.google.com
                  </a>
                  .
                </li>
                <li>
                  Tap Chrome&apos;s menu (three dots <strong className="font-mono">⋮</strong> in top-right corner) and enable <strong className="text-amber-900 dark:text-amber-200">&quot;Desktop site&quot;</strong>.
                </li>
                <li>
                  Zoom into the left sidebar, tap the <strong>&quot;+&quot;</strong> icon beside <strong>&quot;Other calendars&quot;</strong> &rarr; select <strong>&quot;From URL&quot;</strong>.
                </li>
                <li>
                  Paste your feed URL and tap <strong>&quot;Add calendar&quot;</strong>.
                </li>
                <li className="font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <strong>Turn on Mobile Sync:</strong> Open the Google Calendar app on your phone &rarr; <strong>Settings</strong> &rarr; tap your Account &rarr; tap the new calendar &rarr; toggle <strong>&quot;Sync&quot; to ON</strong>.
                </li>
              </ol>
            </div>
          </div>

          {/* Quick Notice about University Email Compatibility */}
          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <Settings className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p>
              <strong>Using your @diu.edu.bd email?</strong> DIU Google Workspace accounts fully support external calendar subscriptions! You can subscribe using either your official <strong>@diu.edu.bd</strong> account or your personal <strong>@gmail.com</strong> account.
            </p>
          </div>
        </section>

        {/* Live Feed vs Static Comparison */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>Why Live Subscription Feeds Win</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Live Subscription Feed (Recommended)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automatically reflects classroom swaps, instructor changes, and exam schedules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero duplicates:</strong> Uses deterministic UIDs so events update in place.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>15-minute revalidation keeps feeds fast and resilient under campus peak hours.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 dark:border-rose-900/40 dark:bg-rose-950/10 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-950 dark:text-rose-200 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>Static .ICS Snapshot File</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <X className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Becomes obsolete immediately when a teacher reschedules or cancels a period.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Re-importing a new file duplicates every single existing class entry.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Requires manually deleting old events one by one from your calendar.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Architecture Guarantees */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Technical Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <span>Asia/Dhaka (UTC+6) Timezone</span>
              </strong>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                All RFC 5545 VEVENT components declare strict VTIMEZONE definitions for Asia/Dhaka, preventing calendar engines from drifting when traveling or syncing across timezones.
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
                <span>Deterministic UIDs</span>
              </strong>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Event UIDs follow the format <code className="text-emerald-600 dark:text-emerald-400 font-mono">slot-[sec]-[course]-[sub]-[day]-[time]</code>. When routine updates publish, calendar clients cleanly update existing entries rather than appending duplicates.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 transition-colors shadow-sm"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Open Class Timetable</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
