'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Download,
  Smartphone,
  Share2,
  Info,
} from 'lucide-react';
import { SectionMeta } from '@/types/schedule';

interface SubscriptionActionsProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
}

export function SubscriptionActions({ section, subSection }: SubscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Build the live API path with optional subsection query
  const subQuery = subSection !== 'all' ? `?sub=${subSection}` : '';
  const apiPath = `/api/calendar/${section.id}${subQuery}`;
  
  // Full HTTPS feed URL
  const httpUrl = origin ? `${origin}${apiPath}` : `https://schedule.campus.edu${apiPath}`;

  // WebCal Protocol URL (forces native calendar apps to open the subscription dialog)
  const webcalUrl = httpUrl.replace(/^https?:\/\//i, 'webcal://');

  // Google Calendar direct web-add URL:
  // Uses Google's web render cid parameter with encoded feed URL
  const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(httpUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="h-4 w-4 text-emerald-400" />
              Live Calendar Subscription Feed
            </h2>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-400">
              Auto-Syncing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Subscribing creates a permanent dynamic link. Weekly routine revisions and room shifts update automatically on your device!
          </p>
        </div>

        {/* Selected Section Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">Selected:</span>
          <span className="font-bold text-indigo-400">{section.id}</span>
          {subSection !== 'all' && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              Sub {section.sectionLetter}{subSection}
            </span>
          )}
        </div>
      </div>

      {/* Copyable Feed URL Box */}
      <div className="mt-4">
        <label className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Permanent RFC 5545 iCal Feed URL:</span>
          <span className="text-[10px] text-slate-500 font-mono">text/calendar (Asia/Dhaka)</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-slate-300 shadow-inner">
            <span className="truncate block select-all">{httpUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied Feed URL!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy iCal Feed URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Apple Calendar / iOS / Mac / Outlook One-Click WebCal */}
        <a
          href={webcalUrl}
          className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-3.5 py-3 text-xs font-medium text-white transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200 group-hover:text-white">
                Apple / Outlook
              </div>
              <div className="text-[10px] text-slate-400 font-mono">webcal:// protocol</div>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </a>

        {/* Google Calendar Web-Add */}
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-3.5 py-3 text-xs font-medium text-white transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200 group-hover:text-white">
                Google Calendar
              </div>
              <div className="text-[10px] text-slate-400">Direct Web Add</div>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
        </a>

        {/* Outlook Online Web-Add */}
        <a
          href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(httpUrl)}&name=${encodeURIComponent(`CSE Routine: ${section.displayName}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-3.5 py-3 text-xs font-medium text-white transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200 group-hover:text-white">
                Outlook Live
              </div>
              <div className="text-[10px] text-slate-400">Subscribe on Web</div>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </a>

        {/* Static .ics Download (Fallback) */}
        <a
          href={apiPath}
          download={`${section.id}-routine.ics`}
          className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-3.5 py-3 text-xs font-medium text-slate-300 transition-all hover:border-slate-700 hover:text-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors">
              <Download className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200">
                Download .ics
              </div>
              <div className="text-[10px] text-slate-500">Offline Snapshot</div>
            </div>
          </div>
          <Download className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </a>
      </div>

      {/* Subscription Callout Banner */}
      <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-indigo-900/40 bg-indigo-950/30 p-3 text-xs text-indigo-200/90">
        <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300 font-semibold">Important Auto-Sync Tip:</strong> Always use{' '}
          <span className="underline font-semibold">Subscribe</span> (WebCal or Add by URL) rather than downloading the static .ics file. When professors swap rooms or the Routine Committee releases updates, subscribed devices update in the background automatically!
        </div>
      </div>
    </div>
  );
}
