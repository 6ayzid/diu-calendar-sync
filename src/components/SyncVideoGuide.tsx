'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';

interface SyncVideoGuideProps {
  defaultExpanded?: boolean;
  compact?: boolean;
  className?: string;
}

export function SyncVideoGuide({
  defaultExpanded = false,
  compact = false,
  className = '',
}: SyncVideoGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isExpanded && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isExpanded]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 overflow-hidden transition-all ${className}`}
    >
      {/* Collapsed Minimal State: Compact Thumbnail + Play Icon + Single Row */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 p-2.5 text-left transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-900/60 cursor-pointer group"
          aria-label="Watch 12-second phone sync video guide"
        >
          {/* Mini Smartphone Video Thumbnail with Centered Play Button */}
          <div className="relative w-11 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:border-emerald-500/50 transition-all flex items-center justify-center">
            <video
              src="/sync-guide.webm#t=0.001"
              preload="metadata"
              muted
              playsInline
              className="h-full w-full object-cover opacity-75 group-hover:opacity-95 transition-opacity pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/15 transition-colors">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs group-hover:scale-110 transition-transform">
                <Play className="h-2.5 w-2.5 fill-white ml-0.5" />
              </div>
            </div>
          </div>

          {/* Concise Info - Non Repetitive */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Phone Sync Walkthrough
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1 py-0.2 rounded">
                12s
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Settings (☰) ➔ DIU Routine ➔ Sync ON
            </p>
          </div>

          {/* Action indicator */}
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 pr-1">
            <span>Watch</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </button>
      ) : (
        /* Expanded State: Clean, Compact Video Player without Repetitive Copy */
        <div className="p-3 space-y-2.5">
          {/* Header with Title and Close / Hide button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Phone Sync Walkthrough
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                (12s)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span>Hide</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Compact Phone Mockup Video */}
          <div className="flex flex-col items-center">
            <div
              onClick={togglePlay}
              className={`relative overflow-hidden rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-black shadow-md cursor-pointer group ${
                compact ? 'w-[180px] sm:w-[195px]' : 'w-[195px] sm:w-[215px]'
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
                  aria-label="Phone sync walkthrough video"
                  className="h-full w-full object-cover select-none pointer-events-none"
                >
                  <source src="/sync-guide.webm" type="video/webm; codecs=vp9" />
                  <p className="p-4 text-center text-xs text-slate-400">
                    Your browser does not support WebM video playback.
                  </p>
                </video>

                {/* Subtle Overlay Controls on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </div>
                </div>

                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-mono font-medium text-emerald-400 backdrop-blur-md border border-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
