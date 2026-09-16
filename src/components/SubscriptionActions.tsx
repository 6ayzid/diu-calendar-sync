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
  AlertTriangle,
  Globe,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SectionMeta } from '@/types/schedule';

interface SubscriptionActionsProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
}

export function SubscriptionActions({ section, subSection }: SubscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const saved = localStorage.getItem('diu_calendar_custom_domain');
      if (saved) {
        setCustomDomain(saved);
      }
    }
  }, []);

  const handleSaveDomain = (domain: string) => {
    const trimmed = domain.trim().replace(/\/+$/, '');
    setCustomDomain(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('diu_calendar_custom_domain', trimmed);
      } else {
        localStorage.removeItem('diu_calendar_custom_domain');
      }
    }
  };

  // Build the live API path with .ics extension for strict calendar client compatibility
  const subQuery = subSection !== 'all' ? `?sub=${subSection}` : '';
  const apiPath = `/api/calendar/${section.id}.ics${subQuery}`;

  const isLocalhost = Boolean(
    origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
  );

  // Determine active base URL: Custom Domain > Origin
  const effectiveOrigin =
    customDomain || origin || 'https://schedule.campus.edu';

  // Full HTTPS feed URL
  const httpUrl = `${effectiveOrigin}${apiPath}`;

  // WebCal Protocol URL (forces native calendar apps to open the subscription dialog)
  const webcalUrl = httpUrl.replace(/^https?:\/\//i, 'webcal://');

  // Fresh Sync URL (cache buster to force Google Calendar crawler to fetch fresh feed immediately)
  const freshHttpUrl = `${httpUrl}${httpUrl.includes('?') ? '&' : '?'}v=2`;
  const freshWebcalUrl = freshHttpUrl.replace(/^https?:\/\//i, 'webcal://');

  // Google Calendar direct web-add URL (using webcal scheme for maximum Google Calendar compatibility):
  const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;
  const freshGoogleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(freshWebcalUrl)}`;

  // Outlook Online URL:
  const outlookOnlineUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(httpUrl)}&name=${encodeURIComponent(`CSE Routine: ${section.displayName}`)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoogleCalendarClick = (e: React.MouseEvent) => {
    // If testing on localhost without a public domain configured, show helper modal
    if (isLocalhost && !customDomain) {
      e.preventDefault();
      setShowGoogleModal(true);
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
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              RFC 5545 Live Sync
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
        <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>Permanent iCal Feed URL:</span>
            {customDomain && (
              <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[10px]">
                Custom Host
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setShowDomainInput(!showDomainInput)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-sans cursor-pointer transition-colors"
          >
            <Globe className="h-3 w-3" />
            {customDomain ? 'Edit Domain' : 'Set Live/Vercel URL'}
          </button>
        </div>

        {/* Optional Custom Domain Bar */}
        {showDomainInput && (
          <div className="mb-2.5 p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <span className="text-indigo-300 shrink-0 text-[11px] font-medium">Production Domain:</span>
            <input
              type="text"
              placeholder="e.g. https://diu-calendar-sync.vercel.app"
              value={customDomain}
              onChange={(e) => handleSaveDomain(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {customDomain && (
              <button
                type="button"
                onClick={() => handleSaveDomain('')}
                className="text-[11px] text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-slate-300 shadow-inner">
            <span className="truncate block select-all">{httpUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-md cursor-pointer ${
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
          onClick={handleGoogleCalendarClick}
          className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-850 px-3.5 py-3 text-xs font-medium text-white transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                Google Calendar
                {isLocalhost && !customDomain && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <div className="text-[10px] text-slate-400">Direct Web Add</div>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
        </a>

        {/* Outlook Online Web-Add */}
        <a
          href={outlookOnlineUrl}
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
      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-900/40 bg-indigo-950/30 p-3 text-xs text-indigo-200/90">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-indigo-300 font-semibold">Live Subscription:</strong> Always use{' '}
            <span className="underline font-semibold">Subscribe</span> (WebCal or Add by URL). Room swaps and schedule revisions update automatically in the background on your phone and laptop.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="shrink-0 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 cursor-pointer"
        >
          <span>Google Calendar Guide & Fixes</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Google Calendar Comprehensive Guide & Troubleshooting Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Calendar Guide & Troubleshooting</h3>
                  <p className="text-xs text-slate-400">How to subscribe & fix &quot;Unable to add calendar&quot;</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              {/* Common Error Explanation */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <strong className="text-amber-300 font-semibold text-[13px]">
                    Why Google says &quot;Unable to add calendar. Try again&quot;:
                  </strong>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11.5px] text-amber-100/90 leading-relaxed ml-1">
                  <li>
                    <strong className="text-white">The calendar is ALREADY in your account:</strong> Google strictly rejects adding the exact same calendar URL twice. Look at your left sidebar under <span className="underline font-medium">Other calendars</span> — your classes are likely already there!
                  </li>
                  <li>
                    <strong className="text-white">University / Workspace Account restriction:</strong> If you are logged in with your university account (e.g. <code className="bg-amber-950/70 px-1 py-0.5 rounded text-amber-200">@diu.edu.bd</code>), domain administrators often disable external calendar subscriptions. Switch to your personal <code className="bg-amber-950/70 px-1 py-0.5 rounded text-amber-200">@gmail.com</code> account!
                  </li>
                  <li>
                    <strong className="text-white">Google Crawler Cache:</strong> Google caches feeds for up to 24 hours. If you added an earlier version, Google may take time to refresh, or you can use the Fresh Sync URL below.
                  </li>
                </ul>
              </div>

              {/* Method 1: Google's Official 'Add from URL' (100% Guaranteed) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Method 1: Google&apos;s Official &quot;Add from URL&quot; (100% Guaranteed)
                  </span>
                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[10px] font-semibold">
                    Recommended
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  This bypasses browser redirect issues and allows Google&apos;s servers to directly connect to the live routine:
                </p>
                <div className="space-y-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300"><strong>Step 1:</strong> Copy your live feed URL</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied!' : 'Copy Feed URL'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                    <span className="text-slate-300"><strong>Step 2:</strong> Open Google&apos;s Add by URL page</span>
                    <a
                      href="https://calendar.google.com/calendar/r/settings/addbyurl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open Add by URL</span>
                    </a>
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-slate-400 text-[11px]">
                    <strong>Step 3:</strong> Paste the URL in the box and click <strong className="text-white">&quot;Add calendar&quot;</strong>. Done!
                  </div>
                </div>
              </div>

              {/* Method 2: One-Click Web Add Buttons */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  Method 2: One-Click Web Links
                </span>
                <p className="text-slate-400 text-[11px]">
                  Direct deep links into Google Calendar:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={googleCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center rounded-lg bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 px-3 py-2 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                    <span>Direct Web Add</span>
                  </a>
                  <a
                    href={freshGoogleCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Bypasses Google's 24h cache with a fresh version parameter"
                    className="flex-1 text-center rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 px-3 py-2 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Fresh Sync (Bypass Cache)</span>
                  </a>
                </div>
              </div>

              {/* Mobile app tip */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Phone App Sync Tip:</span> After adding in Google Calendar web, open the Google Calendar app on your phone &rarr; Settings &rarr; Tap the university routine &rarr; make sure <strong className="text-indigo-300">Sync</strong> is turned ON so it syncs immediately!
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
