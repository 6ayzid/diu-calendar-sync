'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  Server,
  CloudLightning,
} from 'lucide-react';

export function SheetsAdaptationDoc() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const appsScriptCode = `/**
 * Google Apps Script: Standalone RFC 5545 iCalendar Web App
 * Deploy as Web App -> Execute as: Me -> Who has access: Anyone
 */
function doGet(e) {
  var sectionId = (e && e.parameter && e.parameter.section) ? e.parameter.section.toUpperCase() : '68_D';
  var subSection = (e && e.parameter && e.parameter.sub) ? e.parameter.sub : null;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  // Header index mapping
  var headers = data[0].map(function(h) { return h.toString().toLowerCase().trim(); });
  var idxSection = headers.indexOf('sectionid');
  var idxCourse = headers.indexOf('coursecode');
  var idxTitle = headers.indexOf('coursetitle');
  var idxTeacher = headers.indexOf('teachercode');
  var idxRoom = headers.indexOf('room');
  var idxDay = headers.indexOf('dayofweek');
  var idxStart = headers.indexOf('starttime');
  var idxEnd = headers.indexOf('endtime');
  var idxSub = headers.indexOf('subsection');

  // Semester calendar base dates (Effective: Sept 09, 2026, Asia/Dhaka)
  var dayDates = {
    'SATURDAY': '20260912',
    'SUNDAY': '20260913',
    'MONDAY': '20260914',
    'TUESDAY': '20260915',
    'WEDNESDAY': '20260909',
    'THURSDAY': '20260910'
  };

  var icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dept of CSE//Google Apps Script Routine//EN',
    'NAME:CSE Routine ' + sectionId,
    'X-WR-CALNAME:CSE Routine ' + sectionId,
    'TIMEZONE-ID:Asia/Dhaka',
    'X-WR-TIMEZONE:Asia/Dhaka',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowSection = row[idxSection].toString().toUpperCase().trim();
    var rowSub = row[idxSub] ? row[idxSub].toString().trim() : null;

    if (rowSection === sectionId) {
      // Subsection filter: skip if sub requested and doesn't match
      if (subSection && rowSub && rowSub !== subSection) continue;

      var course = row[idxCourse];
      var title = row[idxTitle];
      var teacher = row[idxTeacher];
      var room = row[idxRoom];
      var day = row[idxDay].toString().toUpperCase().trim();
      var start = row[idxStart].toString().replace(':', '') + '00';
      var end = row[idxEnd].toString().replace(':', '') + '00';
      var baseDate = dayDates[day] || '20260912';

      var uid = 'slot-' + sectionId + '-' + course + '-' + (rowSub || 'all') + '-' + day + '-' + start + '@apps-script';

      icsLines.push('BEGIN:VEVENT');
      icsLines.push('UID:' + uid);
      icsLines.push('DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"));
      icsLines.push('DTSTART;TZID=Asia/Dhaka:' + baseDate + 'T' + start);
      icsLines.push('DTEND;TZID=Asia/Dhaka:' + baseDate + 'T' + end);
      icsLines.push('RRULE:FREQ=WEEKLY;UNTIL=20270131T235959;BYDAY=' + day.substring(0, 2));
      icsLines.push('SUMMARY:[' + course + '] ' + title + (rowSub ? ' (Sub ' + rowSub + ')' : ''));
      icsLines.push('LOCATION:' + room);
      icsLines.push('DESCRIPTION:Teacher: ' + teacher + '\\\\nRoom: ' + room + '\\\\nSection: ' + sectionId);
      icsLines.push('END:VEVENT');
    }
  }

  icsLines.push('END:VCALENDAR');
  var icsOutput = icsLines.join('\\r\\n');

  return ContentService.createTextOutput(icsOutput)
    .setMimeType(ContentService.MimeType.ICAL);
}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Alternative Architecture: Google Sheets &amp; Apps Script Guide</span>
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                Serverless Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              How to adapt this system to Google Sheets for zero-code spreadsheet updates by department admins.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white transition-colors">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-5 space-y-6 pt-5 border-t border-slate-800 text-xs text-slate-300">
          {/* Option Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-indigo-300 mb-2">
                <Server className="h-4 w-4" />
                <span>Pattern 1: Next.js API + Google Sheets CSV</span>
              </div>
              <p className="text-slate-400 mb-2">
                Keep the full Next.js UI, timetable grid, and calendar engine, but point the backend to a live Google Sheet:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                <li>File → Share → Publish to web → CSV.</li>
                <li>Set <code className="text-indigo-300 font-bold">GOOGLE_SHEETS_CSV_URL=...</code> in <code className="text-slate-200">.env.local</code>.</li>
                <li>Routine updates in the Sheet reflect live in the API!</li>
              </ol>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-300 mb-2">
                <CloudLightning className="h-4 w-4" />
                <span>Pattern 2: Standalone Google Apps Script (Zero-Server)</span>
              </div>
              <p className="text-slate-400 mb-2">
                Host the calendar feed generator directly inside Google Sheets via Apps Script Web App:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                <li>Open Google Sheet → Extensions → Apps Script.</li>
                <li>Paste the script below and hit Deploy → New Deployment → Web App.</li>
                <li>Get a permanent WebCal endpoint directly from Google!</li>
              </ol>
            </div>
          </div>

          {/* Copyable Google Apps Script Code Block */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Code2 className="h-4 w-4 text-indigo-400" />
                <span>Google Apps Script Implementation (Code.gs)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
              {appsScriptCode}
            </pre>
          </div>

          {/* Sheet Column Schema */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <h4 className="font-bold text-slate-200 mb-2">Expected Google Sheet Column Headers</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 font-mono text-[11px]">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">SectionID</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">CourseCode</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">CourseTitle</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">TeacherCode</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">Room</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">DayOfWeek</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">StartTime</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">EndTime</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">Type</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-indigo-300">SubSection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
