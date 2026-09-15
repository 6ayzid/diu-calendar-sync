import React from 'react';
import { CalendarDays, Clock, Radio } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-md shadow-indigo-500/20">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                CSE Class Schedule Portal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live iCal Feeds
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dept. of Computer Science & Engineering • Version V1.1
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Effective: Sept 09, 2026</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-mono text-slate-400">
            Timezone: Asia/Dhaka (UTC+6)
          </div>
        </div>
      </div>
    </header>
  );
}
