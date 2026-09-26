#!/usr/bin/env python3
"""
Sync Version 3.1 Routine directly into src/data/official-routine.json
Converts upstream V3.1 schedule data into our exact RoutineClass schema.
Zero ongoing dependencies.
"""

import os
import re
import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BATCH_DEFINITIONS = [
    {"batch": 73, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T']},
    {"batch": 72, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V']},
    {"batch": 71, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L']},
    {"batch": 70, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R']},
    {"batch": 69, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']},
    {"batch": 68, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']},
    {"batch": 67, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']},
    {"batch": 66, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']},
    {"batch": 65, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P']},
    {"batch": 64, "letters": ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']},
    {"batch": 63, "letters": ['A','B','C','D','E','F','G','H']},
]

ALL_SECTIONS = [f"{b['batch']}_{l}" for b in BATCH_DEFINITIONS for l in b["letters"]]

URL = "https://routine.zohirrayhan.me/api/schedule"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Referer": "https://routine.zohirrayhan.me/",
    "Origin": "https://routine.zohirrayhan.me"
}

def parse_12h_time(t_str: str) -> str:
    parts = t_str.strip().split(":")
    h = int(parts[0])
    m = parts[1] if len(parts) > 1 else "00"
    if 1 <= h <= 7:
        h += 12
    return f"{h:02d}:{m}"

def fetch_section(sec_id: str):
    payload = json.dumps({"view_mode": "student", "batch": sec_id, "department": "cse"}).encode()
    req = urllib.request.Request(URL, data=payload, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            data = json.loads(res.read().decode())
            if data.get("success") and isinstance(data.get("result"), list):
                return sec_id, data.get("result", []), data.get("version", "3.1")
    except Exception as e:
        print(f"Error fetching {sec_id}: {e}")
    return sec_id, [], "3.1"

def main():
    print(f"Starting fetch for {len(ALL_SECTIONS)} sections...")
    start_time = time.time()

    results = {}
    routine_version = "3.1"

    with ThreadPoolExecutor(max_workers=6) as executor:
        for sec_id, raw_classes, ver in executor.map(fetch_section, ALL_SECTIONS):
            if raw_classes:
                results[sec_id] = raw_classes
                routine_version = ver

    elapsed = time.time() - start_time
    print(f"Fetched {len(results)} active sections in {elapsed:.2f}s (Version: {routine_version})")

    # Map to RoutineClass schema
    by_section = {}
    by_teacher = {}
    unique_rooms = set()
    total_class_count = 0

    for sec_id, raw_list in results.items():
        batch_num, sec_letter = sec_id.split("_")
        mapped_classes = []

        for idx, item in enumerate(raw_list):
            course_raw = item.get("course_code", "").strip()
            # Parse code and subsection e.g. CSE114(72_O2)
            m = re.match(r"^([A-Z0-9]+)\(([0-9]+)_([A-Za-z]+)([12])?\)", course_raw)
            course_code = m.group(1) if m else course_raw.split("(")[0].strip()
            sub_sec = m.group(4) if (m and m.group(4)) else None

            time_raw = item.get("time_slot", "08:30-10:00")
            start_raw, end_raw = (time_raw.split("-") if "-" in time_raw else ("08:30", "10:00"))
            start_time = parse_12h_time(start_raw)
            end_time = parse_12h_time(end_raw)

            day_raw = item.get("day", "SATURDAY").upper().strip()
            valid_days = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"]
            day_of_week = day_raw if day_raw in valid_days else "SATURDAY"

            sh, sm = map(int, start_time.split(":"))
            eh, em = map(int, end_time.split(":"))
            dur = (eh * 60 + em) - (sh * 60 + sm)

            title = item.get("course_title", "").strip()
            is_lab = "LAB" in title.upper() or "SESSIONAL" in title.upper() or sub_sec is not None or dur >= 150

            room = item.get("room", "").replace("\n", " ").strip()
            teacher = item.get("teacher", "TBA").strip()

            sub_id = f"sub{sub_sec}" if sub_sec else "common"
            slot_id = f"{sec_id}-{course_code}-{sub_id}-{day_of_week}-{start_time.replace(':', '')}-{idx}"

            cls_obj = {
                "id": slot_id,
                "batch": batch_num,
                "section": sec_letter,
                "sectionId": sec_id,
                "subSection": sub_sec,
                "courseCode": f"{course_code}({sec_id}{sub_sec})" if sub_sec else f"{course_code}({sec_id})",
                "courseTitle": title if title else course_code,
                "teacherCode": teacher if teacher else "TBA",
                "room": room,
                "dayOfWeek": day_of_week,
                "startTime": start_time,
                "endTime": end_time,
                "type": "Lab" if is_lab else "Theory",
                "color": ("amber" if sub_sec == "1" else "rose") if is_lab else "indigo"
            }

            mapped_classes.append(cls_obj)
            total_class_count += 1
            unique_rooms.add(room)

            # Index by teacher
            if teacher and teacher != "TBA":
                if teacher not in by_teacher:
                    by_teacher[teacher] = []
                by_teacher[teacher].append(cls_obj)

        by_section[sec_id] = mapped_classes

    out_payload = {
        "version": f"Fall 2026 V{routine_version}",
        "totalClasses": total_class_count,
        "totalSections": len(by_section),
        "totalTeachers": len(by_teacher),
        "sections": by_section,
        "teachers": by_teacher,
        "rooms": sorted(list(unique_rooms))
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "official-routine.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_payload, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {out_path} with {total_class_count} classes across {len(by_section)} sections and {len(by_teacher)} teachers!")

if __name__ == "__main__":
    main()
