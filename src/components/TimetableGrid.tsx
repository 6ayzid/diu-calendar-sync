'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import { DayOfWeek, RoutineClass, SectionMeta, FacultyMeta, ActiveRoutineTarget, CompareState, FreeTimeSlot } from '@/types/schedule';
import {
  Clock,
  MapPin,
  FlaskConical,
  LayoutGrid,
  CalendarDays,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { getFacultyByCode, registerDynamicFaculty } from '@/data/faculty';
import { getCourseShortTitle } from '@/lib/course-utils';
import { formatTime12, getDhakaClock, DhakaClockState, getUpcomingDays, getCurrentWeekScheduleDays, WeekScheduleDay, ContinuousScheduleDay, getContinuousScheduleDays, timeToMinutes } from '@/lib/time-utils';
import { HOURLY_MARKS, layoutDayEvents, getCurrentTimeTopPercent, PositionedEvent, TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '@/lib/timeline-layout';
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
  override?: ClassEventOverride;
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
  subSection,
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

  // Whether Today is currently present onscreen inside the matrix scroll viewport
  const [isTodayVisible, setIsTodayVisible] = useState<boolean>(true);
  const isTodayVisibleRef = useRef<boolean>(true);

  // Range of day indices currently visible onscreen
  const [visibleDateRange, setVisibleDateRange] = useState<{ startIdx: number; endIdx: number }>(() => {
    const todayIdx = continuousDays.findIndex((d) => d.isToday);
    const start = todayIdx >= 0 ? todayIdx : 0;
    return { startIdx: start, endIdx: Math.min(continuousDays.length - 1, start + 2) };
  });
  const visibleDateRangeRef = useRef(visibleDateRange);

  // Matrix view scroll reference and selected day
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Mouse grab-to-scroll navigation for Week View (desktop mouse grab & drag)
  const isPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const startClientXRef = useRef(0);
  const startClientYRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastClientXRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const velocityXRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const dragJustEndedRef = useRef(false);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tap-to-Grow Expanded Card state (reveals unabbreviated course title, room, teacher & office details)
  const [expandedCard, setExpandedCard] = useState<{
    classItem: RoutineClass;
    isBlockMode?: boolean;
    targetBadge?: string;
    isPrimaryTarget?: boolean;
    dayLabel: string;
    override?: ClassEventOverride;
  } | null>(null);

  const [expandedFacultyDetails, setExpandedFacultyDetails] = useState<FacultyMeta | null>(null);
  const [isLoadingFacultyDetails, setIsLoadingFacultyDetails] = useState<boolean>(false);

  useEffect(() => {
    if (!expandedCard || !expandedCard.classItem.teacherCode) {
      setExpandedFacultyDetails(null);
      setIsLoadingFacultyDetails(false);
      return;
    }

    const code = expandedCard.classItem.teacherCode.trim().toUpperCase();
    const local = getFacultyByCode(code);
    if (local?.room) {
      setExpandedFacultyDetails(local);
      setIsLoadingFacultyDetails(false);
      return;
    }

    setExpandedFacultyDetails(local || null);
    setIsLoadingFacultyDetails(true);

    let isCancelled = false;
    fetch(`/api/faculty/info?code=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && data.faculty) {
          registerDynamicFaculty(data.faculty);
          setExpandedFacultyDetails(data.faculty);
        }
      })
      .catch((err) => {
        console.warn('Expanded card faculty info fetch error:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingFacultyDetails(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [expandedCard]);

  useEffect(() => {
    if (!expandedCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedCard]);

  // Fluid Zoom Level: 1.0 (1 day view) to 7.0 (full week view: 7 grids)
  const [zoomDays, setZoomDays] = useState<number>(7);
  const zoomDaysRef = useRef(zoomDays);
  useEffect(() => {
    zoomDaysRef.current = zoomDays;
  }, [zoomDays]);

  // Compression limit: on mobile (<640px) max comfortable days is 3.0. On desktop/tablet (>=640px) it is 7.0 (7 grids).
  const getCompressionLimit = useCallback(() => {
    if (typeof window === 'undefined') return 7.0;
    return window.innerWidth < 640 ? 3.0 : 7.0;
  }, []);

  const minZoomLimit = 1.0;

  // Cached time column width to avoid expensive layout thrashing (querySelector + offsetWidth) during 60/120fps scrolling
  const timeColWidthRef = useRef<number>(typeof window !== 'undefined' && window.innerWidth < 640 ? 44 : 68);

  const measureTimeColWidth = useCallback(() => {
    if (typeof window === 'undefined') return 68;
    if (matrixScrollRef.current) {
      const timeHeader = matrixScrollRef.current.querySelector<HTMLElement>(
        'div[style*="grid-column: 1"], div[style*="gridColumn: 1"], div[style*="grid-column:1"]'
      );
      if (timeHeader && timeHeader.offsetWidth > 0) {
        timeColWidthRef.current = timeHeader.offsetWidth;
        return timeHeader.offsetWidth;
      }
    }
    const val = window.innerWidth < 640 ? 44 : 68;
    timeColWidthRef.current = val;
    return val;
  }, []);

  const getTimeColWidth = useCallback(() => {
    return timeColWidthRef.current;
  }, []);

  useEffect(() => {
    measureTimeColWidth();
  }, [measureTimeColWidth]);

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
      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: targetIdx * dayWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [continuousDays, visibleWeekOffset, getTimeColWidth]);

  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, []);

  // Update active week, visible day range, and today visibility based on horizontal scrolling / dragging
  const handleMatrixScroll = () => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!matrixScrollRef.current) return;
      const container = matrixScrollRef.current;
      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      const scrollLeft = container.scrollLeft;

      // Identify active week by looking at the day occupying the center of the viewport
      const centerScrollLeft = scrollLeft + dayAreaWidth / 2;
      const centerDayIdx = Math.max(
        0,
        Math.min(continuousDays.length - 1, Math.floor(centerScrollLeft / dayWidth))
      );
      const centerDay = continuousDays[centerDayIdx];

      // Visible day indices range in viewport
      // A day is visible if a meaningful portion (>= 20px) is inside [scrollLeft, scrollLeft + dayAreaWidth]
      const startDayIdx = Math.max(
        0,
        Math.min(continuousDays.length - 1, Math.floor((scrollLeft + 20) / dayWidth))
      );
      const endDayIdx = Math.max(
        0,
        Math.min(
          continuousDays.length - 1,
          Math.floor((scrollLeft + dayAreaWidth - 20) / dayWidth)
        )
      );

      // Check whether Today's column is currently present on screen
      const todayIdx = continuousDays.findIndex((d) => d.isToday);
      const todayOnScreen = todayIdx >= 0 && todayIdx >= startDayIdx && todayIdx <= endDayIdx;

      if (todayOnScreen !== isTodayVisibleRef.current) {
        isTodayVisibleRef.current = todayOnScreen;
        setIsTodayVisible(todayOnScreen);
      }

      if (
        startDayIdx !== visibleDateRangeRef.current.startIdx ||
        endDayIdx !== visibleDateRangeRef.current.endIdx
      ) {
        visibleDateRangeRef.current = { startIdx: startDayIdx, endIdx: endDayIdx };
        setVisibleDateRange({ startIdx: startDayIdx, endIdx: endDayIdx });
      }

      // Left-most visible day for active day selection
      const leftDayIdx = Math.max(
        0,
        Math.min(continuousDays.length - 1, Math.round(scrollLeft / dayWidth))
      );
      const leftDay = continuousDays[leftDayIdx];

      if (centerDay && centerDay.weekOffset !== visibleWeekOffset) {
        setVisibleWeekOffset(centerDay.weekOffset);
      }
      if (leftDay && leftDay.dayKey !== 'FRIDAY' && leftDay.dayKey !== selectedGridDay) {
        setSelectedGridDay(leftDay.dayKey as DayOfWeek);
      }

      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
      scrollEndTimerRef.current = setTimeout(() => {
        if (leftDay && leftDay.dayKey !== 'FRIDAY' && !isPointerDownRef.current && !hasDraggedRef.current) {
          onActiveDayChange?.(leftDay.dayKey as DayOfWeek);
        }
      }, 150);
    });
  };

  // Handle window resize compression bounds
  useEffect(() => {
    const handleResize = () => {
      measureTimeColWidth();
      const limit = getCompressionLimit();
      if (zoomDaysRef.current > limit) {
        triggerSpringBounce(limit);
      }
      handleMatrixScroll();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCompressionLimit, triggerSpringBounce, measureTimeColWidth]);

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
        const next = Math.max(0.8, Math.min(7.2, zoomDaysRef.current + delta));
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
          nextZoom = Math.min(7.2, nextZoom);
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

  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isInitialPositioned, setIsInitialPositioned] = useState(false);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle primary left click (button === 0) for mouse/pen input.
    // Native touch scrolling and multi-touch pinch-to-zoom handle touch devices.
    if (e.button !== 0 || e.pointerType === 'touch') return;
    if (!matrixScrollRef.current) return;

    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    setIsSettling(false);

    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    dragJustEndedRef.current = false;
    startClientXRef.current = e.clientX;
    startClientYRef.current = e.clientY;
    startScrollLeftRef.current = matrixScrollRef.current.scrollLeft;
    lastClientXRef.current = e.clientX;
    lastTimestampRef.current = performance.now();
    velocityXRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !matrixScrollRef.current) return;
    if (e.pointerType === 'touch') return;

    const deltaX = e.clientX - startClientXRef.current;
    const deltaY = e.clientY - startClientYRef.current;

    // Deadband check: don't engage drag for micro-movements < 4px so pure clicks work reliably
    if (!hasDraggedRef.current) {
      if (Math.hypot(deltaX, deltaY) < 4) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
      } catch {
        // Fallback if setPointerCapture is unsupported
      }
      hasDraggedRef.current = true;
      setIsDragging(true);
    }

    e.preventDefault();

    // 1:1 direct anchor grab-to-scroll: grabbed point stays glued under cursor
    const maxScroll = Math.max(0, matrixScrollRef.current.scrollWidth - matrixScrollRef.current.clientWidth);
    const targetScroll = Math.max(0, Math.min(maxScroll, startScrollLeftRef.current - deltaX));
    matrixScrollRef.current.scrollLeft = targetScroll;

    // Track smoothed horizontal velocity (px / ms) for flick momentum
    const now = performance.now();
    const dt = now - lastTimestampRef.current;
    if (dt > 10) {
      const dx = e.clientX - lastClientXRef.current;
      velocityXRef.current = 0.7 * (dx / dt) + 0.3 * velocityXRef.current;
      lastClientXRef.current = e.clientX;
      lastTimestampRef.current = now;
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore
      }
      pointerIdRef.current = null;
    }

    if (hasDraggedRef.current && matrixScrollRef.current) {
      dragJustEndedRef.current = true;
      const container = matrixScrollRef.current;
      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      const v = velocityXRef.current;

      // Notion Calendar smooth snapping:
      // If user flicked with velocity (|v| > 0.35 px/ms), advance 1 day in flick direction
      let targetLeft: number;
      if (Math.abs(v) > 0.35) {
        // v > 0: dragged rightwards -> scroll leftwards (flickDir = -1)
        // v < 0: dragged leftwards -> scroll rightwards (flickDir = +1)
        const flickDir = v > 0 ? -1 : 1;
        const currentGrid = Math.round(container.scrollLeft / dayWidth);
        const targetGrid = Math.max(0, currentGrid + flickDir);
        targetLeft = targetGrid * dayWidth;
      } else {
        // Gentle release: snap to nearest day boundary
        const nearestGrid = Math.round(container.scrollLeft / dayWidth);
        targetLeft = Math.max(0, nearestGrid * dayWidth);
      }

      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
      const clampedTarget = Math.max(0, Math.min(maxScroll, targetLeft));

      container.scrollTo({
        left: clampedTarget,
        behavior: 'smooth',
      });

      setIsDragging(false);
      setIsSettling(true);

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(() => {
        setIsSettling(false);
        settleTimeoutRef.current = null;
      }, 400);

      setTimeout(() => {
        dragJustEndedRef.current = false;
        hasDraggedRef.current = false;
      }, 150);
    } else {
      setIsDragging(false);
      hasDraggedRef.current = false;
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragJustEndedRef.current || hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      dragJustEndedRef.current = false;
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
      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: targetDayIdx * dayWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setVisibleWeekOffset(targetOffset);
    }
  }, [continuousDays, getTimeColWidth]);

  const scrollToToday = useCallback((smooth = true) => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    const todayIdx = continuousDays.findIndex((d) => d.isToday);
    const targetIdx = todayIdx >= 0 ? todayIdx : 0;

    if (targetIdx >= 0) {
      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      container.scrollTo({
        left: Math.max(0, targetIdx * dayWidth),
        behavior: smooth ? 'smooth' : 'auto',
      });
      setVisibleWeekOffset(continuousDays[targetIdx]?.weekOffset ?? 0);
      isTodayVisibleRef.current = true;
      setIsTodayVisible(true);
    }
  }, [continuousDays, getTimeColWidth]);

  const handlePrev = useCallback(() => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    const timeWidth = getTimeColWidth();
    const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
    const dayWidth = dayAreaWidth / zoomDaysRef.current;
    const shift = Math.max(1, Math.round(zoomDaysRef.current));
    container.scrollBy({
      left: -shift * dayWidth,
      behavior: 'smooth',
    });
  }, [getTimeColWidth]);

  const handleNext = useCallback(() => {
    if (!matrixScrollRef.current) return;
    const container = matrixScrollRef.current;
    const timeWidth = getTimeColWidth();
    const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
    const dayWidth = dayAreaWidth / zoomDaysRef.current;
    const shift = Math.max(1, Math.round(zoomDaysRef.current));
    container.scrollBy({
      left: shift * dayWidth,
      behavior: 'smooth',
    });
  }, [getTimeColWidth]);

  const handlePrevWeek = handlePrev;
  const handleNextWeek = handleNext;

  const handleResetWeek = useCallback(() => {
    scrollToToday(true);
  }, [scrollToToday]);

  // Initial jump directly to Today's grid on mount - 0px gap, starts from Today
  const initialScrollDoneRef = useRef(false);
  useEffect(() => {
    if (initialScrollDoneRef.current || !matrixScrollRef.current || continuousDays.length === 0) return;
    const container = matrixScrollRef.current;

    const performInitialScroll = () => {
      if (!container || container.clientWidth < 100) return false;

      // Start directly from the grid of Today
      const todayIdx = continuousDays.findIndex((d) => d.isToday);
      const targetIdx = todayIdx >= 0 ? todayIdx : 0;

      const timeWidth = getTimeColWidth();
      const dayAreaWidth = Math.max(1, container.clientWidth - timeWidth);
      const dayWidth = dayAreaWidth / zoomDaysRef.current;
      const targetLeft = Math.max(0, targetIdx * dayWidth);

      container.scrollLeft = targetLeft;
      setVisibleWeekOffset(continuousDays[targetIdx]?.weekOffset ?? 0);
      initialScrollDoneRef.current = true;
      setIsInitialPositioned(true);

      const startDayIdx = targetIdx;
      const endDayIdx = Math.min(
        continuousDays.length - 1,
        targetIdx + Math.max(1, Math.round(zoomDaysRef.current)) - 1
      );
      visibleDateRangeRef.current = { startIdx: startDayIdx, endIdx: endDayIdx };
      setVisibleDateRange({ startIdx: startDayIdx, endIdx: endDayIdx });
      isTodayVisibleRef.current = true;
      setIsTodayVisible(true);
      return true;
    };

    if (performInitialScroll()) return;

    let rafId: number;
    const checkFrame = () => {
      if (!performInitialScroll()) {
        rafId = requestAnimationFrame(checkFrame);
      }
    };
    rafId = requestAnimationFrame(checkFrame);

    const ro = new ResizeObserver(() => {
      if (performInitialScroll()) {
        ro.disconnect();
      }
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [continuousDays, getTimeColWidth]);

  // Maintain position at Today / Week 0 if toggled from agenda to matrix
  useEffect(() => {
    if (effectiveViewMode === 'matrix' && matrixScrollRef.current) {
      const container = matrixScrollRef.current;
      if (container.clientWidth > 100 && container.scrollLeft === 0) {
        scrollToToday(false);
      }
    }
  }, [effectiveViewMode, scrollToToday]);

  // Dynamic Notion Calendar Date Title based on visible days onscreen
  const notionDateTitle = useMemo(() => {
    if (effectiveViewMode === 'agenda') {
      const firstUpcoming = upcomingDays[0];
      return firstUpcoming ? `${firstUpcoming.monthLong} ${firstUpcoming.year || 2026}` : 'Schedule';
    }

    if (continuousDays.length === 0) return 'October 2026';

    const first = continuousDays[visibleDateRange.startIdx] || continuousDays[0];
    const last = continuousDays[visibleDateRange.endIdx] || first;
    if (first && last) {
      if (first.monthShort === last.monthShort) {
        return `${first.monthLong} ${first.year}`;
      }
      return `${first.monthShort} – ${last.monthShort} ${last.year}`;
    }
    return 'October 2026';
  }, [continuousDays, visibleDateRange, effectiveViewMode, upcomingDays]);

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
      } else if (effectiveViewMode === 'matrix' && (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' || e.key === 'PageDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        handleNext();
      } else if (effectiveViewMode === 'matrix' && (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K' || e.key === 'PageUp' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        handlePrev();
      } else if (effectiveViewMode === 'matrix' && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        scrollToToday(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveViewMode, setEffectiveViewMode, handleNext, handlePrev, scrollToToday]);



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

  // Memoize positioned events and off-grid overrides for each continuous day
  // Any standalone event that fits within the timeline (8 AM - 6 PM) follows the grid!
  const continuousDayEventsMap = useMemo(() => {
    const highClasses = isComparing
      ? (isSecondaryPriority ? (secondaryClasses || []) : classes)
      : classes;

    const lowClasses = isComparing && isBlockVisible
      ? (isSecondaryPriority ? classes : (secondaryClasses || []))
      : [];

    const primaryIdSet = new Set((classes || []).map((c) => c.id));

    const map: Record<
      number,
      {
        positionedEvents: AugmentedPositionedEvent[];
        offGridOverrides: ClassEventOverride[];
      }
    > = {};

    for (const d of continuousDays) {
      if (d.isFriday) {
        map[d.globalDayIndex] = { positionedEvents: [], offGridOverrides: [] };
        continue;
      }

      const highDay = highClasses.filter((c) => c.dayOfWeek === d.dayKey);
      const lowDay = lowClasses.filter((c) => c.dayOfWeek === d.dayKey);

      // Filter active overrides for this specific date
      const activeDayOverrides = (eventOverrides || []).filter((ev) => {
        if (ev.status === 'CANCELLED') return false;
        if (ev.date) {
          const matchesIso = d.isoDate && ev.date.trim() === d.isoDate.trim();
          const dayNum = String(parseInt(ev.date.split('-')[2] || '0', 10));
          const matchesDayNum = d.dayNumber === dayNum && (!ev.dayOfWeek || d.dayKey === ev.dayOfWeek);
          if (!matchesIso && !matchesDayNum) return false;
        } else if (ev.dayOfWeek && ev.dayOfWeek !== d.dayKey) {
          return false;
        }
        return true;
      });

      // Filter by subsection if active
      const filteredDayOverrides = activeDayOverrides.filter((ev) => {
        if (subSection === '1' && (ev.courseCode.includes('O2') || ev.title.includes('O2'))) return false;
        if (subSection === '2' && (ev.courseCode.includes('O1') || ev.title.includes('O1'))) return false;
        return true;
      });

      // An override matches a regular class slot if it shares course code and start time
      const isMatchingRegularClass = (ev: ClassEventOverride) => {
        const evClean = (ev.courseCode || '').split('(')[0].trim().toUpperCase();
        return [...highDay, ...lowDay].some((c) => {
          const cClean = c.courseCode.split('(')[0].trim().toUpperCase();
          if (cClean !== evClean) return false;
          if (ev.startTime && c.startTime && ev.startTime !== c.startTime) return false;
          return true;
        });
      };

      const standaloneOverrides = filteredDayOverrides.filter((ev) => !isMatchingRegularClass(ev));

      // Separate standalone overrides into on-grid (fits in 8 AM - 6 PM timeline) and off-grid (e.g. evening classes >= 18:00)
      const onGridOverrides: ClassEventOverride[] = [];
      const offGridOverrides: ClassEventOverride[] = [];

      for (const ev of standaloneOverrides) {
        if (!ev.startTime) {
          offGridOverrides.push(ev);
          continue;
        }
        const sMin = timeToMinutes(ev.startTime);
        if (isNaN(sMin)) {
          offGridOverrides.push(ev);
          continue;
        }
        const eMin = ev.endTime ? timeToMinutes(ev.endTime) : sMin + 90;
        // Check overlap with timeline bounds (8:00 AM / 480 to 6:00 PM / 1080)
        if (sMin < TIMELINE_END_HOUR * 60 && eMin > TIMELINE_START_HOUR * 60) {
          onGridOverrides.push(ev);
        } else {
          offGridOverrides.push(ev);
        }
      }

      // Create synthetic RoutineClass objects for on-grid overrides so they can be positioned on the grid
      const syntheticHighClasses: { routineClass: RoutineClass; override: ClassEventOverride }[] = onGridOverrides.map((ev) => {
        const isLab = ev.courseCode.toLowerCase().includes('lab') || ev.title.toLowerCase().includes('lab');
        const subSecMatch = ev.courseCode.match(/O([12])/i) || ev.title.match(/O([12])/i);
        const startMin = timeToMinutes(ev.startTime!);
        const endMin = ev.endTime ? timeToMinutes(ev.endTime) : startMin + 90;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const defaultEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const rClass: RoutineClass = {
          id: ev.id,
          batch: section?.batch || '',
          section: section?.sectionLetter || '',
          sectionId: ev.sectionId,
          subSection: subSecMatch ? (subSecMatch[1] as '1' | '2') : null,
          courseCode: ev.courseCode,
          courseTitle: ev.title || ev.courseCode,
          teacherCode: '',
          room: ev.room || 'TBD',
          dayOfWeek: d.dayKey as DayOfWeek,
          startTime: ev.startTime!,
          endTime: ev.endTime || defaultEndTime,
          type: isLab ? 'Lab' : 'Theory',
          color: ev.type === 'quiz' || ev.type === 'ct' ? 'amber' : 'sky',
        };
        return { routineClass: rClass, override: ev };
      });

      const combined = [
        ...highDay,
        ...syntheticHighClasses.map((s) => s.routineClass),
        ...lowDay,
      ];

      const positioned = layoutDayEvents(combined);

      const overrideMap = new Map(syntheticHighClasses.map((s) => [s.routineClass.id, s.override]));
      const highIdSet = new Set([
        ...highDay.map((c) => c.id),
        ...syntheticHighClasses.map((s) => s.routineClass.id),
      ]);

      const positionedEvents: AugmentedPositionedEvent[] = positioned.map((pe) => {
        const override = overrideMap.get(pe.event.id);
        const isHigh = !isComparing || highIdSet.has(pe.event.id);
        const isPrimary = primaryIdSet.has(pe.event.id) || !!override;
        return {
          ...pe,
          isHighPriority: isHigh,
          isBlockMode: isComparing && !isHigh,
          targetBadge: isHigh ? highBadge : lowBadge,
          isPrimaryTarget: isPrimary,
          override,
        };
      });

      map[d.globalDayIndex] = { positionedEvents, offGridOverrides };
    }

    return map;
  }, [
    continuousDays,
    classes,
    secondaryClasses,
    eventOverrides,
    isComparing,
    isSecondaryPriority,
    isBlockVisible,
    highBadge,
    lowBadge,
    subSection,
    section,
  ]);

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
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto sm:flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 shrink-0">
              <span>{notionDateTitle}</span>
            </h2>

            {/* Navigation Controls: Smoothly collapses on Agenda view with gentle 500ms ease */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-out flex items-center gap-1.5 shrink-0 ${
                effectiveViewMode === 'matrix'
                  ? 'max-w-[260px] opacity-100'
                  : 'max-w-0 opacity-0 pointer-events-none'
              }`}
            >
              <div className="inline-flex items-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 p-0.5 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  title="Previous (or scroll left / ←)"
                  aria-label="Previous days"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  title="Next (or scroll right / →)"
                  aria-label="Next days"
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtle, understated "Today" button - gently reveals only when Today is offscreen */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-out flex items-center ${
                  !isTodayVisible
                    ? 'max-w-[70px] opacity-100'
                    : 'max-w-0 opacity-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollToToday(true)}
                  title="Jump to Today (or press T)"
                  aria-label="Jump to Today"
                  className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  Today
                </button>
              </div>

              {/* Relative week badge when not on current week */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-out hidden md:flex items-center ${
                  relativeWeekLabel && !isTodayVisible
                    ? 'max-w-[90px] opacity-100'
                    : 'max-w-0 opacity-0 pointer-events-none'
                }`}
              >
                <span className="inline-flex items-center text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 px-1.5 py-0.5 rounded-md select-none shrink-0 whitespace-nowrap">
                  {relativeWeekLabel}
                </span>
              </div>
            </div>

            {/* Desktop-only VersionBadge placement inline with title */}
            <div className="hidden sm:inline-flex items-center shrink-0 relative z-30">
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

        {/* Mobile Row 2 / Desktop Center: Section or Faculty Indicator (Smooth, slow, subtle glide) */}
        <div
          className={`flex items-center gap-2 flex-wrap min-w-0 transition-all duration-500 ease-out sm:justify-center ${
            effectiveViewMode === 'matrix' ? 'sm:translate-x-1.5' : 'sm:-translate-x-1.5'
          }`}
        >
          {/* Mobile-only VersionBadge placement on Row 2 */}
          <div className="sm:hidden inline-flex items-center shrink-0 relative z-30">
            <VersionBadge
              routineVersion={cleanVersion}
              onVersionChange={onVersionChange}
            />
          </div>

          {isFaculty && faculty ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[280px] sm:max-w-none transition-all duration-500 ease-out">
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
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium text-slate-500 dark:text-slate-400 max-w-[280px] sm:max-w-none transition-all duration-500 ease-out">
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
        <div className="hidden sm:flex items-center justify-end shrink-0 sm:flex-1">
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onClickCapture={handleClickCapture}
          className={`calendar-matrix-scroll mt-1 sm:mt-2 pb-2 print:overflow-visible print:pb-0 ${
            isDragging
              ? 'is-dragging cursor-grabbing select-none'
              : isSettling
              ? 'cursor-grab select-none'
              : isInitialPositioned
              ? 'cursor-grab snap-x snap-proximity'
              : 'cursor-grab'
          }`}
          style={{
            containerType: 'inline-size',
            scrollPaddingLeft: 'var(--col-time, 44px)',
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
                  className={`sticky top-0 z-26 flex flex-col items-center justify-center py-2 px-1 text-center border-b transition-colors ${
                    isToday
                      ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] border-b-emerald-500/40 dark:border-b-emerald-500/40'
                      : 'bg-slate-50 dark:bg-[#080d1a] border-b-slate-200 dark:border-b-slate-800'
                  } ${
                    isWeekStart
                      ? 'border-l-2 border-l-slate-300 dark:border-l-slate-700'
                      : 'border-l border-l-slate-200 dark:border-l-slate-800'
                  }`}
                  style={{
                    gridColumn: vIdx + 2,
                    gridRow: 1,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isToday
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : isFriday
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {zoomDays <= 1.5 ? d.dayLabel : d.dayShort}
                    </span>
                    {(d.dayNumber === '1' || isWeekStart) && (
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {d.monthShort}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center font-bold text-xs sm:text-sm h-7 w-7 rounded-full transition-all ${
                      isToday
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white shadow-xs ring-2 ring-emerald-500/25 dark:ring-emerald-400/30'
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
              const dayData = continuousDayEventsMap[d.globalDayIndex] || {
                positionedEvents: [],
                offGridOverrides: [],
              };
              const positionedEvents = dayData.positionedEvents;
              const dayOffGridOverrides = dayData.offGridOverrides;

              return (
                <div
                  key={`timeline-${d.globalDayIndex}-${d.dayKey}-${d.formattedDate}`}
                  className={`relative h-[600px] ${
                    isWeekStart
                      ? 'border-l-2 border-l-slate-300 dark:border-l-slate-700'
                      : 'border-l border-slate-200 dark:border-slate-800/80'
                  } ${isToday ? 'bg-emerald-500/[0.015] dark:bg-emerald-500/[0.025]' : ''} ${
                    isFriday ? 'bg-slate-100/30 dark:bg-slate-900/20' : ''
                  }`}
                  style={{
                    gridColumn: vIdx + 2,
                    gridRow: 2,
                    scrollSnapAlign: d.isWeekStart ? 'start' : 'none',
                    scrollSnapStop: 'normal',
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
                    /* Subtle Friday Weekend Column Content */
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 pointer-events-none select-none">
                      <div className="inline-flex flex-col items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/60 dark:border-slate-800/60 dark:bg-slate-900/40 px-3 py-2 text-center shadow-2xs backdrop-blur-xs">
                        <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Weekend
                        </span>
                        <span className="text-[9.5px] font-mono text-slate-400/80 dark:text-slate-500/80">
                          No classes
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

                    {/* Off-Day Status: When a day has no classes for high priority or both AND no standalone/off-grid events */}
                    {!positionedEvents.some((pe) => pe.isHighPriority) && !positionedEvents.some((pe) => pe.isBlockMode) && dayOffGridOverrides.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 dark:border-slate-800/80 dark:bg-slate-900/70 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                          <span>{isComparing ? `Off day for ${highBadge} & ${lowBadge}` : `Off day for ${highBadge}`}</span>
                        </span>
                      </div>
                    )}

                    {/* Off-Grid Event Card in Matrix Column (e.g. Evening / Online classes starting >= 18:00 or untimed) */}
                    {dayOffGridOverrides.length > 0 && (
                      <div className="absolute inset-x-1.5 bottom-2 z-20 space-y-1.5 pointer-events-auto">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 px-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                          <span>Evening / Online</span>
                        </div>
                        {dayOffGridOverrides.map((ev) => (
                          <div
                            key={ev.id}
                            title={ev.description || ev.title}
                            onClick={(e) => {
                              if (hasDraggedRef.current || dragJustEndedRef.current) return;
                              e.stopPropagation();
                              setExpandedCard({
                                classItem: {
                                  id: ev.id,
                                  batch: '',
                                  section: '',
                                  sectionId: '',
                                  courseCode: ev.courseCode,
                                  courseTitle: ev.title ? `${ev.courseCode} - ${ev.title}` : ev.courseCode,
                                  teacherCode: '',
                                  room: ev.room || 'Online',
                                  dayOfWeek: d.dayKey as DayOfWeek,
                                  startTime: ev.startTime || '19:00',
                                  endTime: ev.endTime || '20:00',
                                  type: 'Theory',
                                },
                                isBlockMode: false,
                                dayLabel: `${d.dayLabel || d.dayShort}, ${d.monthShort} ${d.dayNumber}`,
                                override: ev,
                              });
                            }}
                            className="rounded-xl border border-sky-300/80 bg-sky-50/95 dark:border-sky-800/80 dark:bg-sky-950/90 backdrop-blur-xs p-2 shadow-xs space-y-1 transition-all hover:scale-[1.01] cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-[11px] text-sky-950 dark:text-sky-100 truncate">
                                {ev.courseCode}
                              </span>
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-sky-400 text-sky-950">
                                {ev.type === 'ct' ? 'CT' : ev.type === 'online' ? 'ONLINE' : (ev.type?.toUpperCase() || 'EVENT')}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug truncate">
                              {ev.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between pt-0.5 border-t border-sky-200/60 dark:border-sky-800/60">
                              <span>{formatTime12(ev.startTime || '19:00')}</span>
                              <span className="text-sky-700 dark:text-sky-300 font-medium truncate">{ev.room || 'Online'}</span>
                            </div>
                          </div>
                        ))}
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
                            title={`Tap to view full info: ${pe.targetBadge} - ${c.courseCode} (${pe.formattedRange}) in ${c.room}`}
                            onClick={(e) => {
                              if (hasDraggedRef.current || dragJustEndedRef.current) return;
                              e.stopPropagation();
                              setExpandedCard({
                                classItem: c,
                                isBlockMode: true,
                                targetBadge: pe.targetBadge,
                                isPrimaryTarget: pe.isPrimaryTarget,
                                dayLabel: `${d.dayLabel || d.dayShort}, ${d.monthShort} ${d.dayNumber}`,
                              });
                            }}
                            className={`absolute rounded-lg overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 select-none z-20 transition-all shadow-2xs opacity-85 hover:opacity-100 cursor-pointer hover:shadow-md hover:scale-[1.01] ${blockStyle}`}
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

                      // 1.5. Render On-Grid Event Override Card (e.g. Daytime Quiz, Makeup, CT)
                      if (pe.override) {
                        const ev = pe.override;
                        const isQuizOrCt = ev.type === 'quiz' || ev.type === 'ct';
                        const isOnline = ev.type === 'online';
                        const badgeLabel = ev.type === 'ct' ? 'CT' : ev.type === 'online' ? 'ONLINE' : (ev.type?.toUpperCase() || 'QUIZ');

                        const isOverrideLiveNow =
                          isToday &&
                          currentDhakaTime.totalMinutes >= pe.startMinutes &&
                          currentDhakaTime.totalMinutes < pe.endMinutes;

                        const overrideLineTopPercent = isOverrideLiveNow
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

                        const overrideLineTopOffsetPx = (2 - 4 * (overrideLineTopPercent / 100)).toFixed(1);

                        const overrideCardTheme = isQuizOrCt
                          ? 'border border-sky-400/80 bg-sky-50/95 dark:border-sky-500/80 dark:bg-sky-950/85 text-sky-950 dark:text-sky-100 shadow-xs hover:border-sky-500 hover:shadow-md'
                          : isOnline
                          ? 'border border-indigo-400/80 bg-indigo-50/95 dark:border-indigo-500/80 dark:bg-indigo-950/85 text-indigo-950 dark:text-indigo-100 shadow-xs hover:border-indigo-500 hover:shadow-md'
                          : 'border border-amber-400/80 bg-amber-50/95 dark:border-amber-500/80 dark:bg-amber-950/85 text-amber-950 dark:text-amber-100 shadow-xs hover:border-amber-500 hover:shadow-md';

                        const badgeClass = isQuizOrCt
                          ? 'bg-sky-400 text-sky-950'
                          : isOnline
                          ? 'bg-indigo-400 text-indigo-950'
                          : 'bg-amber-400 text-amber-950';

                        return (
                          <div
                            key={`override-${d.globalDayIndex}-${ev.id}`}
                            onClick={(e) => {
                              if (hasDraggedRef.current || dragJustEndedRef.current) return;
                              e.stopPropagation();
                              setExpandedCard({
                                classItem: {
                                  ...c,
                                  courseTitle: ev.title ? `${ev.courseCode} - ${ev.title}` : c.courseTitle,
                                  room: ev.room || c.room,
                                },
                                isBlockMode: false,
                                targetBadge: pe.targetBadge,
                                isPrimaryTarget: pe.isPrimaryTarget,
                                dayLabel: `${d.dayLabel || d.dayShort}, ${d.monthShort} ${d.dayNumber}`,
                                override: ev,
                              });
                            }}
                            className={`absolute rounded-xl transition-all overflow-hidden flex flex-col justify-between p-1.5 sm:p-2 cursor-pointer select-none group z-20 hover:z-25 ${overrideCardTheme}`}
                            style={{
                              top: `calc(${pe.topPercent}% + 2px)`,
                              height: `calc(${pe.heightPercent}% - 4px)`,
                              left: `calc(${pe.leftPercent}% + 2px)`,
                              width: `calc(${pe.widthPercent}% - 4px)`,
                            }}
                          >
                            {/* Live progress indicator line */}
                            {isOverrideLiveNow && (
                              <div
                                className="absolute left-0 right-0 h-[2px] bg-red-500 dark:bg-red-500 pointer-events-none z-0 -translate-y-1/2 shadow-xs"
                                style={{
                                  top: `calc(${overrideLineTopPercent}% - ${overrideLineTopOffsetPx}px)`,
                                }}
                              />
                            )}

                            <div className="space-y-0.5 overflow-hidden min-w-0 relative z-10">
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                <span className="font-mono font-bold text-[11px] truncate">
                                  {ev.courseCode}
                                </span>
                                <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              <div className="text-xs font-semibold leading-snug truncate">
                                {ev.title}
                              </div>
                              <div className="text-[10px] font-mono opacity-90 truncate whitespace-nowrap">
                                {compactTime}
                              </div>
                            </div>
                            <div className="pt-0.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono leading-tight min-w-0 relative z-10">
                              <span className="flex items-center gap-0.5 font-bold truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0 opacity-80" />
                                <span className="truncate">{ev.room || 'TBD'}</span>
                              </span>
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
                          onClick={(e) => {
                            if (hasDraggedRef.current || dragJustEndedRef.current) return;
                            if ((e.target as HTMLElement).closest('button')) return;
                            e.stopPropagation();
                            setExpandedCard({
                              classItem: c,
                              isBlockMode: false,
                              targetBadge: pe.targetBadge,
                              isPrimaryTarget: pe.isPrimaryTarget,
                              dayLabel: `${d.dayLabel || d.dayShort}, ${d.monthShort} ${d.dayNumber}`,
                            });
                          }}
                          className={`absolute rounded-lg transition-all overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 cursor-pointer select-none group z-20 hover:z-25 hover:shadow-md ${cardTheme}`}
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
                                    if (ev.date) {
                                      const matchesIso = d.isoDate && ev.date.trim() === d.isoDate.trim();
                                      const dayNum = String(parseInt(ev.date.split('-')[2] || '0', 10));
                                      const matchesDayNum = d.dayNumber === dayNum && (!ev.dayOfWeek || d.dayKey === ev.dayOfWeek);
                                      if (!matchesIso && !matchesDayNum) return false;
                                    } else if (ev.dayOfWeek && ev.dayOfWeek !== d.dayKey) {
                                      return false;
                                    }
                                    const cClean = (cleanCode || c.courseCode || '').split('(')[0].trim().toUpperCase();
                                    const evClean = (ev.courseCode || '').split('(')[0].trim().toUpperCase();
                                    if (cClean !== evClean) return false;
                                    if (ev.startTime && c.startTime && ev.startTime !== c.startTime) return false;
                                    return true;
                                  });

                                  if (!cardOverride) return null;

                                  return (
                                    <span
                                      title={`${cardOverride.title}${cardOverride.description ? `: ${cardOverride.description}` : ''}`}
                                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase shadow-2xs relative z-10 ${
                                        cardOverride.type === 'online'
                                          ? 'bg-sky-400 text-sky-950 border border-sky-500/60'
                                          : 'bg-amber-400 text-amber-950 border border-amber-500/60'
                                      }`}
                                    >
                                      {cardOverride.type === 'ct'
                                        ? 'CT'
                                        : cardOverride.type === 'online'
                                        ? 'ONLINE'
                                        : (cardOverride.type?.toUpperCase() || 'QUIZ')}
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
                            {(() => {
                              const cardTarget = isComparing
                                ? (pe.isPrimaryTarget ? compareState?.primaryTarget : compareState?.secondaryTarget)
                                : activeTarget;
                              const isCardFromFaculty = cardTarget?.type === 'faculty';

                              if (isCardFromFaculty) {
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const sId = c.sectionId || (c.batch && c.section ? `${c.batch}_${c.section}` : null);
                                      if (sId) onOpenSectionInfo?.(sId);
                                    }}
                                    title={`Click to view info for ${c.sectionId || 'section'}`}
                                    className={`shrink-0 rounded px-1 py-0.2 font-bold text-[9.5px] border transition-all cursor-pointer relative z-10 ${buttonBadgeClass}`}
                                  >
                                    {c.sectionId ? (c.subSection ? `${c.sectionId}${c.subSection}` : c.sectionId) : (c.batch && c.section ? `${c.batch}_${c.section}` : 'Sec')}
                                  </button>
                                );
                              }

                              return (
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
                              );
                            })()}
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

            const regularClasses = d.isFriday
              ? []
              : classes.filter((c) => c.dayOfWeek === d.dayKey);

            // Standalone overrides (e.g. online/makeup classes not matching a regular routine slot)
            const standaloneOverrides = (eventOverrides || []).filter((ev) => {
              if (ev.status === 'CANCELLED') return false;
              if (ev.date) {
                const matchesIso = d.isoDate && ev.date.trim() === d.isoDate.trim();
                const dayNum = String(parseInt(ev.date.split('-')[2] || '0', 10));
                const matchesDayNum = d.dayNumber === dayNum && (!ev.dayOfWeek || d.dayKey === ev.dayOfWeek);
                if (!matchesIso && !matchesDayNum) return false;
              } else if (ev.dayOfWeek && ev.dayOfWeek !== d.dayKey) {
                return false;
              }
              const evClean = (ev.courseCode || '').split('(')[0].trim().toUpperCase();
              const matchesRegular = regularClasses.some((c) => {
                const cClean = c.courseCode.split('(')[0].trim().toUpperCase();
                if (cClean !== evClean) return false;
                if (ev.startTime && c.startTime && ev.startTime !== c.startTime) return false;
                return true;
              });
              return !matchesRegular;
            });

            const syntheticClasses: RoutineClass[] = standaloneOverrides
              .filter((ev) => {
                if (subSection === '1' && (ev.courseCode.includes('O2') || ev.title.includes('O2'))) return false;
                if (subSection === '2' && (ev.courseCode.includes('O1') || ev.title.includes('O1'))) return false;
                return true;
              })
              .map((ev) => {
                const isLab = ev.courseCode.toLowerCase().includes('lab') || ev.title.toLowerCase().includes('lab');
                const subSecMatch = ev.courseCode.match(/O([12])/i) || ev.title.match(/O([12])/i);
                return {
                  id: ev.id,
                  batch: section?.batch || '66',
                  section: section?.sectionLetter || 'O',
                  sectionId: ev.sectionId,
                  subSection: subSecMatch ? (subSecMatch[1] as '1' | '2') : null,
                  courseCode: ev.courseCode,
                  courseTitle: ev.title || ev.courseCode,
                  teacherCode: 'MRM',
                  room: ev.room || 'Online',
                  dayOfWeek: d.dayKey as DayOfWeek,
                  startTime: ev.startTime || '19:00',
                  endTime: ev.endTime || '20:00',
                  type: isLab ? 'Lab' : 'Theory',
                  color: 'indigo',
                };
              });

            const dayClassList = [...regularClasses, ...syntheticClasses].sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );

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
                              onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                setExpandedCard({
                                  classItem: classItem,
                                  isBlockMode: false,
                                  targetBadge: targetBadge,
                                  dayLabel: `${d.dayLabel}, ${d.monthLong} ${d.dayNumber}`,
                                });
                              }}
                              className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 transition-all flex flex-col justify-center gap-1.5 cursor-pointer hover:shadow-md hover:scale-[1.005] ${cardThemeClass} ${
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
                                  {(() => {
                                    const cardOverride = (eventOverrides || []).find((ev) => {
                                      if (ev.status === 'CANCELLED') return false;
                                      if (ev.date) {
                                        const matchesIso = d.isoDate && ev.date.trim() === d.isoDate.trim();
                                        const dayNum = String(parseInt(ev.date.split('-')[2] || '0', 10));
                                        const matchesDayNum = d.dayNumber === dayNum && (!ev.dayOfWeek || d.dayKey === ev.dayOfWeek);
                                        if (!matchesIso && !matchesDayNum) return false;
                                      } else if (ev.dayOfWeek && ev.dayOfWeek !== d.dayKey) {
                                        return false;
                                      }
                                      const cClean = (cleanCourseCode || classItem.courseCode || '').split('(')[0].trim().toUpperCase();
                                      const evClean = (ev.courseCode || '').split('(')[0].trim().toUpperCase();
                                      if (cClean !== evClean) return false;
                                      if (ev.startTime && classItem.startTime && ev.startTime !== classItem.startTime) return false;
                                      return true;
                                    });

                                    if (!cardOverride) return null;

                                    return (
                                      <span
                                        title={`${cardOverride.title}${cardOverride.description ? `: ${cardOverride.description}` : ''}`}
                                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold font-mono uppercase shadow-2xs ${
                                          cardOverride.type === 'online'
                                            ? 'bg-sky-400 text-sky-950 border border-sky-500/60'
                                            : 'bg-amber-400 text-amber-950 border border-amber-500/60'
                                        }`}
                                      >
                                        {cardOverride.type === 'ct'
                                          ? 'CT'
                                          : cardOverride.type === 'online'
                                          ? 'ONLINE'
                                          : (cardOverride.type?.toUpperCase() || 'QUIZ')}
                                      </span>
                                    );
                                  })()}
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

      {/* Tap-to-Grow Full Info Card Modal */}
      {expandedCard && (() => {
        const item = expandedCard.classItem;
        const fac = expandedFacultyDetails || (item.teacherCode ? getFacultyByCode(item.teacherCode) : null);
        const isLab = item.type === 'Lab';
        const startMins = timeToMinutes(item.startTime);
        const endMins = timeToMinutes(item.endTime);
        const durationMins = Math.max(0, endMins - startMins);
        const durationHours = Math.floor(durationMins / 60);
        const durationRemainderMins = durationMins % 60;
        const durationStr = durationHours > 0
          ? `${durationHours}h${durationRemainderMins > 0 ? ` ${durationRemainderMins}m` : ''}`
          : `${durationRemainderMins}m`;

        const secId = item.sectionId || (item.batch && item.section ? `${item.batch}_${item.section}` : null);
        const cleanCode = item.courseCode.split('(')[0].trim();

        return (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto print:hidden"
            onClick={() => setExpandedCard(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="expanded-card-title"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header: Routine source badge + Type Badge + Close Button */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  {expandedCard.targetBadge && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold shrink-0 ${
                        expandedCard.isPrimaryTarget
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                          : 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80'
                      }`}
                    >
                      {expandedCard.targetBadge}
                    </span>
                  )}
                  {isComparing && (
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {expandedCard.isPrimaryTarget ? 'Primary Routine' : 'Comparing Routine'}
                    </span>
                  )}
                  {expandedCard.isBlockMode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Background Block
                    </span>
                  )}
                  {expandedCard.override ? (
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold shrink-0 ${
                        expandedCard.override.type === 'quiz' || expandedCard.override.type === 'ct'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                          : expandedCard.override.type === 'online'
                          ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/60 dark:border-sky-700/60'
                          : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
                      }`}
                    >
                      {expandedCard.override.type === 'ct'
                        ? 'Class Test'
                        : expandedCard.override.type === 'quiz'
                        ? 'Quiz'
                        : expandedCard.override.type === 'online'
                        ? 'Online Class'
                        : (expandedCard.override.type?.toUpperCase() || 'EVENT')}
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold shrink-0 ${
                        isLab
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                          : 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/60 dark:border-sky-700/60'
                      }`}
                    >
                      {isLab ? 'Lab' : 'Theory'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedCard(null)}
                  aria-label="Close card details"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Course Title & Code */}
              <div className="space-y-1">
                <h3 id="expanded-card-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {item.courseTitle || cleanCode}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.courseCode}</span>
                  {item.subSection && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Lab Group {item.subSection}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Schedule Info Grid (Time, Day, Room) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Time & Duration */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Time & Day
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {formatTime12(item.startTime)} – {formatTime12(item.endTime)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{expandedCard.dayLabel}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{durationStr}</span>
                  </div>
                </div>

                {/* Room */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Class Room
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {item.room}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Daffodil Campus
                  </div>
                </div>
              </div>

              {/* Event Override Notice / Syllabus details */}
              {expandedCard.override?.description && (
                <div className="rounded-xl border border-sky-200/90 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/40 p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase font-bold text-sky-700 dark:text-sky-300">
                    Notice / Syllabus Details
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {expandedCard.override.description}
                  </div>
                </div>
              )}

              {/* Teacher Information Card */}
              {item.teacherCode && (
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> Teacher Details
                    </div>
                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                      {item.teacherCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {fac?.name || item.teacherName || item.teacherCode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {fac?.designation ? `${fac.designation} • ` : ''}{fac?.department || 'CSE'}
                      </div>
                    </div>
                    {onOpenFacultyInfo && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedCard(null);
                          onOpenFacultyInfo(item.teacherCode);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs shrink-0 cursor-pointer"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Teacher's Assigned Office Room (always shown with live status) */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Teacher Office Room:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {fac?.room || (isLoadingFacultyDetails ? 'Loading...' : 'Not specified')}
                    </span>
                  </div>
                </div>
              )}

              {/* Section Information Card (if applicable) */}
              {secId && (
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      Academic Section
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {secId} {item.subSection ? `(Lab ${item.subSection})` : ''}
                    </div>
                  </div>
                  {onOpenSectionInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedCard(null);
                        onOpenSectionInfo(secId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/60 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <span>Routine</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
}
