'use client';

import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';

export function SyncExplainer() {
  return (
    <section aria-labelledby="protocol-heading" className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-slate-400" />
        <h2 id="protocol-heading" className="text-base font-bold text-slate-900 dark:text-white">
          Calendar Sync Architecture &amp; Guarantees
        </h2>
      </div>

      {/* Why Live Feeds vs Static Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Live Subscription Feed (Recommended)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 max-w-prose">
            <li className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Automatically syncs weekly routine updates, exam swaps, and room changes.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Uses deterministic UIDs: existing calendar events update in place with zero duplicates.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Zero maintenance required throughout the academic semester.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            <span>Static .ICS Snapshot (Not Recommended for Active Semesters)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 max-w-prose">
            <li className="flex items-start gap-2">
              <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>Becomes obsolete the moment a faculty member adjusts a room or schedule.</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>Re-importing later duplicates every single existing class entry.</span>
            </li>
            <li className="flex items-start gap-2">
              <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>Requires manual re-download and tedious event deletions.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* RFC 5545 Technical Guarantees */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="max-w-prose">
            <strong className="text-slate-800 dark:text-slate-200">Timezone Handling:</strong> All events are compiled with{' '}
            <code className="rounded bg-slate-100 border border-slate-200 px-1 py-0.5 text-slate-800 font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">Asia/Dhaka</code> (UTC+6), guaranteeing zero time drift regardless of device locale.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-mono">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>RFC 5545 &amp; RFC 7986 Compliant</span>
        </div>
      </div>
    </section>
  );
}
