'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, ChevronDown, ChevronUp, Play } from 'lucide-react';

interface SyncVideoGuideProps {
  defaultExpanded?: boolean;
  compact?: boolean;
  className?: string;
}

export function SyncVideoGuide({
  defaultExpanded = true,
  compact = false,
  className = '',
}: SyncVideoGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isExpanded && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [isExpanded]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 overflow-hidden transition-all ${className}`}
    >
      {/* Header / Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between p-3 sm:p-3.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-900/60 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Turn on Phone Notifications
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                12s Video
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {isExpanded
                ? 'Settings ➔ DIU Routine ➔ Turn Sync ON'
                : 'Tap to see how to enable sync in Android settings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
          <span>{isExpanded ? 'Hide' : 'Watch'}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Content with Video Player */}
      {isExpanded && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 space-y-3 border-t border-slate-200/80 dark:border-slate-800/80">
          {/* Micro-Copy Instruction */}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-center">
            In Android <strong className="text-slate-900 dark:text-white">Google Calendar app</strong>: tap <strong className="text-slate-900 dark:text-white">Settings (☰)</strong> ➔ select <strong className="text-slate-900 dark:text-white">DIU Routine</strong> ➔ switch <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Sync to ON</strong>.
          </p>

          {/* Video Container (Bigger 9:20 aspect ratio phone mockup) */}
          <div className="flex flex-col items-center">
            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-black shadow-lg ${
                compact ? 'w-[230px] sm:w-[250px]' : 'w-[245px] sm:w-[270px]'
              }`}
            >
              <div className="relative aspect-[9/20] w-full overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  disableRemotePlayback
                  aria-label="Screen recording demonstrating how to enable routine sync: open the Google Calendar app on Android, go to Settings, tap your Google account, select your newly added DIU routine calendar, and toggle the Sync switch to ON."
                  className="h-full w-full object-cover select-none pointer-events-none"
                >
                  <source src="/sync-guide.webm" type="video/webm; codecs=vp9" />
                  <p className="p-4 text-center text-xs text-slate-400">
                    Your browser does not support WebM video playback.
                  </p>
                </video>

                {/* Ambient Video Overlay Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 backdrop-blur-md border border-white/10">
                  <Play className="h-2.5 w-2.5 fill-emerald-400" />
                  <span>Sync Walkthrough</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
