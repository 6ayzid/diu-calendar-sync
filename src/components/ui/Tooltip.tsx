'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({
  content,
  children,
  className = '',
  side = 'top',
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setIsVisible(false);
  }, []);

  // Dismiss tooltip on tap outside on touch devices
  useEffect(() => {
    if (!isVisible) return;

    const handleTouchOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hide();
      }
    };

    document.addEventListener('touchstart', handleTouchOutside, { passive: true });
    document.addEventListener('mousedown', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
      document.removeEventListener('mousedown', handleTouchOutside);
    };
  }, [isVisible, hide]);

  const handleTouchStart = () => {
    isTouchRef.current = true;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    // Short press-and-hold (300ms) to show tooltip on mobile
    touchTimerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    setTimeout(() => {
      isTouchRef.current = false;
    }, 100);
  };

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  if (!content) return children;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => {
        if (!isTouchRef.current) show();
      }}
      onMouseLeave={hide}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none whitespace-nowrap rounded-lg border border-slate-700/80 bg-slate-900/95 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-xl backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/95 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 ${sideClasses}`}
        >
          {content}
          <div
            className={`absolute h-1.5 w-1.5 rotate-45 border-slate-700/80 bg-slate-900/95 dark:border-slate-700/90 dark:bg-slate-900/95 ${
              side === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r'
                : side === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l'
                : side === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r'
                : 'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
            }`}
          />
        </div>
      )}
    </div>
  );
}
