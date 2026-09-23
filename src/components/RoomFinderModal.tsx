'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DoorOpen,
  X,
  Search,
  Clock,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type { DayOfWeek } from '@/types/schedule';
import type { UniversityTimeSlot } from '@/lib/time-utils';
import {
  UNIVERSITY_TIME_SLOTS,
  ACADEMIC_DAYS,
  getDhakaCurrentSlotInfo,
  formatSlotLabel,
  dayOfWeekToApiDay,
} from '@/lib/time-utils';
import {
  ALL_CAMPUS_ROOMS,
  fuzzyMatchRoom,
  formatRoomDisplay,
  type CampusRoom,
  type BuildingZone,
} from '@/data/rooms';
import { Badge, Button } from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotFreeRooms {
  rooms: string[];
  grouped: Record<BuildingZone, string[]>;
  totalFree: number;
}

type WeekFreeRooms = Record<string, Record<UniversityTimeSlot, SlotFreeRooms>>;

interface RoomOccupancySlot {
  slot: UniversityTimeSlot;
  occupied: boolean;
  courseCode?: string;
  courseTitle?: string;
  section?: string;
  teacher?: string;
}

interface OccupancyResponse {
  success: boolean;
  room: string;
  day: string;
  schedule: RoomOccupancySlot[];
  occupiedSlots: number;
  freeSlots: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_SHORTS: Record<DayOfWeek, string> = {
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
};

const DAY_NAMES: Record<DayOfWeek, string> = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
};

// Order: KT -> ANX1 (between standard rooms and lab rooms) -> Labs (all labs together) -> Other
const ZONE_ORDER: BuildingZone[] = ['KT', 'ANX1', 'Labs', 'Other'];

// ─── Component Props ──────────────────────────────────────────────────────────

interface RoomFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoom?: string | null;
  onNavigateToSection?: (sectionId: string) => void;
  onNavigateToFaculty?: (facultyCode: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoomFinderModal({
  isOpen,
  onClose,
  initialRoom,
  onNavigateToSection,
  onNavigateToFaculty,
}: RoomFinderModalProps) {
  // Active day reflected in sticky header
  const [activeDay, setActiveDay] = useState<DayOfWeek>('SATURDAY');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [hasScrolledToSlot, setHasScrolledToSlot] = useState(false);

  // All 6 days free rooms data
  const [weekData, setWeekData] = useState<WeekFreeRooms | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);

  // Live slot info from Asia/Dhaka clock
  const [clockInfo, setClockInfo] = useState(() => getDhakaCurrentSlotInfo());

  // Refs for auto-scrolling & day section indexing
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const daySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSlotRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  // ─── Handle Modal Open & Reset (Render-time derivation) ────────────────────
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    const info = getDhakaCurrentSlotInfo();
    const defaultDay = info.day || 'SATURDAY';
    setActiveDay(defaultDay);

    if (initialRoom) {
      setSelectedRoom(initialRoom);
    } else {
      setSelectedRoom(null);
    }
    setRoomSearch('');
    setHasScrolledToSlot(false);
    setOccupancy(null);
  }
  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Invalidate occupancy data when room or day changes in inspection view
  const occKey = `${selectedRoom}|${activeDay}`;
  const [prevOccKey, setPrevOccKey] = useState('');
  if (selectedRoom && occKey !== prevOccKey) {
    setPrevOccKey(occKey);
    setOccupancy(null);
  }

  // Derive loading states directly from data being null while modal is open
  const loadingWeek = isOpen && weekData === null;
  const loadingOccupancy = isOpen && !!selectedRoom && occupancy === null;

  // Periodic Dhaka clock update while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setClockInfo(getDhakaCurrentSlotInfo());
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // ─── Fetch Free Rooms for All 6 Days in a Single Parallel Call ─────────────
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    fetch('/api/rooms/free')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.days) {
          setWeekData(data.days);
        }
      })
      .catch((err) => {
        console.error('Failed to load week room data:', err);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  // ─── Fetch Room Occupancy Schedule When Inspecting ─────────────────────────
  useEffect(() => {
    if (!isOpen || !selectedRoom) {
      return;
    }

    let active = true;
    const apiDay = dayOfWeekToApiDay(activeDay);

    fetch(`/api/rooms/occupancy?room=${encodeURIComponent(selectedRoom)}&day=${encodeURIComponent(apiDay)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setOccupancy(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load occupancy schedule:', err);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedRoom, activeDay]);

  // ─── Auto-scroll to Current Day & Time Slot on Open ────────────────────────
  useEffect(() => {
    if (!isOpen || selectedRoom || roomSearch.trim() || loadingWeek || hasScrolledToSlot) return;

    const timer = setTimeout(() => {
      if (activeSlotRef.current && scrollContainerRef.current) {
        isProgrammaticScrollRef.current = true;
        activeSlotRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHasScrolledToSlot(true);
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);
      } else {
        const todayDay = clockInfo.day || 'SATURDAY';
        const targetDayEl = daySectionRefs.current[todayDay];
        if (targetDayEl && scrollContainerRef.current) {
          isProgrammaticScrollRef.current = true;
          targetDayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHasScrolledToSlot(true);
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 600);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, selectedRoom, roomSearch, loadingWeek, hasScrolledToSlot, clockInfo.day]);

  // ─── Day Tab Click -> Smooth Scroll to Day Section ────────────────────────
  const handleScrollToDay = useCallback((day: DayOfWeek) => {
    setActiveDay(day);
    if (selectedRoom) return;

    const targetEl = daySectionRefs.current[day];
    if (targetEl && scrollContainerRef.current) {
      isProgrammaticScrollRef.current = true;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  }, [selectedRoom]);

  // ─── Scroll Spy: Update Active Day in Sticky Header on Scroll ─────────────
  const handleContainerScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || selectedRoom || roomSearch.trim()) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;

    for (let i = ACADEMIC_DAYS.length - 1; i >= 0; i--) {
      const d = ACADEMIC_DAYS[i];
      const el = daySectionRefs.current[d];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 80) {
          setActiveDay(d);
          break;
        }
      }
    }
  }, [selectedRoom, roomSearch]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && !selectedRoom) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen, selectedRoom]);

  // ─── Keyboard Listeners (ESC) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRoom) {
          setSelectedRoom(null);
        } else if (roomSearch) {
          setRoomSearch('');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedRoom, roomSearch, onClose]);

  // ─── Search Matching ──────────────────────────────────────────────────────
  const searchResults: CampusRoom[] = useMemo(() => {
    const q = roomSearch.trim();
    if (!q) return [];
    return ALL_CAMPUS_ROOMS.filter((room) => fuzzyMatchRoom(q, room));
  }, [roomSearch]);

  // Precise search vacancy checker
  const getSearchRoomStatus = useCallback(
    (roomName: string): { isFree: boolean; label: string } => {
      if (clockInfo.isClassHours && clockInfo.currentSlot && clockInfo.day) {
        const dayApi = dayOfWeekToApiDay(clockInfo.day);
        const daySlots = weekData?.[dayApi];
        const slotData = daySlots?.[clockInfo.currentSlot];

        if (slotData) {
          const cleanTarget = roomName.toLowerCase().replace(/\s*\([^)]*(?:Lab|LAB)[^)]*\)/gi, '').trim();
          const isFree = slotData.rooms.some(
            (r) => r.toLowerCase().replace(/\s*\([^)]*(?:Lab|LAB)[^)]*\)/gi, '').trim() === cleanTarget
          );

          return {
            isFree,
            label: isFree ? 'Vacant now' : 'Occupied',
          };
        }
      }

      return {
        isFree: false,
        label: clockInfo.isFriday ? 'Friday weekend' : 'Classes ended for today',
      };
    },
    [clockInfo, weekData]
  );

  // Quick inspection handler
  const handleInspectRoom = useCallback((roomName: string) => {
    setSelectedRoom(roomName);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedRoom(null);
    setOccupancy(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Main Container Card — on-theme with SectionSelector and FacultyInfoModal */}
      <div className="relative w-full max-w-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-3 dark:border-slate-800 dark:bg-slate-900 overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedRoom ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBackToList}
                className="shrink-0"
                aria-label="Back to all rooms"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>All Rooms</span>
              </Button>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                <DoorOpen className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0">
              <h2 id="room-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {selectedRoom ? formatRoomDisplay(selectedRoom) : 'Empty Room Finder'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{clockInfo.timeLabel} BDT</span>
                </span>
                {clockInfo.currentSlot && clockInfo.isClassHours && !selectedRoom && (
                  <Badge variant="emerald" dot pulse mono size="sm">
                    LIVE: {clockInfo.currentSlot}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close room finder modal"
            className="flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─── Search Bar ──────────────────────────────────────────────────── */}
        {!selectedRoom && (
          <div className="space-y-1.5 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search any room (e.g. 201, KT-502, ANX1, Lab)..."
                aria-label="Search campus rooms"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono transition-colors outline-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[44px] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-emerald-500"
              />
              {roomSearch && (
                <button
                  type="button"
                  onClick={() => setRoomSearch('')}
                  className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear room search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Sticky Day Index Bar (Uniform sleek height, dot beside Today) ─── */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-0.5 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {ACADEMIC_DAYS.map((d) => {
              const isSelected = activeDay === d;
              const isCurrentDay = clockInfo.day === d;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleScrollToDay(d)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-mono font-medium transition-all text-center cursor-pointer min-h-[36px] ${
                    isSelected
                      ? 'bg-emerald-500 text-emerald-950 font-bold border border-emerald-400/50 shadow-xs dark:bg-emerald-500 dark:text-emerald-950'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/60 dark:hover:bg-slate-700/80 dark:hover:text-white'
                  }`}
                >
                  <span>{DAY_SHORTS[d]}</span>
                  {isCurrentDay && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-emerald-950' : 'bg-emerald-500'
                      }`}
                      title="Today"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Scrollable Content Area ─────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 overflow-y-auto pr-1.5 space-y-4 scrollbar-thin"
        >
          {selectedRoom ? (
            /* ─────────────────────────────────────────────────────────────────
               VIEW A: ROOM OCCUPANCY & FULL SCHEDULE VIEW
            ─────────────────────────────────────────────────────────────────── */
            <div className="space-y-4 pt-1 pb-2">
              <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                      {formatRoomDisplay(selectedRoom)}
                    </span>
                    {occupancy && (
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        {occupancy.freeSlots} free • {occupancy.occupiedSlots} busy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Schedule for {DAY_NAMES[activeDay]} (all 6 time slots)
                  </p>
                </div>
              </div>

              {loadingOccupancy ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 text-xs font-mono">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  <span>Loading schedule for {formatRoomDisplay(selectedRoom)}...</span>
                </div>
              ) : occupancy?.schedule ? (
                <div className="space-y-2">
                  {occupancy.schedule.map((slotItem) => {
                    const isCurrentSlot =
                      clockInfo.day === activeDay &&
                      clockInfo.isClassHours &&
                      clockInfo.currentSlot === slotItem.slot;

                    return (
                      <div
                        key={slotItem.slot}
                        className={`rounded-xl border p-3 sm:p-3.5 transition-colors ${
                          isCurrentSlot
                            ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-slate-950 dark:border-emerald-500/35 shadow-xs'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                                {formatSlotLabel(slotItem.slot)}
                              </span>
                              {isCurrentSlot && (
                                <Badge variant="emerald" dot pulse mono size="sm">
                                  CURRENT
                                </Badge>
                              )}
                            </div>

                            {slotItem.occupied ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white">
                                    {slotItem.courseCode}
                                  </span>
                                  {slotItem.section && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onNavigateToSection && slotItem.section) {
                                          onNavigateToSection(slotItem.section);
                                          onClose();
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200/80 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60 transition-colors cursor-pointer"
                                      title={`View section ${slotItem.section} routine`}
                                    >
                                      Sec {slotItem.section}
                                    </button>
                                  )}
                                  {slotItem.teacher && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onNavigateToFaculty && slotItem.teacher) {
                                          onNavigateToFaculty(slotItem.teacher);
                                          onClose();
                                        }
                                      }}
                                      className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 transition-colors cursor-pointer"
                                      title={`View teacher ${slotItem.teacher} routine`}
                                    >
                                      {slotItem.teacher}
                                    </button>
                                  )}
                                </div>
                                {slotItem.courseTitle && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                    {slotItem.courseTitle}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Vacant &amp; Available
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 pt-0.5">
                            <Badge
                              variant="slate"
                              mono
                              size="sm"
                            >
                              {slotItem.occupied ? 'Occupied' : 'Free'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-slate-400">
                  No schedule information found for this room.
                </div>
              )}
            </div>
          ) : roomSearch.trim() ? (
            /* ─────────────────────────────────────────────────────────────────
               VIEW B: UNIVERSAL FUZZY SEARCH RESULTS (ALL CAMPUS ROOMS)
            ─────────────────────────────────────────────────────────────────── */
            <div className="py-1 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pb-0.5">
                <span>
                  Found <strong className="text-slate-700 dark:text-slate-300">{searchResults.length}</strong> matching room{searchResults.length !== 1 ? 's' : ''}
                </span>
                <span className="font-mono">{DAY_SHORTS[activeDay]}</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  No campus rooms match your search query. Try &ldquo;201&rdquo;, &ldquo;KT-502&rdquo;, &ldquo;ANX&rdquo;, or &ldquo;Lab&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map((room) => {
                    const status = getSearchRoomStatus(room.name);
                    const displayName = formatRoomDisplay(room.name);

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleInspectRoom(room.name)}
                        className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800/40 text-left transition-all cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {displayName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span
                              className={`font-mono ${
                                status.isFree
                                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-500 dark:text-slate-600 dark:group-hover:text-emerald-400 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────────
               VIEW C: ALL DAYS SCROLLABLE TIMELINE WITH STICKY DAY INDEX
            ─────────────────────────────────────────────────────────────────── */
            loadingWeek ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 text-xs font-mono">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                <span>Checking vacant rooms across all days...</span>
              </div>
            ) : weekData ? (
              <div className="space-y-6 py-1">
                {ACADEMIC_DAYS.map((day) => {
                  const dayApi = dayOfWeekToApiDay(day);
                  const daySlots = weekData[dayApi];
                  const isCurrentDay = clockInfo.day === day;

                  let totalDayFree = 0;
                  if (daySlots) {
                    for (const s of UNIVERSITY_TIME_SLOTS) {
                      totalDayFree += daySlots[s]?.totalFree || 0;
                    }
                  }

                  return (
                    <div
                      key={day}
                      ref={(el) => {
                        daySectionRefs.current[day] = el;
                      }}
                      className="space-y-3 scroll-mt-14"
                    >
                      {/* Day Section Header (clean neutral numbers, no accent colors) */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                            {DAY_NAMES[day]}
                          </h3>
                          {isCurrentDay && (
                            <Badge variant="emerald" dot mono size="sm">
                              TODAY
                            </Badge>
                          )}
                        </div>

                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          {totalDayFree} free
                        </span>
                      </div>

                      {/* 6 Time Slots for this day */}
                      <div className="space-y-2.5">
                        {UNIVERSITY_TIME_SLOTS.map((slot) => {
                          const slotData = daySlots?.[slot];
                          const totalFree = slotData?.totalFree || 0;
                          const isCurrentSlot =
                            isCurrentDay && clockInfo.isClassHours && clockInfo.currentSlot === slot;
                          const isNextUpcoming =
                            isCurrentDay && !clockInfo.currentSlot && clockInfo.nextSlot === slot;

                          return (
                            <div
                              key={slot}
                              ref={isCurrentSlot || isNextUpcoming ? activeSlotRef : null}
                              className={`rounded-xl border transition-all scroll-mt-16 ${
                                isCurrentSlot
                                  ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-slate-950 dark:border-emerald-500/40 shadow-xs'
                                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                              }`}
                            >
                              {/* Slot Header (Neutral count, no accent color) */}
                              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
                                    {formatSlotLabel(slot)}
                                  </span>

                                  {isCurrentSlot ? (
                                    <Badge variant="emerald" dot pulse mono size="sm">
                                      LIVE NOW
                                    </Badge>
                                  ) : isNextUpcoming ? (
                                    <Badge variant="sky" mono size="sm">
                                      NEXT UP
                                    </Badge>
                                  ) : null}
                                </div>

                                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                  {totalFree} free
                                </span>
                              </div>

                              {/* Slot Rooms: Grouped by Building (KT -> Annex -> Labs -> Other) without noisy building titles */}
                              <div className="p-2.5 sm:p-3">
                                {totalFree === 0 ? (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1 font-mono">
                                    No vacant rooms reported.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {ZONE_ORDER.map((zone) => {
                                      const rooms = slotData?.grouped?.[zone] || [];
                                      if (rooms.length === 0) return null;

                                      return (
                                        <div key={zone} className="flex flex-wrap gap-1.5">
                                          {rooms.map((roomName) => {
                                            const displayName = formatRoomDisplay(roomName);

                                            return (
                                              <button
                                                key={roomName}
                                                type="button"
                                                onClick={() => handleInspectRoom(roomName)}
                                                className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/50 dark:hover:bg-slate-850 dark:text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
                                                title={`Click to view ${roomName} schedule`}
                                              >
                                                <span>{displayName}</span>
                                                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-500 dark:text-slate-500 dark:group-hover:text-emerald-400 transition-colors" />
                                              </button>
                                            );
                                          })}
                                        </div>
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
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-slate-400">
                Failed to load room data. Please check your connection and try again.
              </div>
            )
          )}
        </div>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="font-mono truncate">
            {selectedRoom
              ? `Inspecting ${formatRoomDisplay(selectedRoom)} (${DAY_SHORTS[activeDay]})`
              : `Viewing ${DAY_NAMES[activeDay]}`}
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
