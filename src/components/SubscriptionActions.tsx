'use client';

import React, { useState, useEffect } from 'react';
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
import { SectionMeta } from '@/types/schedule';

interface SubscriptionActionsProps {
  section: SectionMeta;
  subSection: '1' | '2' | 'all';
  isOpen?: boolean;
  onClose?: () => void;
}

export function SubscriptionActions({
  section,
  subSection,
  isOpen = true,
  onClose,
}: SubscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

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
  const apiPath = `/api/calendar/${section.id}.ics${subQuery}`;

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
  const freshPublicApiPath = `/api/calendar/${section.id}.ics${subQuery}${subQuery ? '&' : '?'}v=2`;
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
      className={`space-y-5 ${
        onClose
          ? 'w-full max-w-2xl rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 sm:p-7 shadow-2xl'
          : ''
      }`}
    >
      {/* Header with Title, Active Section Context & Close Button */}
      <div className="flex items-start justify-between gap-4 pb-1">
        <div>
          <h2
            id="subscription-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
          >
            <span>Live Calendar Subscription Feed</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-prose leading-relaxed">
            Subscribing creates a permanent dynamic link. Weekly routine revisions and room shifts update automatically on your device.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg dark:text-slate-300 dark:bg-slate-950 dark:border-slate-800">
            <span>Section:</span> <strong className="text-slate-900 dark:text-white">{section.id}</strong>
            {subSection !== 'all' && (
              <span className="text-amber-700 dark:text-amber-400 ml-1">
                ({section.sectionLetter}{subSection})
              </span>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close subscription modal"
              className="flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Action Options: Google Calendar, Apple Calendar, Download .ICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Google Calendar */}
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 p-4 transition-colors flex flex-col justify-between gap-3 min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between">
              <span>Google Calendar</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Android &amp; Web 1-click sync</p>
          </div>
        </a>

        {/* 2. Apple Calendar / Native WebCal */}
        <a
          href={webcalUrl}
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 p-4 transition-colors flex flex-col justify-between gap-3 min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <span className="rounded bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-xs font-mono font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between">
              <span>Apple Calendar</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">iPhone, Mac &amp; Native WebCal</p>
          </div>
        </a>

        {/* 3. Static .ICS Download */}
        <a
          href={apiPath}
          download={`${section.id}-routine.ics`}
          className="group rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:bg-slate-900 dark:hover:border-slate-700 p-4 transition-colors flex flex-col justify-between gap-3 min-h-[110px] cursor-pointer shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/80 border border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
              <Download className="h-4 w-4" />
            </div>
            <span className="rounded bg-slate-200/70 text-slate-700 border border-slate-300 px-2 py-0.5 text-xs font-mono dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
              Offline
            </span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white text-sm flex items-center justify-between">
              <span>Download .ICS</span>
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Static snapshot (no auto-sync)</p>
          </div>
        </a>
      </div>

      {/* Copy Feed URL Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Direct Calendar Feed URL</span>
          <button
            type="button"
            onClick={() => setShowDomainInput(!showDomainInput)}
            aria-expanded={showDomainInput}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
          >
            <Globe className="h-3 w-3" />
            <span>{customDomain ? 'Custom Host' : 'Host Options'}</span>
          </button>
        </div>

        {showDomainInput && (
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-xs flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <span className="text-slate-700 dark:text-slate-300 shrink-0 font-medium">Custom Host:</span>
            <input
              type="text"
              placeholder="e.g. https://diu-calendar-sync.vercel.app"
              value={customDomain}
              onChange={(e) => handleSaveDomain(e.target.value)}
              aria-label="Custom production domain or URL"
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            {customDomain && (
              <button
                type="button"
                onClick={() => handleSaveDomain('')}
                className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 flex items-center">
            <span className="truncate select-all">{httpUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px] shrink-0 shadow-sm border border-emerald-400/30"
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

      {/* Inline Troubleshooting Accordion (No nested modals!) */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowGoogleGuide(!showGoogleGuide)}
          aria-expanded={showGoogleGuide}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>Having trouble adding to Google Calendar?</span>
          </span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
            <span>{showGoogleGuide ? 'Hide Guide' : 'Troubleshooting'}</span>
            {showGoogleGuide ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showGoogleGuide && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {/* Quick Diagnostic Tips */}
            <div className="space-y-1.5 text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>If Google says &quot;Unable to add calendar&quot;:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-1">
                <li>
                  <strong className="text-slate-900 dark:text-white">Already added:</strong> Google rejects duplicate links. Look under <span className="text-slate-900 dark:text-white font-medium">Other calendars</span> in your Google Calendar sidebar.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">University Account blocked:</strong> Campus <code className="text-amber-800 dark:text-amber-300 font-mono">@diu.edu.bd</code> accounts may restrict external feeds. Use your personal <code className="text-amber-800 dark:text-amber-300 font-mono">@gmail.com</code> account instead.
                </li>
              </ul>
            </div>

            {/* Alternative Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              <a
                href="https://calendar.google.com/calendar/r/settings/addbyurl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Official &quot;Add by URL&quot; Page</span>
              </a>

              <a
                href={freshGoogleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bypass Google Cache</span>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto print:hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-heading"
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
