'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Download,
  Smartphone,
  Info,
  AlertTriangle,
  Globe,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget } from '@/types/schedule';

interface SubscriptionActionsProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SubscriptionActions({
  section,
  subSection,
  activeTarget,
  isOpen = true,
  onClose,
}: SubscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  const isFaculty = activeTarget?.type === 'faculty';
  const faculty = isFaculty ? activeTarget.faculty : null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOrigin(window.location.origin);
      const saved = localStorage.getItem('diu_calendar_custom_domain');
      if (saved) {
        setCustomDomain(saved);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
  const apiPath = isFaculty && faculty
    ? `/api/calendar?teacher=${faculty.code}.ics`
    : `/api/calendar/${section.id}.ics${subQuery}`;

  const downloadFilename = isFaculty && faculty
    ? `${faculty.code}-routine.ics`
    : `${section.id}-routine.ics`;

  const DEFAULT_PUBLIC_URL = 'https://diu-calendar-sync.vercel.app';

  const isLocalhost = Boolean(
    origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
  );

  // Determine active base URL: Custom Domain > Origin > Default Vercel
  const effectiveOrigin =
    customDomain || (origin && !isLocalhost ? origin : DEFAULT_PUBLIC_URL);

  // Cloud origin: Google Calendar crawler requires a public internet domain.
  const cloudOrigin =
    customDomain || (isLocalhost ? DEFAULT_PUBLIC_URL : (origin || DEFAULT_PUBLIC_URL));

  // Full HTTPS feed URL
  const httpUrl = `${effectiveOrigin}${apiPath}`;

  // WebCal Protocol URL (forces native calendar apps to open the subscription dialog)
  const webcalUrl = httpUrl.replace(/^https?:\/\//i, 'webcal://');

  // Cloud Feed URLs for Google Calendar
  const cloudWebcalUrl = `webcal://${cloudOrigin.replace(/^https?:\/\//i, '')}${apiPath}`;

  // Fresh Sync URL (cache buster to force Google Calendar crawler to fetch fresh feed immediately)
  const freshPublicApiPath = isFaculty && faculty
    ? `/api/calendar?teacher=${faculty.code}.ics&v=2`
    : `/api/calendar/${section.id}.ics${subQuery}${subQuery ? '&' : '?'}v=2`;
  const freshCloudWebcalUrl = `webcal://${cloudOrigin.replace(/^https?:\/\//i, '')}${freshPublicApiPath}`;

  // Google Calendar direct web-add URL:
  const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${cloudWebcalUrl}`;
  const freshGoogleCalUrl = `https://calendar.google.com/calendar/render?cid=${freshCloudWebcalUrl}`;

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

  if (!isOpen) return null;

  const content = (
    <section
      aria-labelledby="subscription-heading"
      className={`space-y-4 sm:space-y-5 ${
        onClose
          ? 'w-full max-w-2xl rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-7 shadow-2xl'
          : ''
      }`}
    >
      {/* Header: Title + Context badge + Close on same row */}
      <div className="flex items-start justify-between gap-3 pb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2
              id="subscription-heading"
              className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
            >
              Live Calendar Feed
            </h2>
            {/* Section / Faculty badge tight to title on mobile */}
            <div className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg dark:text-slate-300 dark:bg-slate-950 dark:border-slate-800 shrink-0 whitespace-nowrap self-start">
              {isFaculty && faculty ? (
                <>
                  <span className="text-slate-400 font-sans mr-1">Faculty:</span>
                  <strong className="text-emerald-700 dark:text-emerald-300">{faculty.code}</strong>
                </>
              ) : (
                <>
                  <strong className="text-slate-900 dark:text-white">{section.id}</strong>
                  {subSection !== 'all' && (
                    <span className="text-amber-700 dark:text-amber-400 ml-1">
                      ({section.sectionLetter}{subSection})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {isFaculty && faculty
              ? `A permanent live link for ${faculty.name} (${faculty.code}) — schedule updates and room changes sync automatically.`
              : 'A permanent live link — room changes and schedule updates sync to your device automatically.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close subscription modal"
            className="flex items-center justify-center min-h-[40px] min-w-[40px] -mt-0.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 3 Action Cards — horizontal compact rows on mobile, grid on sm+ */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
        {/* 1. Google Calendar */}
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 px-3.5 py-3 sm:p-4 transition-colors flex sm:flex-col sm:justify-between items-center sm:items-start gap-3 sm:gap-3 min-h-[60px] sm:min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 sm:w-full sm:justify-between min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between gap-2">
              <span className="truncate">Google Calendar</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">PC / Desktop Mode</p>
          </div>
          <span className="sm:hidden ml-auto rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shrink-0">
            Live
          </span>
        </a>

        {/* 2. Apple Calendar / Native WebCal */}
        <a
          href={webcalUrl}
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 px-3.5 py-3 sm:p-4 transition-colors flex sm:flex-col sm:justify-between items-center sm:items-start gap-3 sm:gap-3 min-h-[60px] sm:min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 sm:w-full sm:justify-between min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between gap-2">
              <span className="truncate">Apple Calendar</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">iPhone, Mac &amp; WebCal</p>
          </div>
          <span className="sm:hidden ml-auto rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shrink-0">
            Live
          </span>
        </a>

        {/* 3. Static .ICS Download */}
        <a
          href={apiPath}
          download={downloadFilename}
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 px-3.5 py-3 sm:p-4 transition-colors flex sm:flex-col sm:justify-between items-center sm:items-start gap-3 sm:gap-3 min-h-[60px] sm:min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3 sm:w-full sm:justify-between min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 border border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
              <Download className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline rounded bg-slate-200/70 text-slate-700 border border-slate-300 px-2 py-0.5 text-xs font-mono dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
              Offline
            </span>
          </div>
          <div className="flex-1 min-w-0 sm:flex-none">
            <div className="font-semibold text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white text-sm flex items-center justify-between gap-2">
              <span className="truncate">Download .ICS</span>
              <Download className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Static snapshot — no auto-sync</p>
          </div>
          <span className="sm:hidden ml-auto rounded bg-slate-200/70 text-slate-700 border border-slate-300 px-2 py-0.5 text-xs font-mono dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 shrink-0">
            Offline
          </span>
        </a>
      </div>

      {/* Android Device Quick Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 dark:border-amber-500/25 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <Smartphone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 leading-relaxed">
          <span className="font-bold text-amber-950 dark:text-amber-100">Android Users:</span>{' '}
          Adding URLs is not supported inside the Google Calendar phone app. Please subscribe using a{' '}
          <strong className="text-amber-950 dark:text-amber-100">PC / Desktop (recommended)</strong> or open your mobile browser in{' '}
          <strong className="text-amber-950 dark:text-amber-100">Desktop Mode</strong>, then turn on &quot;Sync&quot; in your calendar app settings.{' '}
          <Link
            href="/docs#android-setup"
            className="inline-flex items-center gap-0.5 font-bold text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800 dark:hover:text-emerald-300 ml-1"
          >
            <span>See Guide &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Copy Feed URL Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Direct Calendar Feed URL</span>
          <button
            type="button"
            onClick={() => setShowDomainInput(!showDomainInput)}
            aria-expanded={showDomainInput}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer min-h-[32px]"
          >
            <Globe className="h-3 w-3" />
            <span>{customDomain ? 'Custom Host' : 'Host Options'}</span>
          </button>
        </div>

        {showDomainInput && (
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-xs flex flex-col gap-2">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Custom Host:</span>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                inputMode="url"
                placeholder="https://your-domain.com"
                value={customDomain}
                onChange={(e) => handleSaveDomain(e.target.value)}
                aria-label="Custom production domain or URL"
                className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder-slate-500"
              />
              {customDomain && (
                <button
                  type="button"
                  onClick={() => handleSaveDomain('')}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 flex items-center">
            <span className="truncate select-all">{httpUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className="w-full sm:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px] shrink-0 shadow-sm border border-emerald-400/30"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-950" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-emerald-950" />
                <span>Copy Feed URL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Troubleshooting Accordion */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowGoogleGuide(!showGoogleGuide)}
          aria-expanded={showGoogleGuide}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1.5 cursor-pointer min-h-[36px]"
        >
          <span className="flex items-center gap-1.5 text-left">
            <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Trouble adding to Google Calendar?</span>
          </span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium shrink-0 ml-2">
            <span className="hidden sm:inline">{showGoogleGuide ? 'Hide Guide' : 'Troubleshooting'}</span>
            {showGoogleGuide ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showGoogleGuide && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <div className="space-y-2 leading-relaxed">
              <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>If Google says &quot;Unable to add calendar&quot;:</span>
              </div>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300 ml-5 list-disc">
                <li>
                  <strong className="text-slate-900 dark:text-white">Android phone limitation:</strong>{' '}
                  Google Calendar mobile app has no &quot;Add URL&quot; option. You must add it via{' '}
                  <a
                    href="https://calendar.google.com/calendar/r/settings/addbyurl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-sky-600 dark:text-sky-400 font-mono"
                  >
                    calendar.google.com
                  </a>{' '}
                  on a PC or mobile browser in Desktop site mode, then open the Google Calendar app &rarr; Settings &rarr; turn <strong className="text-slate-900 dark:text-white">Sync ON</strong>.{' '}
                  <Link href="/docs#android-setup" className="font-semibold text-emerald-600 dark:text-emerald-400 underline">
                    Read Guide &rarr;
                  </Link>
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Already added:</strong> Google rejects duplicates.
                  Check <span className="text-slate-900 dark:text-white font-medium">Other calendars</span> in your sidebar.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">University account blocked:</strong>{' '}
                  <span className="font-mono bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700/40 dark:text-amber-300 rounded px-1 py-0.5">@diu.edu.bd</span>{' '}
                  may restrict external feeds. Use your personal{' '}
                  <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 rounded px-1 py-0.5">@gmail.com</span>{' '}
                  instead.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              <a
                href="https://calendar.google.com/calendar/r/settings/addbyurl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Add by URL Page</span>
              </a>

              <a
                href={freshGoogleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bypass Cache</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] overflow-y-auto print:hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-heading"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-auto"
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}
