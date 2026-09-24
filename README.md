<div align="center">

# DIU CSE Routine & Calendar Sync

**Dynamic iCal and WebCal routine feeds for Daffodil International University (CSE) — synced directly to your phone and laptop calendars.**

[![Live Demo](https://img.shields.io/badge/Live_App-diucal.vercel.app-0070F3?style=flat&logo=vercel&logoColor=white)](https://diucal.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)

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

## API Endpoints

The service provides live `.ics` (RFC 5545) feeds and JSON schedule endpoints:

```http
GET https://diucal.vercel.app/api/calendar/:sectionId
```

| Endpoint | Description |
| :--- | :--- |
| `GET /api/calendar/68_D` | Complete iCal feed for Section 68_D (all labs) |
| `GET /api/calendar/68_D?sub=1` | Filtered iCal feed for Section 68_D (Lab Subsection 1 only) |
| `GET /api/calendar/68_D?sub=2` | Filtered iCal feed for Section 68_D (Lab Subsection 2 only) |
| `GET /api/calendar/teacher/:code` | Live calendar feed for a specific teacher initial |
| `GET /api/schedule?section=68_D` | Raw JSON schedule payload for external tools and bots |
| `GET /api/rooms/free?time=10:00-11:30` | Vacant classrooms query for a given time slot |

### Quick Test via cURL

```bash
curl -i "https://diucal.vercel.app/api/calendar/68_D?sub=1"
```

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

## Acknowledgments

Special thanks to the DIU student developer community and campus schedule contributors for keeping routine data open and accessible.

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.
