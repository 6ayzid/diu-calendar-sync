'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Download,
  Info,
  X,
  Zap,
} from 'lucide-react';
import { SectionMeta, ActiveRoutineTarget } from '@/types/schedule';
import { detectDevice, DeviceType, DeviceInfo } from '@/lib/device-detection';
import { SyncVideoGuide } from '@/components/SyncVideoGuide';

interface SubscriptionActionsProps {
  section?: SectionMeta | null;
  subSection: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget | null;
  isOpen?: boolean;
  onClose?: () => void;
}

/* ── Platform SVG Icons (authored, consistent 24×24 viewBox, no emoji) ─── */

function AndroidIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4128 13.8533 8.0818 12 8.0818s-3.5902.331-5.1368.8679L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
    </svg>
  );
}

function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.15c.62-.83 1.05-1.99.91-3.15-1.02.05-2.22.69-2.92 1.52-.58.68-1.08 1.83-.93 2.96 1.13.09 2.32-.5 2.94-1.33z" />
    </svg>
  );
}

function DesktopIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/* ── Inline styles for the entrance animation (no external CSS dependency) ── */
const entranceKeyframes = `
@keyframes subscriptionModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes subscriptionOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

export function SubscriptionActions({
  section,
  subSection,
  activeTarget,
  isOpen = true,
  onClose,
}: SubscriptionActionsProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [selectedTab, setSelectedTab] = useState<DeviceType>('android');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isFaculty = activeTarget?.type === 'faculty';
  const faculty = isFaculty ? activeTarget.faculty : null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOrigin(window.location.origin);
      const info = detectDevice();
      setDeviceInfo(info);
      setSelectedTab(info.deviceType);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Focus the close button when modal opens (keyboard a11y)
  useEffect(() => {
    if (isOpen && onClose && closeRef.current) {
      closeRef.current.focus();
    }
  }, [isOpen, onClose]);

  // Escape to close
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap inside modal
  const handleFocusTrap = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, textarea, select'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen || !onClose) return;
    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen, onClose, handleFocusTrap]);

  // ── URL construction ──────────────────────────────────────────────────
  const subQuery = subSection !== 'all' ? `?sub=${subSection}` : '';
  const apiPath =
    isFaculty && faculty
      ? `/api/calendar?teacher=${faculty.code}.ics`
      : section
      ? `/api/calendar/${section.id}.ics${subQuery}`
      : '';

  const downloadFilename =
    isFaculty && faculty
      ? `${faculty.code}-routine.ics`
      : section
      ? `${section.id}-routine.ics`
      : 'routine.ics';

  const DEFAULT_PUBLIC_URL = 'https://diu-calendar-sync.vercel.app';
  const isLocalhost = Boolean(
    origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
  );
  const publicBaseUrl = origin && !isLocalhost ? origin : DEFAULT_PUBLIC_URL;
  const httpUrl = `${publicBaseUrl}${apiPath}`;
  const webcalUrl = httpUrl.replace(/^https?:\/\//i, 'webcal://');
  const cloudWebcalUrl = `webcal://${publicBaseUrl.replace(/^https?:\/\//i, '')}${apiPath}`;
  const googleSettingsUrl =
    'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';
  const googleRenderUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
    cloudWebcalUrl
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpUrl);
    } catch {
      // Fallback: clipboard API denied
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAndOpenGoogle = async () => {
    await handleCopy();
    window.open(googleSettingsUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  /* ── Tab config: unified accent with device-specific icon ──────────── */
  const tabs: { key: DeviceType; label: string; Icon: typeof AndroidIcon; detected: boolean }[] = [
    { key: 'android', label: 'Android', Icon: AndroidIcon, detected: !!deviceInfo?.isAndroid },
    { key: 'apple', label: 'iPhone / Mac', Icon: AppleIcon, detected: !!deviceInfo?.isApple },
    { key: 'desktop', label: 'PC / Laptop', Icon: DesktopIcon, detected: !!deviceInfo?.isDesktop },
  ];

  const content = (
    <section
      aria-labelledby="subscription-heading"
      className={`space-y-4 ${
        onClose
          ? 'w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-6'
          : ''
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              id="subscription-heading"
              className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Add to Calendar
            </h2>
            <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg dark:text-slate-300 dark:bg-slate-950 dark:border-slate-800 shrink-0">
              {isFaculty && faculty ? (
                faculty.code
              ) : section ? (
                <>
                  {section.id}
                  {subSection !== 'all' && (
                    <span className="text-amber-600 dark:text-amber-400 ml-0.5">
                      ({section.sectionLetter}{subSection})
                    </span>
                  )}
                </>
              ) : (
                'Routine'
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live routine subscription with room updates.
          </p>
        </div>

        {onClose && (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Device Tabs ────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Choose your device"
        className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800"
      >
        {tabs.map(({ key, label, Icon, detected }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selectedTab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setSelectedTab(key)}
            className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedTab === key
                ? 'bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
            {detected && (
              <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 rounded font-mono leading-tight">
                You
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────── ANDROID TAB ─────────────────────────────────── */}
      {selectedTab === 'android' && (
        <div id="panel-android" role="tabpanel" className="space-y-3 py-0.5">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleCopyAndOpenGoogle}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4.5 w-4.5" />
                <span>Link Copied — Opening Google Calendar…</span>
              </>
            ) : (
              <>
                <Copy className="h-4.5 w-4.5" />
                <span>Copy Link &amp; Open Google Calendar</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </>
            )}
          </button>

          {/* Simple 2-step guide */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-white block">
              2 quick steps:
            </span>
            <ol className="list-decimal ml-4 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                Paste into <strong className="text-slate-900 dark:text-white">&quot;URL of calendar&quot;</strong> &rarr; tap <strong className="text-slate-900 dark:text-white">&quot;Add calendar&quot;</strong>.
              </li>
              <li>
                In Google Calendar app: switch <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Sync to ON</strong>.
              </li>
            </ol>
          </div>

          {/* Sync video walkthrough - minimal thumbnail */}
          <SyncVideoGuide defaultExpanded={false} />

          {/* Offline / Samsung fallback */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>Samsung Calendar or offline?</span>
            <a
              href={apiPath}
              download={downloadFilename}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download .ICS
            </a>
          </div>
        </div>
      )}

      {/* ─────────── APPLE TAB ───────────────────────────────────── */}
      {selectedTab === 'apple' && (
        <div id="panel-apple" role="tabpanel" className="space-y-3 py-0.5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AppleIcon className="h-4 w-4 shrink-0" />
              Apple Calendar — 1 Tap
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              1-tap subscription for iPhone, iPad, and Mac.
            </p>
          </div>

          <a
            href={webcalUrl}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 p-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Subscribe in Apple Calendar</span>
          </a>

          <p className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When prompted: tap <strong className="text-slate-900 dark:text-white">&quot;Subscribe&quot;</strong> &rarr; set Auto-refresh to <strong className="text-slate-900 dark:text-white">&quot;Every hour&quot;</strong> &rarr; Add.
          </p>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Prefer Google Calendar on iPhone?
            </span>
            <button
              type="button"
              onClick={() => setSelectedTab('android')}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              View Google steps &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ─────────── DESKTOP TAB ─────────────────────────────────── */}
      {selectedTab === 'desktop' && (
        <div id="panel-desktop" role="tabpanel" className="space-y-3 py-0.5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DesktopIcon className="h-4 w-4 shrink-0" />
              Google Calendar on PC
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Add to your Google account in 1 click.
            </p>
          </div>

          <a
            href={googleRenderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>

          {/* Sync walkthrough for phone notifications */}
          <SyncVideoGuide defaultExpanded={false} />

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <a
              href={webcalUrl}
              className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AppleIcon className="h-3.5 w-3.5" />
              Mac / Outlook
            </a>
            <a
              href={apiPath}
              download={downloadFilename}
              className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Offline .ICS
            </a>
          </div>
        </div>
      )}

      {/* ── Feed URL Footer ────────────────────────────────────────── */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase tracking-wider">
            Feed URL
          </span>
          {copied && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Copied!
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 truncate select-all flex items-center">
            <span className="truncate">{httpUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </section>
  );

  if (onClose) {
    return (
      <>
        <style>{entranceKeyframes}</style>
        <div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-slate-950/70 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] overflow-y-auto print:hidden"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscription-heading"
          style={{ animation: 'subscriptionOverlayIn 150ms ease-out' }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg my-auto"
            style={{ animation: 'subscriptionModalIn 200ms ease-out' }}
          >
            {content}
          </div>
        </div>
      </>
    );
  }

  return content;
}
