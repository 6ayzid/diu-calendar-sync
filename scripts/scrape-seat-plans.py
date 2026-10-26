#!/usr/bin/env python3
"""
Scrapes official DIU Department of CSE Daily Seat Details PDFs into
src/data/midterm-seat-plans.json

Usage:
  python scripts/scrape-seat-plans.py [optional_pdf_paths...]

If no arguments are provided, it parses the standard Telegram Desktop downloads or existing records.
"""

import os
import sys
import glob
import re
import json

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber is required. Run: pip install pdfplumber")
    sys.exit(1)

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "midterm-seat-plans.json")

DEFAULT_SEARCH_PATHS = [
    r"C:\Users\bayzid\Downloads\Telegram Desktop\*Daily Seat Details*.pdf",
    r"C:\Users\bayzid\Downloads\*Daily Seat Details*.pdf",
]

def clean_text(val):
    if val is None:
        return ""
    return str(val).strip()

def parse_pdf(file_path):
    print(f"Parsing: {os.path.basename(file_path)}")
    records = []

    with pdfplumber.open(file_path) as pdf:
        current_date = None
        current_slot = None
        current_course_code = None
        current_course_title = None
        current_teacher = None
        current_section = None
        current_rooms = []
        current_total = None

        def flush_current():
            nonlocal current_section, current_rooms, current_total, current_teacher, current_course_code, current_course_title
            if current_section and current_rooms:
                if (records and
                    records[-1]["date"] == current_date and
                    records[-1]["slot"] == current_slot and
                    records[-1]["section"] == current_section and
                    records[-1]["courseCode"] == current_course_code):
                    # Section spans across page break: merge rooms
                    records[-1]["rooms"].extend(current_rooms)
                    records[-1]["roomString"] = ", ".join(f"{r}({s})" for r, s in records[-1]["rooms"])
                    records[-1]["total"] = current_total or records[-1]["total"]
                    if not records[-1].get("teacher") and current_teacher:
                        records[-1]["teacher"] = current_teacher
                else:
                    seat_sum = sum(int(s) for r, s in current_rooms if s.isdigit())
                    tot = int(current_total) if current_total and str(current_total).isdigit() else seat_sum
                    records.append({
                        "date": current_date,
                        "slot": current_slot,
                        "courseCode": current_course_code,
                        "courseTitle": current_course_title,
                        "teacher": current_teacher,
                        "section": current_section,
                        "rooms": list(current_rooms),
                        "roomString": ", ".join(f"{r}({s})" for r, s in current_rooms),
                        "total": tot
                    })
            current_rooms = []

        for page in pdf.pages:
            text = page.extract_text() or ""
            d_m = re.search(r'Date:\s*([\d-]+)', text)
            if d_m:
                raw_d = d_m.group(1).strip()
                parts = raw_d.split("-")
                if len(parts) == 3:
                    if len(parts[0]) == 4:
                        current_date = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                    else:
                        current_date = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"

            s_m = re.search(r'Slot:\s*([A-Za-z0-9]+)', text)
            if s_m:
                new_slot = s_m.group(1).strip().upper()
                if new_slot != current_slot:
                    flush_current()
                    current_slot = new_slot
                    current_course_code = None
                    current_course_title = None
                    current_section = None

            tables = page.extract_tables()
            if not tables:
                continue

            for row in tables[0]:
                if not row or not any(row):
                    continue

                row_str = " ".join(clean_text(c) for c in row)
                if "Course Code" in row_str or "Course Title" in row_str or "Room No" in row_str:
                    continue
                if row_str.startswith("Total") and (len(row) <= 4 or not row[4]):
                    flush_current()
                    current_section = None
                    continue

                c_code = clean_text(row[1]) if len(row) > 1 else ""
                c_title = clean_text(row[2]) if len(row) > 2 else ""
                c_tech = clean_text(row[3]) if len(row) > 3 else ""
                c_sec = clean_text(row[4]) if len(row) > 4 else ""
                c_room = clean_text(row[5]) if len(row) > 5 else ""
                c_seats = clean_text(row[6]) if len(row) > 6 else ""
                c_tot = clean_text(row[7]) if len(row) > 7 else ""

                c_code = " ".join(c_code.split())
                c_title = " ".join(c_title.split())
                c_tech = " ".join(c_tech.split())
                c_sec = " ".join(c_sec.split())
                c_room = " ".join(c_room.split())
                c_seats = " ".join(c_seats.split())
                c_tot = " ".join(c_tot.split())

                if c_code and (re.match(r'^[A-Z]{2,4}\d{3}', c_code) or any(k in c_code for k in ['CSE', 'ENG', 'MAT', 'PHY', 'BNS', 'ACT'])):
                    current_course_code = c_code
                if c_title:
                    current_course_title = c_title

                if c_sec:
                    if c_sec == current_section and current_rooms:
                        if c_room and c_seats:
                            current_rooms.append((c_room, c_seats))
                        if c_tot:
                            current_total = c_tot
                        continue

                    flush_current()
                    current_section = c_sec
                    if c_tech:
                        current_teacher = c_tech
                    if c_tot:
                        current_total = c_tot
                    if c_room and c_seats:
                        current_rooms.append((c_room, c_seats))
                else:
                    if c_room and c_seats:
                        current_rooms.append((c_room, c_seats))

        flush_current()

    return records

def main():
    pdf_files = []
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            matches = glob.glob(arg)
            if matches:
                pdf_files.extend(matches)
            elif os.path.exists(arg):
                pdf_files.append(arg)
    else:
        for p in DEFAULT_SEARCH_PATHS:
            pdf_files.extend(glob.glob(p))

    pdf_files = sorted(list(set(pdf_files)))
    if not pdf_files:
        print("No Daily Seat Details PDF files found.")
        sys.exit(0)

    print(f"Found {len(pdf_files)} PDF file(s):")
    for p in pdf_files:
        print(f"  - {p}")

    # Load existing records if any
    existing_map = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for r in existing:
                    existing_map[(r["section"], r["date"])] = r
        except Exception:
            pass

    new_count = 0
    updated_count = 0
    for p in pdf_files:
        records = parse_pdf(p)
        for r in records:
            k = (r["section"], r["date"])
            if k in existing_map:
                updated_count += 1
            else:
                new_count += 1
            existing_map[k] = r

    merged_records = list(existing_map.values())
    # Sort deterministically by date, slot, section
    merged_records.sort(key=lambda x: (x.get("date", ""), x.get("slot", ""), x.get("section", "")))

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged_records, f, indent=2)

    print("=" * 60)
    print(f"Successfully saved {len(merged_records)} seat records to {OUTPUT_FILE}")
    print(f"New: {new_count}, Updated/Overwritten: {updated_count}")

if __name__ == "__main__":
    main()
