# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary Users: Daffodil International University (DIU) Computer Science & Engineering (CSE) undergraduate students and faculty members.
- Situation: Students and teachers need quick access to their weekly class timetable, room assignments, instructor initials, and real-time updates (rescheduled classes, room changes, makeup lectures) on their mobile phones and laptops.
- Job: Check routine schedules instantly and sync them directly to their personal calendar apps (Google Calendar, Apple Calendar, Microsoft Outlook) without manual data entry.

## Product Purpose

A dynamic, multi-section timetable viewer and live iCal/WebCal subscription system that eliminates routine confusion and keeps schedules synchronized in real time. Success means zero duplicate calendar events, accurate room/slot reflections, and frictionless one-click subscription.

## Positioning

Unlike static PDF routines or screenshot-based schedule sharing, this platform compiles live, dynamic RFC 5545 iCalendar feeds on the fly per section and subsection/lab group. It features deterministic UID generation (`slot-[section]-[course]-[sub]-[day]-[time]`) ensuring calendar clients update events in place rather than creating duplicate entries, backed by resilient live scraping from campus routine sources with automated fallback.

## Operating Context

- Mobile and desktop web browsers accessed frequently by students on campus or on the go.
- Integrated directly with personal calendar clients (Google Calendar, iOS/macOS Apple Calendar, Outlook).
- Campus schedule structure: Saturday to Thursday, 6 standard class periods (08:30 to 17:30 UTC+6 / Asia/Dhaka), with 3-hour merged lab sessions.

## Capabilities and Constraints

- Capabilities:
  - Dynamic live `.ics` feeds via `/api/calendar/[sectionId]` with optional subsection filters (`?sub=1`, `?sub=2`).
  - Interactive grid timetable UI displaying periods, rooms, course codes, and teacher initials.
  - Multi-platform subscription handlers: `webcal://` one-click subscription, direct Google Calendar web-add link, and copyable feed URL.
  - Live data scraping from `routine.zohirrayhan.me` with 15-minute caching and offline fallback fixtures.
- Constraints:
  - Must strictly preserve `Asia/Dhaka` (UTC+6) timezone calibration to prevent calendar drift.
  - Lab sessions span multiple periods and must be properly merged visually and in calendar events.
  - Next.js 16 App Router, React 19, Tailwind CSS v4 stack.

## Brand Commitments

- Name: DIU CSE Routine (DIU Calendar Sync).
- Voice: Clean, student-first productivity utility; fast, high-density, accessible, and clutter-free.
- Identity: Modern departmental utility designed for everyday student productivity without heavy bureaucratic friction.

## Evidence on Hand

- Production Next.js application codebase with live endpoints (`/api/calendar/[sectionId]`, `/api/schedule`).
- Scraper and mock datasets in `src/data/` and `src/lib/`.
- Routine source: `routine.zohirrayhan.me`.

## Product Principles

1. Zero Friction Calendar Sync: Subscribing to your class routine should take one click and never create duplicate entries or misaligned time zones.
2. Glanceable & High-Density: The timetable must be instantly readable at a glance on mobile and desktop without cognitive overload.
3. Resilient Data Flow: Live routine updates are served with smart caching and robust fallbacks so students are never left without their timetable.
