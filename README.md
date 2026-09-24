<div align="center">

# 📅 DIU CSE Routine & Calendar Sync

### Stop squinting at blurry Messenger screenshots and 20-page routine PDFs.

**Live dynamic iCal/WebCal subscriptions for Daffodil International University (CSE) — synced straight to your phone & laptop.**

[![Live Demo](https://img.shields.io/badge/Live_App-diucal.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://diucal.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-Turbopack-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-Modern_Hooks-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RFC 5545](https://img.shields.io/badge/RFC_5545-iCalendar_Compliant-059669?style=for-the-badge)](https://tools.ietf.org/html/rfc5545)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br />

[**Explore Live Routine**](https://diucal.vercel.app) • [**API Reference**](#-api-endpoints) • [**Setup Guide**](#-getting-started) • [**Deploy Your Own**](#-deploy-on-vercel)

</div>

---

## ⚡ The Problem vs The Solution

| The Old Way 😫 | With DIU Calendar Sync 🚀 |
| :--- | :--- |
| Pinch-zooming blurry routine PDFs in Messenger group chats | **Glanceable, high-density weekly grid** on mobile & desktop |
| Missing morning classes because you forgot room changes | **Live background calendar updates** (Google, Apple, Outlook) |
| Duplicate events everywhere after manual calendar imports | **Deterministic UIDs** update existing events in-place |
| Lab sessions split into chaotic disjointed blocks | **Auto-merged 3-hour lab spans** with designated lab rooms |
| Timezone shifts showing classes at 3 AM | **Hardened `Asia/Dhaka` (UTC+6)** RFC 5545 calibration |

---

## ✨ Features That Hit Different

- **⚡ Instant 1-Click Subscription (`webcal://`)**:
  Hit subscribe and your classes automatically appear in **Apple Calendar (iOS/macOS)**, **Google Calendar (Android/Web)**, or **Microsoft Outlook**.
- **🧪 Smart Section & Lab Group Filtering**:
  Section **68_D**? Theory lectures are shared, but your lab is subgroup-specific. Filter down to **D1** or **D2** with a toggle — no clutter from classes you don't attend.
- **👨‍🏫 Faculty Discovery & Timetables**:
  Instant autocomplete and schedule lookups for 150+ CSE faculty members with office rooms, designations, and contact info.
- **🚪 Real-time Free Classroom Radar**:
  Find empty classrooms instantly across KT and ANX-1 buildings for study sessions, club meetings, or project prep.
- **🛡️ Anti-Drift Timezone Calibration**:
  Configured with strict `VTIMEZONE` blocks for `Asia/Dhaka` so your reminders ring 15 minutes before class — regardless of daylight saving or device settings.
- **🏎️ Ultra-Low Latency & Resilient Fallbacks**:
  Sub-2ms cached responses backed by live campus routine gateway integration and offline curated fixtures.

---

## 📲 How to Subscribe in 10 Seconds

### 🍏 iOS & macOS (Apple Calendar)
1. Open [diucal.vercel.app](https://diucal.vercel.app).
2. Select your Batch & Section (e.g. `68_D`) and lab group (`D1` or `D2`).
3. Tap **"Subscribe via Apple Calendar"**. iOS will prompt to add the calendar — tap **Subscribe**. Done!

### 🤖 Android & Web (Google Calendar)
1. Select your section on [diucal.vercel.app](https://diucal.vercel.app).
2. Click **"Add to Google Calendar"**.
3. Google Calendar will open in your browser with the feed pre-filled. Click **"Add calendar"**.

> 💡 **Tip:** Works seamlessly with both your official `@diu.edu.bd` university Google Workspace account and personal `@gmail.com` accounts!

---

## 🔌 API Endpoints

The engine provides live, dynamically compiled `.ics` (RFC 5545) and JSON schedule feeds:

```http
GET https://diucal.vercel.app/api/calendar/:sectionId
```

| Endpoint | Description |
| :--- | :--- |
| `GET /api/calendar/68_D` | Complete iCal feed for Section 68_D (all labs) |
| `GET /api/calendar/68_D?sub=1` | Filtered iCal feed for Section 68_D (Lab Subsection 1) |
| `GET /api/calendar/68_D?sub=2` | Filtered iCal feed for Section 68_D (Lab Subsection 2) |
| `GET /api/calendar/teacher/:code` | Live calendar feed for faculty member (e.g. `/teacher/SRH`) |
| `GET /api/schedule?section=68_D` | Raw JSON schedule payload for bot/widget integration |
| `GET /api/rooms/free?time=10:00-11:30` | Real-time vacant rooms query across campus |

### Quick Test via cURL

```bash
# Fetch live ICS calendar feed
curl -i "https://diucal.vercel.app/api/calendar/68_D?sub=1"
```

---

## 🛠️ Tech Stack & Architecture

```
[ Campus Routine Gateway ] ──> [ Resilient Fetch + 15m Cache ]
                                           │
                                           ▼
[ Client / WebCal URL ] <── [ RFC 5545 ICS Generator ] <── [ Local Curated Fixtures ]
```

- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI Library**: React 19 + Tailwind CSS v4
- **Feed Engine**: RFC 5545 Compliant dynamic iCalendar builder (`text/calendar`)
- **Protocol**: `webcal://` and HTTPS dynamic streaming
- **Hosting**: Edge deployment on Vercel

---

## 💻 Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/6ayzid/diu-calendar-sync.git
cd diu-calendar-sync

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🚀 Deploy on Vercel

Deploy your own instance for free in under 60 seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F6ayzid%2Fdiu-calendar-sync)

### Environment Variables (Optional)

| Variable | Description |
| :--- | :--- |
| `ROUTINE_GATEWAY_URL` | Upstream routine gateway endpoint (defaults to campus provider) |
| `GOOGLE_SHEETS_CSV_URL` | Optional direct Google Sheets CSV schedule data feed |

---

## 🤝 Acknowledgments

Special thanks to the Daffodil International University student developer community and campus schedule contributors for keeping routine data open, accessible, and community-driven.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for DIU CSE students & faculty.</sub>
</div>
