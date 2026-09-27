> [!WARNING]
> **License Notice**: This project is licensed under the CC BY-NC 4.0 License. Commercial use is strictly prohibited without explicit permission from the author.

<div align="center">

# DIU CSE Routine & Calendar Sync

**Dynamic iCal and WebCal routine feeds for Daffodil International University (CSE) — synced directly to your phone and laptop calendars.**

[![Live Demo](https://img.shields.io/badge/Live_App-diucal.vercel.app-0070F3?style=flat&logo=vercel&logoColor=white)](https://diucal.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey.svg?style=flat)](https://creativecommons.org/licenses/by-nc/4.0/)

<br />

[**Open App**](https://diucal.vercel.app) • [**API Reference**](#api-endpoints) • [**How to Subscribe**](#how-to-subscribe) • [**Local Development**](#local-development)

</div>

---

## Overview

| Traditional Static Routine | DIU Calendar Sync |
| :--- | :--- |
| Checking PDFs or screenshots every day | Dynamic weekly timetable view on mobile and desktop |
| Manual calendar entry or missed room changes | Live subscription feeds updating events automatically |
| Duplicate entries from re-importing schedules | Deterministic IDs ensuring events update in-place |
| Lab slots split into separate disconnected periods | Auto-merged 3-hour lab sessions with designated lab rooms |

---

## Features

- **One-Click Calendar Subscription (`webcal://`)**: Subscribe directly in Apple Calendar (iOS/macOS), Google Calendar (Android/Web), or Microsoft Outlook.
- **Section and Lab Group Filtering**: Theory lectures are shared by the full section, while lab periods are split into subgroups (D1, D2). Select your subsection to see only your active classes.
- **Faculty Directory & Timetables**: Search CSE faculty members by name or initial to view office rooms, designations, contact details, and weekly teaching schedules.
- **Empty Classroom Finder**: Quickly look up vacant classrooms across campus buildings (KT and ANX-1) during any time slot.
- **Fast & Resilient**: In-memory caching layer ensures sub-second responses with fallback to curated routine data.

---

## How to Subscribe

### iOS & macOS (Apple Calendar)
1. Open [diucal.vercel.app](https://diucal.vercel.app).
2. Select your Batch, Section, and lab subgroup (if applicable).
3. Tap **"Subscribe via Apple Calendar"** and confirm **Subscribe** when prompted.

### Android & Web (Google Calendar)
1. Select your section on [diucal.vercel.app](https://diucal.vercel.app).
2. Click **"Add to Google Calendar"**.
3. Google Calendar will open with the feed pre-filled — click **"Add calendar"**.

---

## Public API Documentation

This project exposes free, high-performance public endpoints for students and campus developers building Discord/Telegram bots, mobile apps, and schedule widgets.

### 1. Live Calendar Feeds (`.ics` / WebCal)
Direct live calendar feeds formatted to RFC 5545 specifications, edge-cached and optimized for Google Calendar, Apple Calendar, and Microsoft Outlook:

**Base URL:** `https://diucal.vercel.app`

| Endpoint | Description | Query Parameters |
| :--- | :--- | :--- |
| `GET /api/calendar/:sectionId` | Live `.ics` routine feed for a section (e.g. `68_D`, `70_Q`) | `?sub=1` (Lab 1 only)<br>`?sub=2` (Lab 2 only)<br>`?sub=all` (All labs) |
| `GET /api/calendar/teacher/:code` | Live `.ics` routine feed for a faculty initial (e.g. `MIS`, `SRH`) | — |

**Quick Test via cURL:**
```bash
curl -i "https://diucal.vercel.app/api/calendar/68_D?sub=1"
```

---

### 2. High-Performance Edge JSON API (Cloudflare Worker)
For bot developers, CLI tools, and mobile apps requiring sub-50ms JSON responses, query the global edge routine gateway directly:

**Base URL:** `https://diu-routine-api.6ayzid.workers.dev`

| Endpoint | Method | Description | Example Query |
| :--- | :---: | :--- | :--- |
| `/api/schedule` | `GET` / `POST` | Get complete class schedule for a section | `?section=68_D` |
| `/api/teacher-schedule` | `GET` | Get weekly schedule and contact details for a faculty member | `?teacher=MIS` |
| `/api/free-rooms` | `GET` | Find available/empty classrooms across campus buildings | `?time=10:00-11:30&day=Saturday` |
| `/api/routine_version` | `GET` | Check the currently active semester routine version | — |

#### Example Queries:

**A. Get Section Schedule:**
```bash
curl "https://diu-routine-api.6ayzid.workers.dev/api/schedule?section=68_D"
```
```json
{
  "success": true,
  "batch": "68_D",
  "version": "3.1",
  "classes": [
    {
      "course_code": "CSE228(68_D)",
      "course_title": "Theory of Computation",
      "day": "Saturday",
      "time_slot": "10:00-11:30",
      "room": "KT-201",
      "teacher": "MIS"
    }
  ]
}
```

**B. Find Vacant Rooms:**
```bash
curl "https://diu-routine-api.6ayzid.workers.dev/api/free-rooms?time=10:00-11:30&day=Saturday"
```
```json
{
  "success": true,
  "empty_classrooms": {
    "Saturday": ["ANX1-307", "ANX1-401", "ANX1-403", "KT-504 (COM LAB)"]
  }
}
```

> [!TIP]
> **Developer Policy**: Free for student projects, non-commercial campus utilities, and personal bots under the CC BY-NC 4.0 License. Edge cached globally with zero rate-limiting on typical usage.


---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI**: React 19 + Tailwind CSS
- **Calendar Engine**: RFC 5545 iCalendar stream generator (`text/calendar`)
- **Protocol**: `webcal://` & HTTPS calendar subscriptions
- **Deployment**: Vercel

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/6ayzid/diu-calendar-sync.git
cd diu-calendar-sync

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.

---

## For Other Departments (SWE, EEE, BBA, etc.)

Since academic departments outside CSE typically publish their routines as **PDFs or Excel files**, students from other departments can easily fork this repository and launch their own calendar sync for **100% free on Vercel**:

1. **Fork this repository** to your GitHub account.
2. **Add your schedule**:
   - **From PDF / Excel**: Extract or parse your department's timetable into `src/data/official-routine.json`.
   - **From Custom Backend / Gateway**: If you have your own routine API service, set `ROUTINE_GATEWAY_URL=https://your-api.com` in your Vercel Environment Variables.
3. **Deploy on Vercel**: Import your fork on [vercel.com](https://vercel.com) (Framework: Next.js) and click **Deploy**. Your live WebCal feeds will be available instantly!

---

## Community & Open Data Mission

Academic class routines, room allocations, and schedule timetables are fundamental public student utilities. This project was built to ensure DIU students always have permanent, reliable, and completely free calendar synchronization without artificial restrictions or paywalls.

---

## License

Licensed under the [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) License. Commercial use is strictly prohibited without explicit permission from the author. See [`LICENSE`](LICENSE) for details.
