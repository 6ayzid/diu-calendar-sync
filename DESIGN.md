---
name: DIU CSE Routine
description: Dynamic calendar subscription system and academic timetable terminal for DIU CSE
colors:
  primary: "#10b981"
  cta-emerald: "#10b981"
  secondary: "#0ea5e9"
  amber-lab: "#f59e0b"
  rose-sub: "#f43f5e"
  canvas-midnight: "#080d1a"
  canvas-obsidian: "#020617"
  hard-slate: "#0f172a"
  terminal-border: "#1e2c44"
  slate-border: "#1e293b"
  terminal-light: "#f8fafc"
  muted-slate: "#94a3b8"
  light-border: "#e2e8f0"
  light-scroll: "#cbd5e1"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Outfit, var(--font-sans), system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, var(--font-sans), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Outfit, var(--font-sans), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Outfit, var(--font-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, var(--font-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cta-emerald}"
    textColor: "#022c22"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#34d399"
  button-secondary:
    backgroundColor: "{colors.hard-slate}"
    textColor: "{colors.terminal-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
---

# Design System: DIU CSE Routine

## Overview

**Creative North Star: "The Radiant Academic Companion"**

The DIU CSE Routine design system is a warm, uplifting, and high-density academic instrument tailored for engineering students and faculty. Moving beyond cold sterile terminals and generic SaaS blues, the aesthetic combines deep comforting midnight canvases with vibrant spring emerald action states, golden amber lab highlights, and subtle dawn ambient depth.

**Key Characteristics:**
- Uplifting, positive atmospheric warmth with comfortable contrast (no eye-searing blinding white).
- Flat mechanical structure: zero fuzzy drop shadows, crisp 1px borders.
- Monospace precision for all temporal, spatial, and protocol telemetry (room numbers, times, slot UIDs).
- High-density grid architecture optimized for rapid glanceability across mobile and desktop viewports.

## Colors

The palette is anchored in rich midnight navy with comforting high-contrast neutral text and vibrant, positive semantic signals.

### Primary
- **Radiant Spring Emerald** (`#10b981`): Action triggers, live sync states, active calendar buttons (`bg-emerald-500` with `text-emerald-950 font-bold`). Delivers 9.8:1 WCAG AAA contrast without harsh blinding glare.
- **Signal Sky** (`#0ea5e9`): Razor-sharp cool aerospace telemetry cyan. Active selection indicator, focus outlines, and upcoming periods.

### Secondary
- **Warm Honey Amber** (`#f59e0b`): 3-hour merged laboratory sessions, Section D1 badges, and weekend status.

### Tertiary
- **Coral Rose** (`#f43f5e`): Section subgroup 2 (D2) pill badges.

### Neutral
- **Midnight Canvas** (`#080d1a`): Warm, deep navy page background with subtle dawn atmospheric gradient wash.
- **Hard Slate** (`#0f172a`): Container, card, and timetable cell background.
- **Twilight Border** (`#1e2c44`): Solid 1px structural dividing lines and grid borders.
- **Terminal Light** (`#f8fafc`): Primary readable text and active headings.
- **Muted Slate** (`#94a3b8`): Secondary metadata, subtitles, and inactive labels.

### Named Rules
**The Uplifting Color Balance Rule.** Accents (emerald, sky, amber, rose) maintain strict functional and emotional purpose: emerald signals live sync & action, amber signals deep lab sessions, sky guides upcoming periods, and rose separates subgroups. Backgrounds remain comfortable midnight slates without blinding glare.

## Typography

**Display Font:** Outfit (`var(--font-sans)`), system-ui, sans-serif  
**Body Font:** Outfit (`var(--font-sans)`), system-ui, sans-serif  
**Label/Mono Font:** JetBrains Mono (`var(--font-mono)`), ui-monospace, monospace  

**Character:** Technical, crisp, and distraction-free. Geometric sans for readable hierarchy paired with dense, tabular monospace for schedule data, timestamps, and room codes.

### Hierarchy
- **Display** (800 weight, `clamp(1.75rem, 4vw, 2.25rem)`, 1.2 line-height): Semester title and primary page header.
- **Headline** (600 weight, 1.125rem, 1.3 line-height): Section card titles and category headers.
- **Title** (600 weight, 1rem, 1.4 line-height): Component group titles and action labels.
- **Body** (400 weight, 0.875rem, 1.5 line-height): Explanatory copy, protocol guides, and helper notes.
- **Label / Telemetry** (500 weight, 0.75rem, 0.02em letter-spacing): Period times, room numbers, teacher initials, section badges, and WebCal URLs.

### Named Rules
**The Monospace Data Rule.** Any string representing time, room, section ID, or calendar protocol must be rendered in JetBrains Mono to maintain tabular visual alignment.

## Layout

A rigid, high-density container model structured within an `mx-auto max-w-7xl px-4 sm:px-6` boundary.

- **Vertical Rhythm:** 24px–32px section spacing (`space-y-6` to `space-y-8`).
- **Timetable Matrix:** 7-column grid layout (Time Period column + 6 weekdays: Saturday to Thursday) with row-spanning logic for 3-hour merged lab sessions.
- **Responsive Behavior:** Horizontal scroll container (`overflow-x-auto min-w-[1020px]`) on viewports under 1024px to protect timetable integrity without squishing slot text.

## Elevation & Depth

**Flat Mechanical Architecture.** This system rejects soft ambient drop shadows, colored glow blurs, and glassmorphism. Depth is created strictly through tonal layering and 1px borders:

- **Level 0 (Canvas):** `#020617` (Obsidian Void).
- **Level 1 (Containers / Cards):** `#0f172a` (Hard Slate) with 1px `#1e293b` (Terminal Border).
- **Level 2 (Active Pills & Modals):** `#1e293b` with `#334155` border or solid `#6366f1` accent.

### Named Rules
**The Zero-Glow Rule.** No diffuse `shadow-2xl` or `blur-3xl` colored backdrops. Containers stand on clean edge definition alone.

## Shapes

- **Corners:** 8px (`rounded-md` / `rounded-lg`) for buttons, inputs, and timetable cells; 16px (`rounded-xl` / `rounded-2xl`) for outer container modules. Badges use full capsules (`rounded-full`).
- **Borders:** Crisp 1px solid stroke (`border border-slate-800`). No dashed or gradient strokes.

## Components

### Buttons
- **Shape:** 8px radius (`rounded-lg`), 8px 16px padding.
- **Primary:** Radiant Spring Emerald (`bg-emerald-500`), forest text (`text-emerald-950 font-bold`), hover to `#34d399`. Optimistic, refreshing, zero blinding glare.
- **Secondary / Protocol:** Dark Slate (`bg-slate-900`), 1px border (`border-slate-800`), hover to `#1e293b`.
- **Feedback:** Instant micro-snap state change (150ms).

### Chips & Filter Pills
- **Style:** Compact capsule (`rounded-lg` or `rounded-full`), 4px 10px padding, font-mono.
- **Unselected:** Neutral slate with subtle border (`border-slate-800 text-slate-400`).
- **Selected:** Solid accent (`bg-emerald-950/30 text-emerald-200 border-emerald-500/50` or `border-sky-500/80 bg-slate-800 text-white`, `bg-amber-600` for Group 1, `bg-rose-600` for Group 2).

### Cards & Panels
- **Corner Style:** 16px radius (`rounded-2xl`).
- **Background:** Solid Hard Slate (`bg-slate-900`).
- **Border:** 1px solid Terminal Border (`border border-slate-800`).
- **Internal Padding:** 20px–24px (`p-5 sm:p-6`).

### Timetable Slot Cells
- **Style:** 8px radius, solid opaque background, 1px border.
- **Theory Slot:** Slate background with subtle blue course indicator.
- **Lab Slot:** Merged multi-row vertical span (`row-span-2`), amber/gold accent badge.
- **Empty Slot:** Muted dashed placeholder or subtle neutral grid slot.

## Do's and Don'ts

### Do:
- **Do** format all timetable periods, room numbers, and URLs in Geist Mono.
- **Do** maintain strict 1px border boundaries between timetable slots and container cards.
- **Do** use Phosphor Emerald strictly for live sync, successful copy, and active subscription status.
- **Do** ensure 3-hour lab sessions clearly communicate the span across multiple periods.

### Don't:
- **Don't** use decorative purple-cyan gradients or floating blur orbs.
- **Don't** use gray text directly on colored button backgrounds (use high-contrast white or dark tinted text).
- **Don't** add diffuse ambient drop shadows to flat utility containers.
- **Don't** collapse or wrap timetable columns into illegible vertical strips on mobile without a preserved horizontal scroll matrix.
