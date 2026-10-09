'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface VersionBadgeProps {
  routineVersion: string;
  onVersionChange?: (newVersion: string) => void;
  className?: string;
}

export function VersionBadge({
  routineVersion = 'v4.1',
  onVersionChange,
  className = '',
}: VersionBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: 'idle' | 'up-to-date' | 'updated' | 'error';
    message?: string;
    newVersion?: string;
  }>({ status: 'idle' });

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('2026-10-02 09:28:00');
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanVersion = (() => {
    const match = (routineVersion || '').match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
    return match ? `v${match[1]}` : routineVersion || 'v4.1';
  })();

  // Close when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Read stored updatedAt from routine_version endpoint once on mount
  useEffect(() => {
    let active = true;
    fetch('/api/routine_version')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.updatedAt) {
          setLastUpdatedAt(data.updatedAt);
        }
      })
      .catch(() => {
        // Ignore fallback
      });
    return () => {
      active = false;
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300);
  };

  const handleToggle = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsExpanded((prev) => !prev);
  };

  const handleCheckUpdate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation(); // Do not collapse pill when clicking action button
      if (isChecking) return;
      setIsChecking(true);
      setCheckResult({ status: 'idle' });

      try {
        const res = await fetch(`/api/check_update?t=${Date.now()}`, {
          method: 'POST',
        });
        const data = await res.json();

        if (data.updatedAt) {
          setLastUpdatedAt(data.updatedAt);
        }

        if (data.updateAvailable && data.version && data.version !== cleanVersion) {
          setCheckResult({
            status: 'updated',
            newVersion: data.version,
            message: `Updated to ${data.version}`,
          });

          // Trigger system-wide update
          if (onVersionChange) {
            onVersionChange(data.version);
          }
        } else {
          setCheckResult({
            status: 'up-to-date',
            message: 'Up to date',
          });
        }
      } catch {
        setCheckResult({
          status: 'error',
          message: 'Error',
        });
      } finally {
        setIsChecking(false);
        setTimeout(() => {
          setCheckResult((prev) => (prev.status === 'updated' ? prev : { status: 'idle' }));
        }, 3500);
      }
    },
    [isChecking, cleanVersion, onVersionChange]
  );

  const formatDisplayTime = (raw: string) => {
    try {
      if (!raw) return 'Morning, Oct 2';
      let dObj = new Date(raw);
      if (isNaN(dObj.getTime())) {
        const parts = raw.trim().split(' ');
        if (parts.length >= 2 && parts[0].includes('-')) {
          const [year, m, d] = parts[0].split('-').map(Number);
          const [h] = (parts[1] || '').split(':').map(Number);
          dObj = new Date(year, m - 1, d, h || 0);
        }
      }
      if (isNaN(dObj.getTime())) {
        return 'Morning, Oct 2';
      }

      const hour = dObj.getHours();
      const monthStr = dObj.toLocaleDateString('en-US', { month: 'short' });
      const day = dObj.getDate();

      let period = 'morning';
      if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 21) period = 'evening';
      else if (hour >= 21 || hour < 5) period = 'night';

      const capitalized = period.charAt(0).toUpperCase() + period.slice(1);
      return `${capitalized}, ${monthStr} ${day}`;
    } catch {
      return 'Morning, Oct 2';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center h-6 select-none shrink-0 ${className}`}
    >
      {/* 1. Static Layout Anchor (Holds exact place so sibling layout never shifts or overlaps) */}
      <div className="invisible h-6 px-2 font-mono text-[10px] sm:text-[11px] font-bold leading-none flex items-center pointer-events-none">
        {cleanVersion}
      </div>

      {/* 2. In-Place Expanding Popup Badge (Blooms in-place, floats with z-50 in front of everything) */}
      <div
        onClick={handleToggle}
        title="Official CSE Department Routine Version (Hover or tap to check updates)"
        className={`absolute top-1/2 -translate-y-1/2 z-50 flex items-center transition-all duration-300 ease-out cursor-pointer select-none rounded-full box-border border ${
          isExpanded
            ? 'left-0 sm:left-1/2 sm:-translate-x-1/2 h-8 px-3 bg-white/95 dark:bg-slate-900/95 border-emerald-400 dark:border-emerald-500 shadow-xl shadow-slate-900/15 dark:shadow-black/70 backdrop-blur-md ring-2 ring-emerald-500/20 dark:ring-emerald-400/25 max-w-[340px] whitespace-nowrap'
            : 'left-0 h-6 px-2 bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/80 shadow-2xs max-w-[65px] overflow-hidden'
        }`}
      >
        {/* Version Tag */}
        <span
          className={`font-mono font-bold tracking-tight shrink-0 transition-all ${
            isExpanded
              ? 'text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400'
              : 'text-[10px] sm:text-[11px] leading-none'
          }`}
        >
          {cleanVersion}
        </span>

        {/* Expanded Popup Content */}
        <div
          className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-out ${
            isExpanded
              ? 'max-w-[260px] opacity-100 ml-1.5'
              : 'max-w-0 opacity-0 ml-0 pointer-events-none'
          }`}
        >
          <span className="text-slate-300 dark:text-slate-600 font-sans select-none leading-none">•</span>

          <span className="text-[10px] sm:text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium leading-none">
            {formatDisplayTime(lastUpdatedAt)}
          </span>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className={`inline-flex items-center gap-1 h-[20px] px-2 rounded-full text-[10px] font-semibold leading-none transition-all shrink-0 cursor-pointer shadow-2xs ${
              checkResult.status === 'up-to-date'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                : checkResult.status === 'updated'
                ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-slate-950 font-bold'
                : checkResult.status === 'error'
                ? 'bg-rose-600 text-white dark:bg-rose-500'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 active:scale-95'
            } disabled:opacity-70`}
          >
            {checkResult.status === 'up-to-date' ? (
              <Check className="w-2.5 h-2.5 shrink-0" />
            ) : (
              <RefreshCw className={`w-2.5 h-2.5 shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
            )}
            <span className="leading-none whitespace-nowrap">
              {isChecking
                ? 'Checking...'
                : checkResult.status === 'up-to-date'
                ? 'Up to date'
                : checkResult.status === 'updated'
                ? checkResult.newVersion || 'Updated'
                : checkResult.status === 'error'
                ? 'Retry'
                : 'Check'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
