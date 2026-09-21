import { RoutineClass } from '@/types/schedule';
import { timeToMinutes } from './time-utils';

export const TIMELINE_START_HOUR = 8; // 8:00 AM
export const TIMELINE_END_HOUR = 18; // 6:00 PM (18:00)
export const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60; // 600 mins

export interface HourlyMark {
  hour: number;
  label: string;
  topPercent: number;
}

export const HOURLY_MARKS: HourlyMark[] = [
  { hour: 8, label: '8 AM', topPercent: 0 },
  { hour: 9, label: '9 AM', topPercent: (1 / 10) * 100 },
  { hour: 10, label: '10 AM', topPercent: (2 / 10) * 100 },
  { hour: 11, label: '11 AM', topPercent: (3 / 10) * 100 },
  { hour: 12, label: '12 PM', topPercent: (4 / 10) * 100 },
  { hour: 13, label: '1 PM', topPercent: (5 / 10) * 100 },
  { hour: 14, label: '2 PM', topPercent: (6 / 10) * 100 },
  { hour: 15, label: '3 PM', topPercent: (7 / 10) * 100 },
  { hour: 16, label: '4 PM', topPercent: (8 / 10) * 100 },
  { hour: 17, label: '5 PM', topPercent: (9 / 10) * 100 },
  { hour: 18, label: '6 PM', topPercent: 100 },
];

export interface PositionedEvent {
  event: RoutineClass;
  topPercent: number;
  heightPercent: number;
  leftPercent: number;
  widthPercent: number;
  startMinutes: number;
  endMinutes: number;
  formattedRange: string;
}

/**
 * Formats a 24-hour time range to Google Calendar compact style:
 * e.g. ("08:30", "11:30") -> "8:30 – 11:30am"
 * e.g. ("13:00", "14:30") -> "1 – 2:30pm"
 * e.g. ("14:30", "16:00") -> "2:30 – 4pm"
 * e.g. ("16:00", "17:30") -> "4 – 5:30pm"
 */
export function formatGCalTimeRange(start24: string, end24: string): string {
  const formatSingle = (timeStr: string, includePeriod: boolean) => {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    const period = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    if (h === 0) h = 12;
    const timeFormatted = m === 0 ? `${h}` : `${h}:${m.toString().padStart(2, '0')}`;
    return includePeriod ? `${timeFormatted}${period}` : timeFormatted;
  };

  const [sH] = start24.split(':').map(Number);
  const [eH] = end24.split(':').map(Number);
  const samePeriod = (sH >= 12 && eH >= 12) || (sH < 12 && eH < 12);

  const startPart = formatSingle(start24, !samePeriod);
  const endPart = formatSingle(end24, true);

  return `${startPart} – ${endPart}`;
}

/**
 * Positions classes onto a continuous timeline with collision detection and column sharing for overlapping events.
 */
export function layoutDayEvents(classes: RoutineClass[]): PositionedEvent[] {
  if (!classes || classes.length === 0) return [];

  // 1. Calculate time bounds for each class
  const baseEvents = classes.map((c) => {
    const startMinutes = timeToMinutes(c.startTime);
    const endMinutes = timeToMinutes(c.endTime);
    const timelineStartMins = TIMELINE_START_HOUR * 60;

    const clampedStart = Math.max(timelineStartMins, startMinutes);
    const clampedEnd = Math.min(TIMELINE_END_HOUR * 60, endMinutes);

    const topPercent = Math.max(0, ((clampedStart - timelineStartMins) / TIMELINE_TOTAL_MINUTES) * 100);
    const heightPercent = Math.max(3, ((clampedEnd - clampedStart) / TIMELINE_TOTAL_MINUTES) * 100);

    return {
      event: c,
      startMinutes,
      endMinutes,
      topPercent,
      heightPercent,
      formattedRange: formatGCalTimeRange(c.startTime, c.endTime),
    };
  });

  // Sort by start time ascending, then by duration descending
  baseEvents.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes);
  });

  // 2. Group into overlapping clusters (interval partitioning)
  const clusters: typeof baseEvents[] = [];
  let currentCluster: typeof baseEvents = [];
  let clusterMaxEnd = -1;

  for (const ev of baseEvents) {
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      clusterMaxEnd = ev.endMinutes;
    } else if (ev.startMinutes < clusterMaxEnd) {
      // Overlaps with current cluster
      currentCluster.push(ev);
      clusterMaxEnd = Math.max(clusterMaxEnd, ev.endMinutes);
    } else {
      // New disjoint cluster
      clusters.push(currentCluster);
      currentCluster = [ev];
      clusterMaxEnd = ev.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // 3. Assign columns within each cluster
  const result: PositionedEvent[] = [];

  for (const cluster of clusters) {
    // Array of columns, each containing the end time of the last event placed in it
    const columns: number[] = [];
    const eventCols: number[] = [];

    for (const ev of cluster) {
      let placedCol = -1;
      for (let i = 0; i < columns.length; i++) {
        if (ev.startMinutes >= columns[i]) {
          columns[i] = ev.endMinutes;
          placedCol = i;
          break;
        }
      }
      if (placedCol === -1) {
        columns.push(ev.endMinutes);
        placedCol = columns.length - 1;
      }
      eventCols.push(placedCol);
    }

    const numCols = columns.length;

    for (let i = 0; i < cluster.length; i++) {
      const ev = cluster[i];
      const colIndex = eventCols[i];
      const leftPercent = (colIndex / numCols) * 100;
      const widthPercent = 100 / numCols;

      result.push({
        ...ev,
        leftPercent,
        widthPercent,
      });
    }
  }

  return result;
}

/**
 * Calculates current time line position in percentage (0 to 100).
 * Returns null if outside the 8 AM - 6 PM timeline.
 */
export function getCurrentTimeTopPercent(currentMinutes: number): number | null {
  const startMins = TIMELINE_START_HOUR * 60; // 480
  const endMins = TIMELINE_END_HOUR * 60;     // 1080

  if (currentMinutes < startMins || currentMinutes > endMins) {
    return null;
  }

  return ((currentMinutes - startMins) / TIMELINE_TOTAL_MINUTES) * 100;
}
