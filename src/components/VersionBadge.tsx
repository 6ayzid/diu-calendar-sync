'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, Clock, Server } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const handleToggle = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen((prev) => !prev);
  };

  const handleCheckUpdate = useCallback(async () => {
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
          message: `Updated to ${data.version}!`,
          newVersion: data.version,
        });

        // Trigger system-wide update
        if (onVersionChange) {
          onVersionChange(data.version);
        }
      } else {
        setCheckResult({
          status: 'up-to-date',
          message: `Routine is up to date (${cleanVersion}).`,
        });
      }
    } catch {
      setCheckResult({
        status: 'error',
        message: 'Could not contact gateway.',
      });
    } finally {
      setIsChecking(false);
      setTimeout(() => {
        setCheckResult((prev) => (prev.status === 'updated' ? prev : { status: 'idle' }));
      }, 4000);
    }
  }, [isChecking, cleanVersion, onVersionChange]);

  const formatDisplayTime = (raw: string) => {
    try {
      // Input e.g. "2026-10-02 09:28:00"
      const parts = raw.split(' ');
      if (parts.length >= 2) {
        const [year, month, day] = parts[0].split('-').map(Number);
        const [hour, minute] = parts[1].split(':').map(Number);
        const dateObj = new Date(year, month - 1, day, hour, minute);
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ' BST';
      }
    } catch {
      // Fallback
    }
    return raw;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {/* Compact badge trigger */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Official CSE Department Routine Version (Click or hover to inspect updates)"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer select-none border shadow-2xs shrink-0 ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-500 scale-105 shadow-sm'
            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-900/90 border-emerald-300/80 dark:border-emerald-700/60'
        }`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 dark:bg-emerald-400" />
        </span>
        <span>{cleanVersion}</span>
      </button>

      {/* Expanded popover card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Routine Version Details"
          className="absolute left-0 top-full mt-1.5 z-[150] w-72 sm:w-80 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-950/10 dark:shadow-black/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                CSE Class Routine
              </span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
              {cleanVersion}
            </span>
          </div>

          {/* Details */}
          <div className="py-2.5 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <Clock className="w-3 h-3" />
                Department Released:
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200 text-right">
                {formatDisplayTime(lastUpdatedAt)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <Server className="w-3 h-3" />
                Status:
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active &amp; Synced
              </span>
            </div>
          </div>

          {/* Status feedback banner if check completed */}
          {checkResult.status !== 'idle' && (
            <div
              className={`mb-2.5 px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 font-medium transition-all ${
                checkResult.status === 'updated'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : checkResult.status === 'up-to-date'
                  ? 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {checkResult.status === 'updated' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              {checkResult.status === 'up-to-date' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              {checkResult.status === 'error' && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span className="truncate">{checkResult.message}</span>
            </div>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3 h-3 transition-transform ${isChecking ? 'animate-spin' : ''}`}
            />
            <span>{isChecking ? 'Checking upstream...' : 'Check for new version'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
