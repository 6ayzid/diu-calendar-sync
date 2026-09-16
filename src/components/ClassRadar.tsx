'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  MapPin,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { DayOfWeek, RoutineClass, SectionMeta } from '@/types/schedule';
import { Badge } from '@/components/ui';

interface ClassRadarProps {
  classes: RoutineClass[];
  selectedSection: SectionMeta;
  selectedSubSection?: '1' | '2' | 'all';
  onViewAgendaDay?: (day: DayOfWeek) => void;
}

export function ClassRadar({
  classes,
  selectedSection,
  onViewAgendaDay,
}: ClassRadarProps) {
  // Current Bangladesh time state (updates every 30s)
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute current Dhaka day & minutes
  const dhakaInfo = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);

      const weekdayPart = parts.find((p) => p.type === 'weekday')?.value?.toUpperCase() || '';
      const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const minPart = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const currentMinutes = hourPart * 60 + minPart;

      const dayMap: Record<string, DayOfWeek | 'FRIDAY'> = {
        SATURDAY: 'SATURDAY',
        SUNDAY: 'SUNDAY',
        MONDAY: 'MONDAY',
        TUESDAY: 'TUESDAY',
        WEDNESDAY: 'WEDNESDAY',
        THURSDAY: 'THURSDAY',
        FRIDAY: 'FRIDAY',
      };

      const day = dayMap[weekdayPart] || 'SATURDAY';

      // Friendly 12h time string
      const time12Str = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now);

      return { day, currentMinutes, time12Str, weekdayPart };
    } catch {
      return { day: 'SATURDAY' as DayOfWeek, currentMinutes: 540, time12Str: '09:00 AM', weekdayPart: 'SATURDAY' };
    }
  }, [now]);

  // Today's classes for active section
  const todayClasses =
    dhakaInfo.day === 'FRIDAY'
      ? []
      : classes
          .filter((c) => c.dayOfWeek === dhakaInfo.day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Analyze class radar status
  const radarStatus = (() => {
    if (dhakaInfo.day === 'FRIDAY') {
      return {
        type: 'WEEKEND' as const,
        title: 'Friday Campus Weekend',
        subtitle: 'Campus is closed for Friday. Enjoy your day! Saturday lectures resume at 08:30 AM.',
        activeClass: null,
        nextClass: null,
      };
    }

    if (todayClasses.length === 0) {
      return {
        type: 'NO_CLASSES_TODAY' as const,
        title: `No Classes Today (${dhakaInfo.weekdayPart})`,
        subtitle: `You have no scheduled lectures today for ${selectedSection.displayName}. Enjoy your free day!`,
        activeClass: null,
        nextClass: null,
      };
    }

    const { currentMinutes } = dhakaInfo;

    // Check ongoing class
    for (const c of todayClasses) {
      const [sH, sM] = c.startTime.split(':').map(Number);
      const [eH, eM] = c.endTime.split(':').map(Number);
      const startMin = sH * 60 + sM;
      const endMin = eH * 60 + eM;

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        const remainingMin = endMin - currentMinutes;
        return {
          type: 'HAPPENING_NOW' as const,
          title: 'Class In Session Now',
          subtitle: `${remainingMin} minutes remaining in this period`,
          activeClass: c,
          nextClass: null,
        };
      }
    }

    // Check next upcoming class
    for (const c of todayClasses) {
      const [sH, sM] = c.startTime.split(':').map(Number);
      const startMin = sH * 60 + sM;

      if (startMin > currentMinutes) {
        const diff = startMin - currentMinutes;
        const timeStr = diff >= 60 ? `${Math.floor(diff / 60)}h ${diff % 60}m` : `${diff} mins`;
        return {
          type: 'UPCOMING' as const,
          title: `Next Class in ${timeStr}`,
          subtitle: `Scheduled to start at ${c.startTime} in Room ${c.room.split('(')[0].trim()}`,
          activeClass: null,
          nextClass: c,
        };
      }
    }

    // If past all classes
    return {
      type: 'FINISHED' as const,
      title: "Classes Wrapped Up for Today",
      subtitle: `All ${todayClasses.length} sessions for ${dhakaInfo.weekdayPart} are done. Great work! Preview tomorrow's lineup below.`,
      activeClass: null,
      nextClass: null,
    };
  })();

  const displayedClass = radarStatus.activeClass || radarStatus.nextClass;

  const statusBorderClass =
    radarStatus.type === 'HAPPENING_NOW'
      ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-slate-950 dark:border-emerald-500/35 shadow-xs'
      : radarStatus.type === 'UPCOMING'
      ? 'border-sky-400/50 bg-sky-50/20 dark:bg-slate-950 dark:border-sky-500/30'
      : radarStatus.type === 'WEEKEND'
      ? 'border-amber-400/50 bg-amber-50/20 dark:bg-slate-950 dark:border-amber-500/25'
      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950';

  return (
    <section
      aria-label="Live Class Radar"
      className={`rounded-2xl border p-4 sm:p-6 transition-colors ${statusBorderClass}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Status & Class Details */}
        <div className="space-y-2 flex-1">
          {/* Status Header */}
          <div className="flex flex-wrap items-center gap-2">
            {radarStatus.type === 'HAPPENING_NOW' && (
              <Badge variant="emerald" dot mono size="sm">
                IN SESSION NOW
              </Badge>
            )}
            {radarStatus.type === 'UPCOMING' && (
              <Badge variant="sky" dot mono size="sm">
                NEXT UPCOMING
              </Badge>
            )}
            {radarStatus.type === 'FINISHED' && (
              <Badge variant="slate" dot mono size="sm">
                DAY COMPLETE
              </Badge>
            )}
            {radarStatus.type === 'WEEKEND' && (
              <Badge variant="amber" dot mono size="sm">
                WEEKEND
              </Badge>
            )}
            {radarStatus.type === 'NO_CLASSES_TODAY' && (
              <Badge variant="slate" dot mono size="sm">
                OFF-DAY
              </Badge>
            )}

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              <span>Campus Time: {dhakaInfo.time12Str}</span>
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {radarStatus.title}
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-prose">
            {radarStatus.subtitle}
          </p>

          {/* Active / Next Class Details Strip */}
          {displayedClass && (
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Time:</span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {displayedClass.startTime} – {displayedClass.endTime}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Course:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {displayedClass.courseCode}
                </span>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                  • {displayedClass.courseTitle}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-500 dark:text-slate-400">Faculty:</span>
                <span className="rounded bg-slate-100 border border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 px-1.5 py-0.5 font-semibold">
                  {displayedClass.teacherCode}
                </span>
              </div>

              <Badge
                variant={displayedClass.type === 'Lab' ? 'amber' : 'slate'}
                size="sm"
                mono
              >
                {displayedClass.type === 'Lab' ? 'Lab (3 Hours)' : 'Theory (1.5 Hours)'}
              </Badge>
            </div>
          )}
        </div>

        {/* Right Side: High-Glance Room Badge or Weekend Icon */}
        <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          {displayedClass ? (
            <div className="flex flex-col items-start md:items-end">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>Lecture Hall / Room</span>
              </span>
              <div className="mt-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-sm sm:text-base font-bold font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white">
                <span className="text-emerald-700 dark:text-sky-400 mr-1.5 font-sans font-medium text-xs">Rm</span>
                {displayedClass.room}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-mono">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>{selectedSection.id} Schedule</span>
            </div>
          )}

          {/* Quick Jump Action */}
          {dhakaInfo.day !== 'FRIDAY' && onViewAgendaDay && (
            <button
              type="button"
              onClick={() => onViewAgendaDay(dhakaInfo.day as DayOfWeek)}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-sky-400 hover:text-emerald-800 dark:hover:text-sky-300 underline cursor-pointer transition-colors"
            >
              <span>View {dhakaInfo.weekdayPart.toLowerCase()} list</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
