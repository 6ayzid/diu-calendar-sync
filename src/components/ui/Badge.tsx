import React from 'react';

export type BadgeVariant = 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose' | 'blue' | 'slate';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  mono?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  emerald: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  sky: {
    container: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30',
    dot: 'bg-sky-500',
  },
  indigo: {
    container: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30',
    dot: 'bg-sky-500',
  },
  amber: {
    container: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500',
  },
  rose: {
    container: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30',
    dot: 'bg-rose-500',
  },
  blue: {
    container: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
  },
  slate: {
    container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
    dot: 'bg-slate-400',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-xs sm:text-sm',
};

export function Badge({
  variant = 'slate',
  size = 'sm',
  dot = false,
  pulse = false,
  mono = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        currentVariant.container
      } ${sizeStyles[size]} ${mono ? 'font-mono' : ''} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${currentVariant.dot} ${
            pulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
