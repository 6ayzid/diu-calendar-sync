'use client';

import React from 'react';
import {
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Globe,
  ShieldCheck,
  Clock,
  HelpCircle,
} from 'lucide-react';

export function SyncExplainer() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl space-y-6">
      {/* 2-Step Callout */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">
            2-Step Quick Start: Subscribe Once, Auto-Sync All Semester
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white text-xs">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Pick Your Batch, Section & Group
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Select your batch (e.g., Batch 68) and section (e.g., Section D). If your lab group is D1 or D2, choose the subsection toggle to get only your assigned lab slot.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-xs">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Click &quot;Subscribe&quot; or &quot;Add to Google Calendar&quot;
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Tap the Apple / Outlook button on mobile/Mac, or Add to Google Calendar on Android/PC. Confirm the prompt to subscribe. Do <strong>not</strong> just download the offline file!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Live Feeds vs Static Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Live Subscription Feed (Recommended)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Automatically syncs weekly routine updates, exam swaps, and room changes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Uses deterministic UIDs — existing calendar events update in place with zero duplicates.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Always zero maintenance for the student throughout the academic semester.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Static .ICS Snapshot Download (Avoid)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✗</span>
              <span>Becomes obsolete the moment a faculty member adjusts a room or schedule.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✗</span>
              <span>Importing a new .ics file later will duplicate every single existing class!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">✗</span>
              <span>Requires manual re-download and tedious manual deletions.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sync Intervals Comparison Table */}
      <div className="pt-2 border-t border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-indigo-400" />
          <span>Sync Frequencies by Calendar Provider</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-4 font-semibold">Calendar Client</th>
                <th className="py-2 pr-4 font-semibold">Typical Sync Cadence</th>
                <th className="py-2 pr-4 font-semibold">User Optimization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                  <span>Apple Calendar (iOS / macOS)</span>
                </td>
                <td className="py-2.5 pr-4 text-emerald-400 font-medium">
                  5 min to 1 hour (Fastest)
                </td>
                <td className="py-2.5 pr-4 text-slate-400">
                  Settings → Accounts → Fetch New Data → Set Auto-refresh to &quot;Every 15 minutes&quot; or &quot;Hourly&quot;.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  <span>Google Calendar</span>
                </td>
                <td className="py-2.5 pr-4 text-amber-400 font-medium">
                  Every 8 to 24 hours
                </td>
                <td className="py-2.5 pr-4 text-slate-400">
                  Google crawlers fetch in the background automatically. Changes show up within a day without manual actions.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Microsoft Outlook (Web / App)</span>
                </td>
                <td className="py-2.5 pr-4 text-emerald-400 font-medium">
                  Every 3 to 12 hours
                </td>
                <td className="py-2.5 pr-4 text-slate-400">
                  Subscribing via WebCal or &quot;Subscribe from Web&quot; ensures automatic background polling.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RFC 5545 Technical Guarantees */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Timezone Handling:</strong> All events are compiled with{' '}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-indigo-300 font-mono">Asia/Dhaka</code> (UTC+6), guaranteeing zero time drift regardless of device locale.
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>RFC 5545 &amp; RFC 7986 Compliant</span>
        </div>
      </div>
    </div>
  );
}
