import React from 'react';

interface TelemetryPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function TelemetryPill({
  children,
  icon,
  className = '',
  ...props
}: TelemetryPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
