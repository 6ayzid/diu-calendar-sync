import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2;
}

export function Card({ children, className = '', level = 1, ...props }: CardProps) {
  const bgClass = level === 1 ? 'bg-slate-900' : 'bg-slate-950';
  return (
    <div
      className={`rounded-2xl border border-slate-800 ${bgClass} p-5 sm:p-6 transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  icon,
  className = '',
  as = 'h2',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}) {
  const Tag = as;
  return (
    <Tag className={`text-base font-bold text-white flex items-center gap-2 ${className}`}>
      {icon}
      <span>{children}</span>
    </Tag>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-xs text-slate-400 mt-0.5 ${className}`}>{children}</p>;
}
