# DIU CSE Routine - Dynamic Calendar Subscription System

A dynamic, multi-section calendar subscription system for the Department of CSE (DIU). Students and faculty can view weekly class routines and subscribe via live **iCal / WebCal** feeds that automatically sync updates, room swaps, and instructor changes directly to personal calendar apps (**Google Calendar**, **Apple Calendar**, **Microsoft Outlook**).

---

## Key Features

- **Dynamic RFC 5545 iCalendar Feeds**: Permanent live subscription URLs per section (`/api/calendar/[sectionId]`) compiled on the fly.
- **Section & Subsection Support**: Parent sections (e.g. **68_D**) share all common theory lectures, while lab sessions are split into dedicated subgroups (**D1** and **D2**). Students can subscribe to their specific lab group or all groups.
- **Live Campus Data Integration**: Real-time routine scraping from `routine.zohirrayhan.me` with 15-minute in-memory caching and resilient offline fallbacks.
- **Auto-Sync & Zero Duplicates**: Uses deterministic UIDs (`slot-[section]-[course]-[sub]-[day]-[time]`) so calendar engines update existing events in place instead of creating duplicates.
- **Anti-Drift Timezone**: Full `Asia/Dhaka` (UTC+6) calibration with RFC 5545 timezone definitions.
- **Interactive Timetable UI**:
  - Horizontal X-Axis: Saturday to Thursday.
  - Vertical Y-Axis: 6 standard class periods (08:30 to 17:30).
  - 3-hour lab sessions merged into single vertical slots (`row-span-2`).
- **One-Click Subscription**:
  - Native `webcal://` protocol handler for iOS, macOS, and Outlook.
  - Direct web-add URL for Google Calendar.
  - One-click copy feed URL.

---

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/6ayzid/diu-calendar-sync.git
cd diu-calendar-sync

# Install dependencies
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build

```bash
npm run build
npm run start
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/calendar/[sectionId]` | Returns live `.ics` feed for `sectionId` (e.g. `68_D`, `70_Q`) |
| `GET` | `/api/calendar/[sectionId]?sub=1` | Returns feed filtered to subsection 1 lab only |
| `GET` | `/api/calendar/[sectionId]?sub=2` | Returns feed filtered to subsection 2 lab only |
| `GET` | `/api/calendar?section=68_D` | Query-based calendar feed endpoint |
| `GET` | `/api/schedule?section=68_D&sub=1` | JSON schedule data for UI embedding |

### Response Headers
```http
Content-Type: text/calendar; charset=utf-8
Content-Disposition: inline; filename="68_D-routine.ics"
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

---

## Deploying Online for Free (Vercel)

The easiest way to deploy this project online for **100% free** is on **Vercel**:

1. Push this repository to your GitHub account (`6ayzid/diu-calendar-sync`).
2. Log in to [vercel.com](https://vercel.com) with GitHub.
3. Click **"Add New..."** → **"Project"** and import `diu-calendar-sync`.
4. Leave defaults (Framework: Next.js) and click **Deploy**.
5. Your live WebCal feeds will be available at `webcal://your-project.vercel.app/api/calendar/68_D` with free automated HTTPS!

---

## License

MIT
