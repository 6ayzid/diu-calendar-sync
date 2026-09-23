'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ];

  // On the collapsed trigger button, show only Sun or Moon representing the current active theme
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun;
  const activeLabel = theme === 'system'
    ? `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
    : theme === 'dark'
    ? 'Dark mode'
    : 'Light mode';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label={`Switch theme, currently ${activeLabel}`}
        title={`Theme: ${activeLabel} (click to change)`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-center h-9 w-9 rounded-xl border transition-all cursor-pointer select-none ${
          isOpen
            ? 'border-emerald-500/50 bg-slate-100 dark:border-emerald-500/50 dark:bg-slate-800 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-slate-200 bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
      >
        <ActiveIcon className="h-4 w-4 text-slate-600 dark:text-slate-300 transition-transform duration-200" />
      </button>

      {/* Smoothly animated popup menu */}
      <div
        role="menu"
        aria-label="Theme options"
        className={`absolute right-0 top-full mt-1.5 z-50 w-36 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1 shadow-xl backdrop-blur-md transition-all duration-200 ease-out origin-top-right dark:border-slate-800/90 dark:bg-slate-950/95 ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1.5 pointer-events-none'
        }`}
      >
        <div className="space-y-0.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium dark:text-slate-300 dark:hover:bg-slate-900/80 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{opt.label}</span>
                </div>
                {isActive && (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
