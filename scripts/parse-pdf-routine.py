#!/usr/bin/env python3
"""
Official DIU CSE Routine PDF Parser
Parses the departmental routine PDF directly into structured JSON for diu-calendar-sync.
Zero external API calls. 100% self-hosted and standalone.
"""

import os
import re
import json
import pdfplumber

def parse_pdf_routine(pdf_path: str, output_path: str):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    days = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY']
    time_slots = [
        ('08:30', '10:00'),
        ('10:00', '11:30'),
        ('11:30', '13:00'),
        ('13:00', '14:30'),
        ('14:30', '16:00'),
        ('16:00', '17:30')
    ]

    all_classes = []
    current_day = 'SATURDAY'

    print(f"Opening PDF: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Scanning {total_pages} pages...")

        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text() or ''
            for d in days:
                if re.search(r'\b' + d + r'\b', text):
                    current_day = d
                    break

            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or len(row) < 18:
                        continue
                    row_str = ' '.join(str(c) for c in row if c)
                    if 'Class Routine' in row_str or 'Effective From' in row_str or 'Room' in row_str or 'SATURDAY' in row_str:
                        continue

                    for slot_idx in range(6):
                        c_idx = slot_idx * 3
                        if c_idx + 2 >= len(row):
                            continue

                        room = (row[c_idx] or '').replace('\n', ' ').strip()
                        course_raw = (row[c_idx + 1] or '').replace('\n', ' ').strip()
                        teacher = (row[c_idx + 2] or '').replace('\n', ' ').strip()

                        if not course_raw or not room or course_raw == '#ERROR!':
                            continue

                        start_time, end_time = time_slots[slot_idx]

                        # Standard section matching: CSE114(72_O2) or CSE228(68_D)
                        m = re.match(r'^([A-Za-z0-9]+)\(([0-9]+)_([A-Za-z]+)([12])?\)', course_raw)
                        if m:
                            course_code = m.group(1).upper()
                            batch = m.group(2)
                            section_letter = m.group(3).upper()
                            sub_sec = m.group(4) if m.group(4) else None
                            section_id = f"{batch}_{section_letter}"
                        else:
                            # Retake or alternative pattern: CSE447(Re_A)
                            m_alt = re.match(r'^([A-Za-z0-9]+)\(([A-Za-z0-9_]+)\)', course_raw)
                            if m_alt:
                                course_code = m_alt.group(1).upper()
                                section_id = m_alt.group(2).upper()
                                batch = "RE"
                                section_letter = section_id
                                sub_sec = None
                            else:
                                continue

                        is_lab = 'LAB' in room.upper() or sub_sec is not None or 'LAB' in course_raw.upper()
                        sub_id = f"sub{sub_sec}" if sub_sec else "common"
                        slot_id = f"{section_id}-{course_code}-{sub_id}-{current_day}-{start_time.replace(':', '')}-{slot_idx}"

                        item = {
                            "id": slot_id,
                            "batch": batch,
                            "section": section_letter,
                            "sectionId": section_id,
                            "subSection": sub_sec,
                            "courseCode": f"{course_code}({section_id}{sub_sec})" if sub_sec else f"{course_code}({section_id})",
                            "courseTitle": course_code, # will be enriched
                            "teacherCode": teacher if teacher else "TBA",
                            "room": room,
                            "dayOfWeek": current_day,
                            "startTime": start_time,
                            "endTime": end_time,
                            "type": "Lab" if is_lab else "Theory",
                            "color": ("amber" if sub_sec == '1' else "rose") if is_lab else "indigo"
                        }
                        all_classes.append(item)

    print(f"Extracted {len(all_classes)} class periods.")

    # Organize by sectionId
    by_section = {}
    by_teacher = {}
    unique_rooms = set()

    for c in all_classes:
        sec = c["sectionId"]
        if sec not in by_section:
            by_section[sec] = []
        by_section[sec].append(c)

        t = c["teacherCode"]
        if t and t != "TBA":
            if t not in by_teacher:
                by_teacher[t] = []
            by_teacher[t].append(c)

        unique_rooms.add(c["room"])

    payload = {
        "version": "Fall 2026 V1.1",
        "totalClasses": len(all_classes),
        "totalSections": len(by_section),
        "totalTeachers": len(by_teacher),
        "sections": by_section,
        "teachers": by_teacher,
        "rooms": sorted(list(unique_rooms))
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(by_section)} sections and {len(by_teacher)} teachers to {output_path}")

if __name__ == "__main__":
    pdf_in = os.path.expanduser(r"~\Downloads\cse-class-routine-fall-2026-v11-1d709bde62.pdf")
    out_json = os.path.join(os.path.dirname(__file__), "..", "src", "data", "official-routine.json")
    parse_pdf_routine(pdf_in, out_json)
