'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import { DayOfWeek, RoutineClass, SectionMeta, ActiveRoutineTarget, CompareState, FreeTimeSlot } from '@/types/schedule';
import {
  Clock,
  MapPin,
  FlaskConical,
  LayoutGrid,
  CalendarDays,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getCourseShortTitle } from '@/lib/course-utils';
import { formatTime12, getDhakaClock, DhakaClockState, getUpcomingDays, getCurrentWeekScheduleDays, WeekScheduleDay, ContinuousScheduleDay, getContinuousScheduleDays, timeToMinutes } from '@/lib/time-utils';
import { HOURLY_MARKS, layoutDayEvents, getCurrentTimeTopPercent, PositionedEvent } from '@/lib/timeline-layout';
import { getTimelinePercentForInterval, getTargetLabel } from '@/lib/compare-utils';
import { VersionBadge } from './VersionBadge';
import { ClassEventOverride } from '@/types/events';

interface TimetableGridProps {
  section?: SectionMeta | null;
  subSection?: '1' | '2' | 'all';
  activeTarget?: ActiveRoutineTarget | null;
  classes: RoutineClass[];
  eventOverrides?: ClassEventOverride[];
  compareState?: CompareState;
  secondaryClasses?: RoutineClass[];
  sharedFreeSlotsMap?: Record<DayOfWeek, FreeTimeSlot[]>;
  viewMode?: 'matrix' | 'agenda';
  onViewModeChange?: (mode: 'matrix' | 'agenda') => void;
  activeDay?: DayOfWeek;
  onActiveDayChange?: (day: DayOfWeek) => void;
  routineVersion?: string;
  onVersionChange?: (newVersion: string) => void;
  onOpenFacultyInfo?: (facultyCode: string) => void;
  onOpenSectionInfo?: (sectionId: string) => void;
}

export interface AugmentedPositionedEvent extends PositionedEvent {
  isHighPriority?: boolean;
  isBlockMode?: boolean;
  targetBadge?: string;
  isPrimaryTarget?: boolean;
}

const DAYS: { key: DayOfWeek; label: string; short: string; colIndex: number }[] = [
  { key: 'SATURDAY', label: 'Saturday', short: 'Sat', colIndex: 2 },
  { key: 'SUNDAY', label: 'Sunday', short: 'Sun', colIndex: 3 },
  { key: 'MONDAY', label: 'Monday', short: 'Mon', colIndex: 4 },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue', colIndex: 5 },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed', colIndex: 6 },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu', colIndex: 7 },
];

export function TimetableGrid({
  section,
  activeTarget,
  classes,
  eventOverrides = [],
  compareState,
  secondaryClasses,
  sharedFreeSlotsMap,
  viewMode,
  onViewModeChange,
  onActiveDayChange,
  routineVersion = 'v4.1',
  onVersionChange,
  onOpenFacultyInfo,
  onOpenSectionInfo,
}: TimetableGridProps) {
  const isFaculty = activeTarget?.type === 'faculty';
  const faculty = isFaculty ? activeTarget.faculty : null;

  // Default to agenda on mobile screens (< 768px), matrix (week view) on desktop unless ?view=agenda is passed in URL
  const [internalViewMode, setInternalViewMode] = useState<'matrix' | 'agenda'>('matrix');
  const effectiveViewMode = viewMode !== undefined ? viewMode : internalViewMode;
  const setEffectiveViewMode = onViewModeChange || setInternalViewMode;

  const cleanVersion = (() => {
    const match = (routineVersion || '').match(/\bv?([0-9]+(?:\.[0-9]+)?)\b/i);
    return match ? `v${match[1]}` : (routineVersion || 'v4.1');
  })();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view') || params.get('v');
        if (v === 'agenda' || v === 'matrix') {
          setInternalViewMode(v);
        } else {
          setInternalViewMode(window.innerWidth < 768 ? 'agenda' : 'matrix');
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Determine current day & minute in Asia/Dhaka with 1-second precision
  const [currentDhakaTime, setCurrentDhakaTime] = useState<DhakaClockState>(() => getDhakaClock());

  // Update clock every second for exact minute transitions
  useEffect(() => {
    const updateTime = () => {
      setCurrentDhakaTime(getDhakaClock());
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayDay = currentDhakaTime.day;

  // Continuous multi-week strip (from week -2 to week +8: 11 full weeks = 77 consecutive days)
  const continuousDays = useMemo(() => {
    void currentDhakaTime.day;
    return getContinuousScheduleDays(-2, 8);
  }, [currentDhakaTime.day]);

  // Current visible week offset based on horizontal scroll position
  const [visibleWeekOffset, setVisibleWeekOffset] = useState<number>(0);

  // Matrix view scroll reference and selected day
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Fluid Zoom Level: 1.0 (1 day view) to 7.0 (full week view)
  const [zoomDays, setZoomDays] = useState<number>(7);
  const zoomDaysRef = useRef(zoomDays);
  useEffect(() => {
    zoomDaysRef.current = zoomDays;
  }, [zoomDays]);

  // Compression limit: on mobile (<640px) max comfortable days is 3.0. On desktop/tablet (>=640px) it is 7.0.
  const getCompressionLimit = useCallback(() => {
    if (typeof window === 'undefined') return 7.0;
    return window.innerWidth < 640 ? 3.0 : 7.0;
  }, []);

  const minZoomLimit = 1.0;

  // Measure time column width dynamically from DOM or fallback to CSS defaults
  const getTimeColWidth = useCallback(() => {
    if (!matrixScrollRef.current) return window.innerWidth < 640 ? 64 : 72;
    const timeHeader = matrixScrollRef.current.querySelector<HTMLElement>(
      'div[style*="grid-column: 1"], div[style*="gridColumn: 1"], div[style*="grid-column:1"]'
    );
    if (timeHeader && timeHeader.offsetWidth > 0) {
      return timeHeader.offsetWidth;
    }
    return window.innerWidth < 640 ? 64 : 72;
  }, []);

  // Zoom anchor: keeps the exact day coordinate static under the user's cursor / touch midpoint
  const zoomAnchorRef = useRef<{
    dayUnits: number;
    viewportX: number;
  } | null>(null);

  const prevZoomDaysRef = useRef<number>(zoomDays);

  // Synchronous layout adjustment so the focal point never shifts or drifts
  useIsomorphicLayoutEffect(() => {
    const container = matrixScrollRef.current;
    const prevZoom = prevZoomDaysRef.current;
    prevZoomDaysRef.current = zoomDays;

    if (!container || prevZoom === zoomDays) return;

    const timeWidth = getTimeColWidth();
    const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);

    let anchor = zoomAnchorRef.current;
    if (!anchor) {
      // Fallback: anchor around the center of the visible day area
      const centerOffsetX = dayAreaWidth / 2;
      const centerViewportX = timeWidth + centerOffsetX;
      const dayX = container.scrollLeft + centerOffsetX;
      const dayUnits = Math.max(0, Math.min(continuousDays.length, (dayX * prevZoom) / dayAreaWidth));
      anchor = {
        dayUnits,
        viewportX: centerViewportX,
      };
    }

    const targetOffsetX = Math.max(0, anchor.viewportX - timeWidth);
    const currentDayWidth = dayAreaWidth / zoomDays;
    const newDayX = anchor.dayUnits * currentDayWidth;
    const newScrollLeft = newDayX - targetOffsetX;

    const maxScroll = Math.max(0, dayAreaWidth * (continuousDays.length / zoomDays - 1));
    container.scrollLeft = Math.max(0, Math.min(maxScroll, newScrollLeft));
  }, [zoomDays, getTimeColWidth, continuousDays.length]);

  // Spring animation ref for realistic damped bounce effect
  const springRafRef = useRef<number | null>(null);

  // High-performance spring bounce physics simulation
  const triggerSpringBounce = useCallback((targetZoom: number) => {
    if (springRafRef.current !== null) {
      cancelAnimationFrame(springRafRef.current);
      springRafRef.current = null;
    }

    const stiffness = 220; // Tension / responsiveness
    const damping = 16;    // Damping / friction for organic bounce oscillation
    let current = zoomDaysRef.current;
    let velocity = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      const displacement = current - targetZoom;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = springForce + dampingForce;

      velocity += acceleration * dt;
      current += velocity * dt;

      // When settled, clamp cleanly to target and finish
      if (Math.abs(displacement) < 0.005 && Math.abs(velocity) < 0.02) {
        setZoomDays(targetZoom);
        springRafRef.current = null;
        zoomAnchorRef.current = null;
        return;
      }

      setZoomDays(Math.round(current * 100) / 100);
      springRafRef.current = requestAnimationFrame(step);
    };

    springRafRef.current = requestAnimationFrame(step);
  }, []);

  // Clean up spring animation on unmount
  useEffect(() => {
    return () => {
      if (springRafRef.current !== null) {
        cancelAnimationFrame(springRafRef.current);
      }
    };
  }, []);

  const [selectedGridDay, setSelectedGridDay] = useState<DayOfWeek>(todayDay || 'SATURDAY');

  // Render all 6 days continuously so horizontal scroll / bar movement is always possible
  const visibleGridDays = DAYS;

  const scrollToDay = useCallback((dayKey: DayOfWeek, smooth = true) => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    let targetIdx = continuousDays.findIndex(
      (d) => d.weekOffset === visibleWeekOffset && d.dayKey === dayKey
    );
    if (targetIdx < 0) {
      targetIdx = continuousDays.findIndex(
        (d) => d.weekOffset === 0 && d.dayKey === dayKey
      );
    }
    if (targetIdx >= 0) {
      const timeWidth = window.innerWidth < 640 ? 64 : 72;
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: targetIdx * dayWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [continuousDays, visibleWeekOffset]);

  // Handle window resize compression bounds
  useEffect(() => {
    const handleResize = () => {
      const limit = getCompressionLimit();
      if (zoomDaysRef.current > limit) {
        triggerSpringBounce(limit);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCompressionLimit, triggerSpringBounce]);

  // Update active week and day based on user horizontal scrolling / dragging
  const handleMatrixScroll = () => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!matrixScrollRef.current) return;
      const container = matrixScrollRef.current;
      const timeWidth = window.innerWidth < 640 ? 64 : 72;
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      const scrollLeft = container.scrollLeft;

      const visibleDayIdx = Math.max(
        0,
        Math.min(continuousDays.length - 1, Math.round(scrollLeft / dayWidth))
      );
      const activeDay = continuousDays[visibleDayIdx];
      if (activeDay) {
        if (activeDay.weekOffset !== visibleWeekOffset) {
          setVisibleWeekOffset(activeDay.weekOffset);
        }
        if (activeDay.dayKey !== 'FRIDAY' && activeDay.dayKey !== selectedGridDay) {
          setSelectedGridDay(activeDay.dayKey as DayOfWeek);
          onActiveDayChange?.(activeDay.dayKey as DayOfWeek);
        }
      }
    });
  };

  // Continuous pinch & wheel zoom handlers attached with { passive: false }
  const initialTouchDistRef = useRef<number | null>(null);
  const initialZoomDaysRef = useRef<number>(3);
  const touchAnchorRef = useRef<{
    dayUnits: number;
  } | null>(null);

  useEffect(() => {
    const el = matrixScrollRef.current;
    if (!el) return;

    let wheelTimer: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (springRafRef.current !== null) {
          cancelAnimationFrame(springRafRef.current);
          springRafRef.current = null;
        }

        const rect = el.getBoundingClientRect();
        const viewportX = e.clientX - rect.left;
        const timeWidth = getTimeColWidth();
        const dayAreaWidth = Math.max(1, el.clientWidth - timeWidth);
        const offsetX = Math.max(0, viewportX - timeWidth);

        // Update or establish anchor at the cursor's location
        if (
          !zoomAnchorRef.current ||
          Math.abs(viewportX - zoomAnchorRef.current.viewportX) > 15
        ) {
          const currentDayX = el.scrollLeft + offsetX;
          const dayUnits = Math.max(0, Math.min(continuousDays.length, (currentDayX * zoomDaysRef.current) / dayAreaWidth));
          zoomAnchorRef.current = {
            dayUnits,
            viewportX,
          };
        }

        const delta = (e.deltaY / 100) * 0.4;
        const limit = getCompressionLimit();
        const next = Math.max(0.8, Math.min(6.2, zoomDaysRef.current + delta));
        setZoomDays(Math.round(next * 100) / 100);

        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          const current = zoomDaysRef.current;
          if (current > limit) {
            triggerSpringBounce(limit);
          } else if (current < minZoomLimit) {
            triggerSpringBounce(minZoomLimit);
          } else {
            zoomAnchorRef.current = null;
          }
        }, 150);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (springRafRef.current !== null) {
        cancelAnimationFrame(springRafRef.current);
        springRafRef.current = null;
      }

      if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;

        initialTouchDistRef.current = dist;
        initialZoomDaysRef.current = zoomDaysRef.current;

        const rect = el.getBoundingClientRect();
        const viewportX = midX - rect.left;
        const timeWidth = getTimeColWidth();
        const dayAreaWidth = Math.max(1, el.clientWidth - timeWidth);
        const offsetX = Math.max(0, viewportX - timeWidth);

        const currentDayX = el.scrollLeft + offsetX;
        const dayUnits = Math.max(0, Math.min(continuousDays.length, (currentDayX * zoomDaysRef.current) / dayAreaWidth));

        touchAnchorRef.current = {
          dayUnits,
        };

        zoomAnchorRef.current = {
          dayUnits,
          viewportX,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 2 &&
        initialTouchDistRef.current !== null &&
        touchAnchorRef.current
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const currentMidX = (t0.clientX + t1.clientX) / 2;

        const scale = currentDist / initialTouchDistRef.current;
        const rawZoom = initialZoomDaysRef.current / scale;

        const limit = getCompressionLimit();
        let nextZoom = rawZoom;

        // Over-compression past limit: allow peeking with elastic rubber-band resistance
        if (rawZoom > limit) {
          const over = rawZoom - limit;
          nextZoom = limit + over * 0.45;
          nextZoom = Math.min(6.2, nextZoom);
        } else if (rawZoom < minZoomLimit) {
          const under = minZoomLimit - rawZoom;
          nextZoom = minZoomLimit - under * 0.45;
          nextZoom = Math.max(0.7, nextZoom);
        }

        const rect = el.getBoundingClientRect();
        const currentViewportX = currentMidX - rect.left;

        zoomAnchorRef.current = {
          dayUnits: touchAnchorRef.current.dayUnits,
          viewportX: currentViewportX,
        };

        setZoomDays(Math.round(nextZoom * 100) / 100);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialTouchDistRef.current = null;
        touchAnchorRef.current = null;

        const limit = getCompressionLimit();
        const current = zoomDaysRef.current;

        if (current > limit) {
          triggerSpringBounce(limit);
        } else if (current < minZoomLimit) {
          triggerSpringBounce(minZoomLimit);
        } else {
          zoomAnchorRef.current = null;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [getCompressionLimit, getTimeColWidth, triggerSpringBounce]);

  // Mouse drag-to-scroll for desktop
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select')) return;

    if (!matrixScrollRef.current) return;
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - matrixScrollRef.current.offsetLeft;
    scrollLeftRef.current = matrixScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !matrixScrollRef.current) return;
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
    const x = e.pageX - matrixScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.15;
    matrixScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
    if (isDragging) {
      setTimeout(() => setIsDragging(false), 50);
    }
  };

  const upcomingDays = useMemo(() => {
    void currentDhakaTime.minuteInt;
    return getUpcomingDays(7);
  }, [currentDhakaTime.minuteInt]);


  const relativeWeekLabel = useMemo(() => {
    if (visibleWeekOffset === 0) return null;
    if (visibleWeekOffset === 1) return 'Next week';
    if (visibleWeekOffset === -1) return 'Last week';
    if (visibleWeekOffset > 1) return `+${visibleWeekOffset} wks`;
    return `${visibleWeekOffset} wks`;
  }, [visibleWeekOffset]);

  const scrollToWeek = useCallback((targetOffset: number, smooth = true) => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    const targetDayIdx = continuousDays.findIndex(
      (d) => d.weekOffset === targetOffset && d.dayIndexInWeek === 0
    );
    if (targetDayIdx >= 0) {
      const timeWidth = window.innerWidth < 640 ? 64 : 72;
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: targetDayIdx * dayWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setVisibleWeekOffset(targetOffset);
    }
  }, [continuousDays]);

  const scrollToToday = useCallback((smooth = true) => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    const todayIdx = continuousDays.findIndex((d) => d.isToday);
    const targetIdx =
      todayIdx >= 0
        ? todayIdx
        : continuousDays.findIndex((d) => d.weekOffset === 0 && d.dayIndexInWeek === 0);
    if (targetIdx >= 0) {
      const timeWidth = window.innerWidth < 640 ? 64 : 72;
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: Math.max(0, targetIdx * dayWidth),
        behavior: smooth ? 'smooth' : 'auto',
      });
      setVisibleWeekOffset(0);
    }
  }, [continuousDays]);

  const handlePrevWeek = useCallback(() => {
    scrollToWeek(visibleWeekOffset - 1, true);
  }, [visibleWeekOffset, scrollToWeek]);

  const handleNextWeek = useCallback(() => {
    scrollToWeek(visibleWeekOffset + 1, true);
  }, [visibleWeekOffset, scrollToWeek]);

  const handleResetWeek = useCallback(() => {
    scrollToToday(true);
  }, [scrollToToday]);

  // Initial jump to current week / today on mount
  const initialScrollDoneRef = useRef(false);
  useEffect(() => {
    if (initialScrollDoneRef.current || !matrixScrollRef.current || continuousDays.length === 0) return;
    initialScrollDoneRef.current = true;
    const timer = setTimeout(() => {
      scrollToToday(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [continuousDays, scrollToToday]);

  // Dynamic Notion Calendar Date Title based on visible week
  const notionDateTitle = useMemo(() => {
    if (effectiveViewMode === 'agenda') {
      const firstUpcoming = upcomingDays[0];
      return firstUpcoming ? `${firstUpcoming.monthLong} ${firstUpcoming.year || 2026}` : 'Schedule';
    }

    const currentWeekDays = continuousDays.filter((d) => d.weekOffset === visibleWeekOffset);
    const first = currentWeekDays[0];
    const last = currentWeekDays[currentWeekDays.length - 1];
    if (first && last) {
      if (first.monthShort === last.monthShort) {
        return `${first.monthLong} ${first.year}`;
      }
      return `${first.monthShort} – ${last.monthShort} ${last.year}`;
    }
    return 'October 2026';
  }, [continuousDays, visibleWeekOffset, effectiveViewMode, upcomingDays]);

  // Calendar View Keyboard Shortcuts: W for Week, A for Agenda, Arrows/J/K for Week Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setEffectiveViewMode('matrix');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setEffectiveViewMode('agenda');
      } else if (effectiveViewMode === 'matrix' && (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' || e.key === 'PageDown')) {
        e.preventDefault();
        handleNextWeek();
      } else if (effectiveViewMode === 'matrix' && (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K' || e.key === 'PageUp')) {
        e.preventDefault();
        handlePrevWeek();
      } else if (effectiveViewMode === 'matrix' && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleResetWeek();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveViewMode, setEffectiveViewMode, handleNextWeek, handlePrevWeek, handleResetWeek]);



  const isComparing = !!compareState?.active;
  const isSecondaryPriority = compareState?.priority === 'secondary';
  const isBlockVisible = compareState?.secondaryVisibility === 'block';

  const highTarget = isComparing
    ? (isSecondaryPriority ? compareState.secondaryTarget : compareState.primaryTarget)
    : activeTarget;
  const highBadge = highTarget ? getTargetLabel(highTarget).badge : (section?.id || 'Class');

  const lowTarget = isComparing
    ? (isSecondaryPriority ? compareState.primaryTarget : compareState.secondaryTarget)
    : null;
  const lowBadge = lowTarget ? getTargetLabel(lowTarget).badge : '';

  // Memoize positioned events for each day (Google Calendar Timeline Layout + Compare Mode Support)
  const dayEventsMap = useMemo(() => {
    const map: Record<DayOfWeek, AugmentedPositionedEvent[]> = {
      SATURDAY: [],
      SUNDAY: [],
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
    };

    const highClasses = isComparing
      ? (isSecondaryPriority ? (secondaryClasses || []) : classes)
      : classes;

    const lowClasses = isComparing && isBlockVisible
      ? (isSecondaryPriority ? classes : (secondaryClasses || []))
      : [];

    const primaryIdSet = new Set((classes || []).map((c) => c.id));

    for (const d of DAYS) {
      const highDay = highClasses.filter((c) => c.dayOfWeek === d.key);
      const lowDay = lowClasses.filter((c) => c.dayOfWeek === d.key);

      const highIdSet = new Set(highDay.map((c) => c.id));
      const combined = [...highDay, ...lowDay];

      const positioned = layoutDayEvents(combined);

      map[d.key] = positioned.map((pe) => {
        const isHigh = !isComparing || highIdSet.has(pe.event.id);
        const isPrimary = primaryIdSet.has(pe.event.id);
        return {
          ...pe,
          isHighPriority: isHigh,
          isBlockMode: isComparing && !isHigh,
          targetBadge: isHigh ? highBadge : lowBadge,
          isPrimaryTarget: isPrimary,
        };
      });
    }

    return map;
  }, [classes, secondaryClasses, isComparing, isSecondaryPriority, isBlockVisible, highBadge, lowBadge]);

  // Google Calendar style current time bar metrics
  const isClassHours = currentDhakaTime.totalMinutes >= 480 && currentDhakaTime.totalMinutes <= 1080;
  const currentTimeTopPercent = useMemo(() => {
    return getCurrentTimeTopPercent(currentDhakaTime.totalMinutes);
  }, [currentDhakaTime.totalMinutes]);

  return (
    <section
      aria-labelledby="timetable-heading"
      className="w-full space-y-3 sm:space-y-4 transition-colors"
    >
      {/* Calendar Header & View Switcher (ONLY Week and Agenda) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2.5 print:hidden select-none">
        {/* Mobile Row 1 / Desktop Left: Month Title & (on mobile) View Switcher */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 shrink-0">
              <span>{notionDateTitle}</span>
            </h2>

            {/* Minimal Week Navigation Controls (‹ Today ›) - ONLY in Week view */}
            {effectiveViewMode === 'matrix' && (
              <>
                <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 p-0.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    title="Previous week (or scroll up / ↑)"
                    aria-label="Previous week"
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {visibleWeekOffset !== 0 ? (
                    <button
                      type="button"
                      onClick={handleResetWeek}
                      title="Jump to current week (or press T)"
                      className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleNextWeek}
                    title="Next week (or scroll down / ↓)"
                    aria-label="Next week"
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Relative week badge when not on current week */}
                {relativeWeekLabel && (
                  <span className="hidden md:inline-flex items-center text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-1.5 py-0.5 rounded-full select-none shrink-0">
                    {relativeWeekLabel}
                  </span>
                )}
              </>
            )}

            {/* Desktop-only VersionBadge placement inline with title */}
            <div className="hidden sm:inline-flex items-center shrink-0">
              <VersionBadge
                routineVersion={cleanVersion}
                onVersionChange={onVersionChange}
              />
            </div>
          </div>

          {/* Mobile-only view switcher on Row 1 (Right) */}
          <div className="sm:hidden flex items-center shrink-0">
            <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/90 dark:border-slate-800 dark:bg-slate-950 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setEffectiveViewMode('matrix')}
                aria-pressed={effectiveViewMode === 'matrix'}
                className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer min-h-[28px] ${
                  effectiveViewMode === 'matrix'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Week</span>
              </button>

              <button
                type="button"
                onClick={() => setEffectiveViewMode('agenda')}
                aria-pressed={effectiveViewMode === 'agenda'}
                className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer min-h-[28px] ${
                  effectiveViewMode === 'agenda'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Row 2 / Desktop continuation: VersionBadge (mobile) + Section or Faculty Info */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Mobile-only VersionBadge placement on Row 2 */}
          <div className="sm:hidden inline-flex items-center shrink-0">
            <VersionBadge
              routineVersion={cleanVersion}
              onVersionChange={onVersionChange}
            />
          </div>

          {isFaculty && faculty ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[280px] sm:max-w-none">
              <span className="truncate">{faculty.name}</span>
              {onOpenFacultyInfo && (
                <button
                  type="button"
                  onClick={() => onOpenFacultyInfo(faculty.code)}
                  title={`View details & contact info for ${faculty.name}`}
                  aria-label={`View details for ${faculty.name}`}
                  className="inline-flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ) : section ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium text-slate-500 dark:text-slate-400 max-w-[280px] sm:max-w-none">
              <span className="truncate">{section.displayName}</span>
              {onOpenSectionInfo && (
                <button
                  type="button"
                  onClick={() => onOpenSectionInfo(section.id)}
                  title={`View details for ${section.displayName}`}
                  aria-label={`View details for ${section.displayName}`}
                  className="inline-flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ) : null}
        </div>

        {/* Desktop-only: View switcher on the right */}
        <div className="hidden sm:flex items-center shrink-0">
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/90 dark:border-slate-800 dark:bg-slate-950 p-0.5 shadow-2xs">
            {/* Week View */}
            <button
              type="button"
              onClick={() => setEffectiveViewMode('matrix')}
              aria-pressed={effectiveViewMode === 'matrix'}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[32px] ${
                effectiveViewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Week</span>
            </button>

            {/* Agenda View */}
            <button
              type="button"
              onClick={() => setEffectiveViewMode('agenda')}
              aria-pressed={effectiveViewMode === 'agenda'}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[32px] ${
                effectiveViewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-800 dark:text-white dark:border-slate-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informative notice if faculty member has 0 classes scheduled in active routine */}
      {isFaculty && classes.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              No active classes scheduled for{' '}
              <strong>
                {faculty?.name || activeTarget?.faculty.name} ({activeTarget?.faculty.code})
              </strong>{' '}
              in routine version <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{cleanVersion}</span>.
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. Zoomable Google Calendar Timeline Grid (1 Day to 6 Days Full Week) */}
      {/* ============================================================== */}
      <div className={effectiveViewMode === 'matrix' ? 'block' : 'hidden print:block'}>

        {/* Timetable Grid Container: Sideways scrollable + Draggable scrollbar + Pinch to zoom */}
        <div
          ref={matrixScrollRef}
          onScroll={handleMatrixScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`calendar-matrix-scroll mt-1 sm:mt-2 pb-2 print:overflow-visible print:pb-0 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-default snap-x snap-mandatory'
          }`}
          style={{
            containerType: 'inline-size',
            scrollPaddingLeft: 'var(--col-time, 72px)',
          }}
        >
          <div
            className="timeline-grid-layout relative print:min-w-0"
            style={{
              gridTemplateColumns: `var(--col-time) repeat(${continuousDays.length}, calc((100cqw - var(--col-time)) / ${zoomDays}))`,
              width: `calc(var(--col-time) + ${continuousDays.length} * ((100cqw - var(--col-time)) / ${zoomDays}))`,
            }}
          >
            {/* ROW 1: HEADER - Col 1 is GMT+06 Timezone Label (Topest Corner) */}
            <div
              className="sticky top-0 left-0 z-35 flex items-center justify-end pr-1 sm:pr-2 py-2 bg-slate-50 dark:bg-[#080d1a] border-b border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                GMT+06
              </span>
            </div>

            {/* ROW 1: HEADER - Continuous Day Headers across weeks */}
            {continuousDays.map((d, vIdx) => {
              const isToday = d.isToday;
              const isFriday = d.isFriday;
              const isWeekStart = d.isWeekStart;

              return (
                <div
                  key={`hdr-${d.globalDayIndex}-${d.dayKey}-${d.formattedDate}`}
                  id={`matrix-col-${d.weekOffset}-${d.dayKey}`}
                  className={`sticky top-0 z-26 flex flex-col items-center justify-center py-2 px-1 text-center bg-slate-50 dark:bg-[#080d1a] border-b border-b-slate-200 dark:border-b-slate-800 transition-colors ${
                    isWeekStart
                      ? 'border-l-2 border-l-slate-300 dark:border-l-slate-700'
                      : 'border-l border-l-slate-200 dark:border-l-slate-800'
                  }`}
                  style={{
                    gridColumn: vIdx + 2,
                    gridRow: 1,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: isWeekStart ? 'always' : 'normal',
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isToday
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isFriday
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {zoomDays <= 1.5 ? d.dayLabel : d.dayShort}
                    </span>
                    {(d.dayNumber === '1' || (isWeekStart && vIdx > 0 && continuousDays[vIdx - 1]?.monthShort !== d.monthShort)) && (
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {d.monthShort}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center font-bold text-xs sm:text-sm h-7 w-7 rounded-full ${
                      isToday
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950 shadow-xs'
                        : isFriday
                        ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </div>
              );
            })}

            {/* ROW 2: TIME Y-AXIS LABELS (Col 1 - Topest Element Above Scrolling Cards) */}
            <div
              className="sticky left-0 z-30 relative h-[600px] bg-slate-50 dark:bg-[#080d1a] border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.4)]"
              style={{ gridColumn: 1, gridRow: 2 }}
            >
              {HOURLY_MARKS.map((mark, mIdx) => {
                const isFirst = mIdx === 0;
                const isLast = mIdx === HOURLY_MARKS.length - 1;

                return (
                  <div
                    key={`time-lbl-${mark.hour}`}
                    className={`absolute right-0 pr-1 sm:pr-2 select-none pointer-events-none ${
                      isFirst ? 'top-1 translate-y-0' : isLast ? '-bottom-1 translate-y-0' : '-translate-y-1/2'
                    }`}
                    style={isFirst || isLast ? undefined : { top: `${mark.topPercent}%` }}
                  >
                    <span className="text-[9px] sm:text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {mark.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ROW 2: DAY TIMELINE COLUMNS (Cols 2 to continuousDays.length + 1) */}
            {continuousDays.map((d, vIdx) => {
              const isToday = d.isToday;
              const isFriday = d.isFriday;
              const isWeekStart = d.isWeekStart;
              const positionedEvents = isFriday ? [] : (dayEventsMap[d.dayKey as DayOfWeek] || []);

              return (
                <div
                  key={`timeline-${d.globalDayIndex}-${d.dayKey}-${d.formattedDate}`}
                  className={`relative h-[600px] ${
                    isWeekStart
                      ? 'border-l-2 border-l-slate-300 dark:border-l-slate-700'
                      : 'border-l border-slate-200 dark:border-slate-800/80'
                  } ${isFriday ? 'bg-slate-100/30 dark:bg-slate-900/20' : ''}`}
                  style={{
                    gridColumn: vIdx + 2,
                    gridRow: 2,
                    scrollSnapAlign: 'start',
                    scrollSnapStop: isWeekStart ? 'always' : 'normal',
                  }}
                >
                  {/* Background Hourly Dashed Grid Lines (Google Calendar with dashed guides) */}
                  <div className="absolute inset-0 grid grid-rows-10 pointer-events-none">
                    {Array.from({ length: 10 }).map((_, hIdx) => (
                      <div
                        key={`hour-grid-${d.globalDayIndex}-${hIdx}`}
                        className="border-b border-dashed border-slate-200/85 dark:border-slate-800/75 w-full h-full"
                      />
                    ))}
                  </div>

                  {isFriday ? (
                    /* Friday Weekend Column Content */
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 pointer-events-none select-none">
                      <div className="inline-flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-800/80 dark:bg-slate-900/60 px-3 py-2 text-center shadow-2xs backdrop-blur-xs">
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Weekend
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          No academic classes
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Floating Event Blocks (Google Calendar Style) + Shared Free Time Highlights */
                    <div className="absolute inset-0">
                      {/* Shared Free Time Highlights (Option 1: Solid green with zero text, hover tooltip for details) */}
                      {compareState?.active && compareState.showFreeTimeHighlight && (sharedFreeSlotsMap?.[d.dayKey as DayOfWeek] || []).map((fs, fIdx) => {
                        const { topPercent, heightPercent } = getTimelinePercentForInterval(fs.startMinutes, fs.endMinutes);
                        const durationHours = Math.round((fs.durationMinutes / 60) * 10) / 10;

                        return (
                          <div
                            key={`free-${d.globalDayIndex}-${fIdx}`}
                            title={`Shared Free Time: ${fs.formattedRange} (${durationHours}h)`}
                            className="absolute rounded-lg border border-emerald-700/30 bg-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500 z-0 flex items-center justify-center p-1 pointer-events-auto cursor-default transition-all shadow-xs"
                            style={{
                              top: `calc(${topPercent}% + 2px)`,
                              height: `calc(${heightPercent}% - 4px)`,
                              left: '2px',
                              right: '2px',
                            }}
                          >
                            <span className="font-mono font-bold text-[9.5px] sm:text-[10px] text-white dark:text-emerald-950 tracking-tight select-none">
                              {durationHours}h
                            </span>
                          </div>
                        );
                      })}

                    {/* Off-Day Status: When a day has no classes for high priority or both */}
                    {!positionedEvents.some((pe) => pe.isHighPriority) && !positionedEvents.some((pe) => pe.isBlockMode) && (
                      <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-800/80 dark:bg-slate-900/70 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                          <span>{isComparing ? `Off day for ${highBadge} & ${lowBadge}` : `Off day for ${highBadge}`}</span>
                        </span>
                      </div>
                    )}

                    {!positionedEvents.some((pe) => pe.isHighPriority) && positionedEvents.some((pe) => pe.isBlockMode) && (
                      <div className="absolute top-2 left-2 right-2 z-20 pointer-events-none flex justify-center">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>Off day for {highBadge}</span>
                        </span>
                      </div>
                    )}

                    {positionedEvents.some((pe) => pe.isHighPriority) && !positionedEvents.some((pe) => pe.isBlockMode) && isComparing && (
                      <div className="absolute top-2 left-2 right-2 z-20 pointer-events-none flex justify-center">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                          <span>Off day for {lowBadge}</span>
                        </span>
                      </div>
                    )}

                    {positionedEvents.map((pe) => {
                      const c = pe.event;
                      const cleanCode = c.courseCode.split('(')[0].trim();
                      const durationMins = pe.endMinutes - pe.startMinutes;
                      const compactTime = pe.formattedRange.replace(/\s*–\s*/, '–');

                      // 1. Render Block Mode (Low-Priority Background Routine in Compare Mode)
                      if (pe.isBlockMode) {
                        const blockStyle = pe.isPrimaryTarget
                          ? 'border border-slate-300 bg-slate-200/70 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-600'
                          : 'border border-dashed border-emerald-400/60 bg-emerald-100/50 text-emerald-900 hover:border-emerald-500 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:border-emerald-700';

                        const badgeStyle = pe.isPrimaryTarget
                          ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                          : 'border border-dashed border-emerald-400 bg-emerald-200/70 dark:bg-emerald-900/60 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200';

                        const isBlockLiveNow =
                          isToday &&
                          currentDhakaTime.totalMinutes >= pe.startMinutes &&
                          currentDhakaTime.totalMinutes < pe.endMinutes;

                        const blockLineTopPercent = isBlockLiveNow
                          ? Math.max(
                              0,
                              Math.min(
                                100,
                                ((currentDhakaTime.totalMinutes - pe.startMinutes) /
                                  (pe.endMinutes - pe.startMinutes)) *
                                  100
                              )
                            )
                          : 0;

                        const blockLineTopOffsetPx = (2 - 4 * (blockLineTopPercent / 100)).toFixed(1);

                        return (
                          <div
                            key={`block-${d.globalDayIndex}-${c.id}`}
                            title={`${pe.targetBadge}: ${c.courseCode} (${pe.formattedRange}) in ${c.room}`}
                            className={`absolute rounded-lg overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 select-none z-20 transition-all shadow-2xs opacity-85 hover:opacity-100 ${blockStyle}`}
                            style={{
                              top: `calc(${pe.topPercent}% + 2px)`,
                              height: `calc(${pe.heightPercent}% - 4px)`,
                              left: `calc(${pe.leftPercent}% + 2px)`,
                              width: `calc(${pe.widthPercent}% - 4px)`,
                            }}
                          >
                            {/* Current Time Indicator line inside block mode card (above card bg, below text) */}
                            {isBlockLiveNow && (
                              <div
                                className="absolute left-0 right-0 h-[2px] bg-red-500 dark:bg-red-500 pointer-events-none z-0 -translate-y-1/2 shadow-xs"
                                style={{
                                  top: `calc(${blockLineTopPercent}% - ${blockLineTopOffsetPx}px)`,
                                }}
                              />
                            )}
                            <div className="flex items-center justify-between gap-1 min-w-0 relative z-10">
                              <span className={`font-mono font-bold text-[9px] px-1 py-0.2 rounded shrink-0 ${badgeStyle}`}>
                                {pe.targetBadge}
                              </span>
                              <span className="font-mono font-bold text-[10px] sm:text-[11px] truncate opacity-90">
                                {cleanCode}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] sm:text-[9.5px] font-mono opacity-75 truncate pt-0.5 border-t border-black/10 dark:border-white/10 relative z-10">
                              <span className="truncate">{compactTime}</span>
                              <span className="truncate font-semibold">{c.room.split('(')[0].trim()}</span>
                            </div>
                          </div>
                        );
                      }

                      // 2. Render Full Info Card (High-Priority Active Routine)
                      const isLab = c.type === 'Lab';
                      const shortTitle = getCourseShortTitle(cleanCode, c.courseTitle, isLab);

                      // If shortTitle already contains cleanCode or is identical, do not show cleanCode separately
                      const isCodeSameAsTitle =
                        cleanCode.toUpperCase() === shortTitle.toUpperCase() ||
                        shortTitle.toUpperCase().includes(cleanCode.toUpperCase());
                      const showSeparateCode = cleanCode && !isCodeSameAsTitle;

                      // Determine card theme:
                      // If comparing, BOTH sections are washed out with in-theme dark/muted neutral distinctions; only Free Time is solid primary emerald!
                      // When not comparing, uses the full solid emerald Google Calendar theme.
                      let cardTheme =
                        'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-emerald-950 border border-emerald-700/25 dark:border-emerald-400/40 shadow-xs';
                      let buttonBadgeClass =
                        'bg-black/25 hover:bg-black/40 text-white border-white/20 dark:bg-black/20 dark:hover:bg-black/35 dark:text-emerald-950 dark:border-black/20';
                      let subsectionBadgeClass =
                        'bg-black/25 text-white border-white/20 dark:bg-black/20 dark:text-emerald-950 dark:border-black/20';

                      if (isComparing) {
                        if (pe.isPrimaryTarget) {
                          // Entity 1: Clean washed out slate card with solid border (dark in dark mode!)
                          cardTheme =
                            'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs';
                          buttonBadgeClass =
                            'bg-slate-300/80 hover:bg-slate-400/80 text-slate-800 border-slate-400/40 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600 shadow-2xs';
                          subsectionBadgeClass =
                            'bg-black/10 dark:bg-black/35 text-current border-black/15 dark:border-white/15';
                        } else {
                          // Entity 2: Washed out light green card with dashed border style (dark muted green in dark mode!)
                          cardTheme =
                            'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-200 border-2 border-dashed border-emerald-400/70 dark:border-emerald-700/80 shadow-2xs';
                          buttonBadgeClass =
                            'bg-emerald-200/70 hover:bg-emerald-300/70 text-emerald-950 border-emerald-300/60 dark:bg-emerald-900/70 dark:hover:bg-emerald-800/70 dark:text-emerald-200 dark:border-emerald-700/80 shadow-2xs';
                          subsectionBadgeClass =
                            'bg-black/10 dark:bg-black/35 text-current border-black/15 dark:border-white/15';
                        }
                      }

                      const isLiveNow =
                        isToday &&
                        currentDhakaTime.totalMinutes >= pe.startMinutes &&
                        currentDhakaTime.totalMinutes < pe.endMinutes;

                      const cardLineTopPercent = isLiveNow
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              ((currentDhakaTime.totalMinutes - pe.startMinutes) /
                                (pe.endMinutes - pe.startMinutes)) *
                                100
                            )
                          )
                        : 0;

                      const cardLineTopOffsetPx = (2 - 4 * (cardLineTopPercent / 100)).toFixed(1);

                      return (
                        <div
                          key={`class-${d.globalDayIndex}-${c.id}`}
                          className={`absolute rounded-lg transition-all overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 cursor-pointer select-none group z-20 hover:z-22 ${cardTheme}`}
                          style={{
                            top: `calc(${pe.topPercent}% + 2px)`,
                            height: `calc(${pe.heightPercent}% - 4px)`,
                            left: `calc(${pe.leftPercent}% + 2px)`,
                            width: `calc(${pe.widthPercent}% - 4px)`,
                          }}
                        >
                          {/* Current Time Indicator line inside live card (above card bg, below text) */}
                          {isLiveNow && (
                            <div
                              className="absolute left-0 right-0 h-[2px] bg-red-500 dark:bg-red-500 pointer-events-none z-0 -translate-y-1/2 shadow-xs"
                              style={{
                                top: `calc(${cardLineTopPercent}% - ${cardLineTopOffsetPx}px)`,
                              }}
                            />
                          )}

                          <div className="space-y-0.5 overflow-hidden min-w-0 relative z-10">
                            {/* Line 1: Target Badge (in compare) + Course Title + Optional Code + Subsection Badge */}
                            <div className="flex items-center justify-between gap-1 min-w-0">
                              <div className="flex items-center gap-1 min-w-0 truncate">
                                {isComparing && pe.targetBadge && (
                                  <span
                                    className={`shrink-0 rounded px-1 py-0.2 text-[9px] font-mono font-bold ${
                                      pe.isPrimaryTarget
                                        ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                        : 'bg-emerald-200/70 text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-200 border border-dashed border-emerald-400 dark:border-emerald-700'
                                    }`}
                                  >
                                    {pe.targetBadge}
                                  </span>
                                )}
                                {isLab && (
                                  <FlaskConical className={`h-3 w-3 shrink-0 ${
                                    isComparing
                                      ? pe.isPrimaryTarget
                                        ? 'text-slate-500 dark:text-slate-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-emerald-200 dark:text-emerald-900'
                                  }`} />
                                )}
                                <span className="font-bold tracking-tight text-xs truncate leading-tight">
                                  {shortTitle}
                                </span>
                                {showSeparateCode && zoomDays <= 3.5 && (
                                  <span className="text-[10px] font-mono opacity-80 shrink-0 leading-tight">
                                    {cleanCode}
                                  </span>
                                )}
                              </div>

                              {/* Subsection badge & Event Override Pill (e.g. Quiz) */}
                              <div className="flex items-center gap-1 shrink-0 relative z-10">
                                {(() => {
                                  const cardOverride = eventOverrides.find((ev) => {
                                    if (ev.status === 'CANCELLED') return false;
                                    if (ev.dayOfWeek && ev.dayOfWeek !== d.dayKey) return false;
                                    const cClean = cleanCode.toUpperCase();
                                    const evClean = ev.courseCode.split('(')[0].trim().toUpperCase();
                                    if (cClean !== evClean) return false;
                                    if (ev.startTime && ev.startTime !== c.startTime) return false;
                                    return true;
                                  });

                                  if (!cardOverride) return null;

                                  return (
                                    <span
                                      title={`${cardOverride.title}${cardOverride.description ? `: ${cardOverride.description}` : ''}`}
                                      className="shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold font-mono bg-amber-400 text-amber-950 border border-amber-500/60 shadow-xs animate-pulse relative z-10"
                                    >
                                      📝 QUIZ
                                    </span>
                                  );
                                })()}
                                {!isFaculty && (
                                  c.subSection ? (
                                    <span className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold font-mono border relative z-10 ${subsectionBadgeClass}`}>
                                      {section ? section.sectionLetter : ''}{c.subSection}
                                    </span>
                                  ) : durationMins >= 150 && zoomDays <= 3.5 ? (
                                    <span className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-mono font-bold border relative z-10 ${subsectionBadgeClass}`}>
                                      3h
                                    </span>
                                  ) : null
                                )}
                              </div>
                            </div>

                            {/* Line 2: Time Range (Single Line, Never Wraps, Clean Descenders) */}
                            <div className="text-[10px] sm:text-[10.5px] font-mono font-medium leading-normal opacity-95 truncate whitespace-nowrap">
                              {compactTime}
                            </div>
                          </div>

                          {/* Line 3: Room & Teacher/Section Bottom Row */}
                          <div className={`pt-1 border-t flex items-center justify-between text-[10px] sm:text-[10.5px] font-mono leading-tight gap-1 min-w-0 relative z-10 ${
                            isComparing
                              ? pe.isPrimaryTarget
                                ? 'border-slate-300/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300'
                                : 'border-emerald-300/70 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300'
                              : 'border-black/15 dark:border-black/20'
                          }`}>
                            <span className="flex items-center gap-0.5 font-bold truncate min-w-0">
                              <MapPin className="h-2.5 w-2.5 shrink-0 opacity-80" />
                              <span className="truncate">{c.room.split('(')[0].trim()}</span>
                            </span>
                            {isFaculty ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (c.sectionId) onOpenSectionInfo?.(c.sectionId);
                                }}
                                title={`Click to view info for ${c.sectionId || 'section'}`}
                                className={`shrink-0 rounded px-1 py-0.2 font-bold text-[9.5px] border transition-all cursor-pointer relative z-10 ${buttonBadgeClass}`}
                              >
                                {c.sectionId ? (c.subSection ? `${c.sectionId}${c.subSection}` : c.sectionId) : (c.batch && c.section ? `${c.batch}_${c.section}` : 'Sec')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenFacultyInfo?.(c.teacherCode);
                                }}
                                title={`Click to view info for ${c.teacherCode}`}
                                className={`shrink-0 rounded px-1 py-0.2 font-bold text-[9.5px] border transition-all cursor-pointer relative z-10 ${buttonBadgeClass}`}
                              >
                                {c.teacherCode}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                  {/* Current Time Indicator across Today's column */}
                  {isToday && currentTimeTopPercent !== null && (
                    <>
                      {/* Column Red Line (z-10, behind cards; card's own line at z-0 handles the line inside cards below card text) */}
                      <div
                        className="absolute left-0 right-0 pointer-events-none flex items-center -translate-y-1/2 z-10"
                        style={{ top: `${currentTimeTopPercent}%` }}
                      >
                        <div className="h-[2px] w-full bg-red-500 dark:bg-red-500 shadow-xs" />
                      </div>

                      {/* Current Time Red Dot (z-25, firmly on top of cards, borders, and rounded corners) */}
                      <div
                        className="absolute left-0 pointer-events-none flex items-center -translate-y-1/2 z-25"
                        style={{ top: `${currentTimeTopPercent}%` }}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#080d1a] -ml-1.5 shrink-0 shadow-xs" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Continuous Agenda View (Multi-Day Upcoming Stream) */}
      {/* ============================================================== */}
      <div className={`space-y-4 max-w-2xl mx-auto print:hidden ${effectiveViewMode === 'agenda' ? 'block' : 'hidden'}`}>
        {/* Continuous Stream of Upcoming Days - Google Calendar Schedule Widget Layout */}
        <div className="space-y-4">
          {upcomingDays.map((d) => {
            // Compare mode is ONLY for week view, not on agenda mode.
            const targetBadge = activeTarget ? getTargetLabel(activeTarget).badge : (section?.id || 'Class');

            const dayClassList = d.isFriday
              ? []
              : classes
                  .filter((c) => c.dayOfWeek === d.dayKey)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

            // Standalone indicator if today, during class hours, and before the first class of the day
            const showStandaloneBeforeFirst =
              d.isToday &&
              isClassHours &&
              dayClassList.length > 0 &&
              currentDhakaTime.totalMinutes < timeToMinutes(dayClassList[0].startTime);

            return (
              <div
                key={`agenda-day-${d.dayKey}-${d.formattedDate}`}
                id={`agenda-day-${d.dayKey}`}
                className="flex items-start gap-3 scroll-mt-20 pt-1"
              >
                {/* Left Date Pillar (Google Calendar Schedule Widget style) */}
                <div className="w-12 shrink-0 pt-0.5 text-center flex flex-col items-center">
                  <span
                    className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                      d.isToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d.dayShort}
                  </span>
                  <div
                    className={`mt-0.5 flex items-center justify-center font-bold text-base font-mono ${
                      d.isToday
                        ? 'h-9 w-9 rounded-full bg-emerald-600 text-white shadow-xs'
                        : 'h-9 w-9 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                  {d.isToday && (
                    <span className="mt-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-tight">
                      TODAY
                    </span>
                  )}
                  {d.isFriday && (
                    <span className="mt-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60 px-1 py-0.2 text-[8px] font-mono font-bold tracking-tight">
                      OFF
                    </span>
                  )}
                </div>

                {/* Right Content Column: Stack of Events / Empty Day */}
                <div className="flex-1 min-w-0 space-y-2 pb-3">
                  {/* Standalone Current Time Indicator if before first class today */}
                  {showStandaloneBeforeFirst && (
                    <div className="flex items-center gap-2.5 py-1.5 pointer-events-none select-none my-0.5">
                      <div className="flex items-center px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-mono font-bold tracking-tight shrink-0 shadow-xs">
                        <span>Now {currentDhakaTime.formatted12}</span>
                      </div>
                      <div className="h-[2px] flex-1 bg-red-500 dark:bg-red-500/90 rounded-full shadow-xs" />
                    </div>
                  )}

                  {d.isFriday ? (
                    <div className="py-1.5 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/70 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>Weekend</span>
                      </span>
                    </div>
                  ) : dayClassList.length === 0 ? (
                    <div className="py-1 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/70 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                        <span>Off day for {targetBadge}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayClassList.map((classItem, idx) => {
                        const [startH, startM] = classItem.startTime.split(':').map(Number);
                        const [endH, endM] = classItem.endTime.split(':').map(Number);
                        const classStartMins = startH * 60 + startM;
                        const classEndMins = endH * 60 + endM;
                        const durationMinutes = classEndMins - classStartMins;
                        const isDoubleSlot = durationMinutes >= 150;
                        const isLab = classItem.type === 'Lab';
                        const cleanCourseCode = classItem.courseCode.split('(')[0].trim();
                        const shortTitle = getCourseShortTitle(cleanCourseCode, classItem.courseTitle, isLab);

                        const isLiveNow =
                          d.isToday &&
                          currentDhakaTime.totalMinutes >= classStartMins &&
                          currentDhakaTime.totalMinutes < classEndMins;

                        const classProgress = isLiveNow
                          ? Math.min(
                              100,
                              Math.max(
                                0,
                                ((currentDhakaTime.totalMinutes - classStartMins) /
                                  (classEndMins - classStartMins)) *
                                  100
                              )
                            )
                          : null;

                        const nextClass = dayClassList[idx + 1];
                        const nextClassStartMins = nextClass
                          ? timeToMinutes(nextClass.startTime)
                          : Infinity;

                        // Check if current minute is after this class and before the next
                        const showStandaloneAfterThis =
                          d.isToday &&
                          isClassHours &&
                          currentDhakaTime.totalMinutes >= classEndMins &&
                          currentDhakaTime.totalMinutes < nextClassStartMins;

                        // Solid Google Calendar styling adapting across light (emerald-600) and dark (emerald-500)
                        const cardThemeClass = 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950 border border-emerald-700/25 dark:border-emerald-400/40 shadow-xs';

                        return (
                          <React.Fragment key={`agenda-class-${classItem.id}`}>
                            <div
                              aria-label={`${shortTitle} in Room ${classItem.room}, ${formatTime12(classItem.startTime)} to ${formatTime12(classItem.endTime)}`}
                              className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 transition-all flex flex-col justify-center gap-1.5 ${cardThemeClass} ${
                                isLiveNow ? 'pb-4 sm:pb-4.5' : ''
                              }`}
                            >
                              {/* Class progress bar along bottom edge - inset to prevent clipping on rounded corners */}
                              {isLiveNow && classProgress !== null && (
                                <div className="absolute bottom-2 left-4 right-4 h-1 bg-black/25 dark:bg-black/35 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-white dark:bg-emerald-950 transition-all duration-500 rounded-full"
                                    style={{ width: `${classProgress}%` }}
                                  />
                                </div>
                              )}

                              {/* Line 1: Course Title (Once!), Code & Badges */}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isLab && (
                                    <FlaskConical className="h-3.5 w-3.5 text-emerald-200 dark:text-emerald-900 shrink-0" />
                                  )}
                                  <span className="font-bold text-sm tracking-tight truncate">
                                    {shortTitle}
                                  </span>
                                  <span className="text-xs font-mono font-semibold opacity-80 shrink-0">
                                    {cleanCourseCode}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isDoubleSlot && (
                                    <span className="text-[10px] font-mono font-semibold bg-black/25 text-white border border-white/20 dark:bg-black/15 dark:text-emerald-950 dark:border-black/20 px-1.5 py-0.5 rounded">
                                      3h Lab
                                    </span>
                                  )}
                                  {!isFaculty && classItem.subSection && (
                                    <span className="text-[10px] font-mono font-bold bg-white/20 text-white border border-white/25 dark:bg-black/15 dark:text-emerald-950 dark:border-black/20 px-1.5 py-0.5 rounded">
                                      Sec {section ? section.sectionLetter : ''}{classItem.subSection}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Line 2: Single Compact Meta Row: Time • Room • Faculty/Section */}
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <div className="flex items-center gap-1 shrink-0 font-medium opacity-95">
                                  <Clock className="h-3 w-3 opacity-75" />
                                  <span>
                                    {formatTime12(classItem.startTime)} – {formatTime12(classItem.endTime)}
                                  </span>
                                </div>
                                <span className="opacity-40">•</span>
                                <div className="flex items-center gap-1 shrink-0 opacity-90">
                                  <MapPin className="h-3 w-3 opacity-75" />
                                  <span>{classItem.room.split('(')[0].trim()}</span>
                                </div>
                                <span className="opacity-40">•</span>
                                {isFaculty ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const secId =
                                        classItem.sectionId ||
                                        (classItem.batch && classItem.section
                                          ? `${classItem.batch}_${classItem.section}`
                                          : null);
                                      if (secId) onOpenSectionInfo?.(secId);
                                    }}
                                    title={`Click to view info for ${classItem.sectionId || 'section'}`}
                                    className="opacity-95 font-bold shrink-0 hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                  >
                                    {classItem.sectionId ? (classItem.subSection ? `${classItem.sectionId}${classItem.subSection}` : classItem.sectionId) : (classItem.batch && classItem.section ? `${classItem.batch}_${classItem.section}` : 'Sec')}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenFacultyInfo?.(classItem.teacherCode);
                                    }}
                                    title={`Click to view info for ${classItem.teacherCode}`}
                                    className="opacity-95 font-bold shrink-0 hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                  >
                                    {classItem.teacherCode}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Standalone Current Time Indicator between classes */}
                            {showStandaloneAfterThis && (
                              <div className="flex items-center gap-2.5 py-1.5 pointer-events-none select-none my-0.5">
                                <div className="flex items-center px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-mono font-bold tracking-tight shrink-0 shadow-xs">
                                  <span>Now {currentDhakaTime.formatted12}</span>
                                </div>
                                <div className="h-[2px] flex-1 bg-red-500 dark:bg-red-500/90 rounded-full shadow-xs" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
