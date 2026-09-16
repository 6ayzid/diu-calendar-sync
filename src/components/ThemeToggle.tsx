'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from './ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: <Sun className="h-3.5 w-3.5" />,
    },
    {
      value: 'system',
      label: 'System Auto',
      icon: <Laptop className="h-3.5 w-3.5" />,
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center justify-center rounded-lg p-1.5 transition-all cursor-pointer min-h-[32px] min-w-[32px] ${
              isActive
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-800 dark:text-emerald-400 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
