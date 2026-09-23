'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Mail,
  Phone,
  ArrowLeftRight,
  CalendarDays,
  Plus,
  ArrowLeft,
  User,
} from 'lucide-react';
import { FacultyMeta } from '@/types/schedule';
import { getFacultyByCode } from '@/data/faculty';

interface FacultyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyCode: string | null;
  initialFaculty?: FacultyMeta | null;
  returnSectionId?: string | null;
  onBackToSection?: (sectionId: string) => void;
  onCompareWithFaculty?: (faculty: FacultyMeta) => void;
  onOpenComparePicker?: () => void;
  onNavigateToFaculty?: (faculty: FacultyMeta) => void;
}

export function FacultyInfoModal({
  isOpen,
  onClose,
  facultyCode,
  initialFaculty,
  returnSectionId,
  onBackToSection,
  onCompareWithFaculty,
  onOpenComparePicker,
  onNavigateToFaculty,
}: FacultyInfoModalProps) {
  const [faculty, setFaculty] = useState<FacultyMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load initial data and query full details
  useEffect(() => {
    if (!isOpen || !facultyCode) {
      setFaculty(null);
      setImageError(false);
      return;
    }

    const cleanCode = facultyCode.trim().toUpperCase();
    const local = initialFaculty || getFacultyByCode(cleanCode) || {
      code: cleanCode,
      name: cleanCode,
      department: 'CSE',
    };
    setFaculty(local);
    setImageError(false);
    setLoading(true);

    let isCancelled = false;

    fetch(`/api/faculty/info?code=${encodeURIComponent(cleanCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          if (data.faculty) {
            setFaculty(data.faculty);
          }
        }
      })
      .catch((err) => {
        console.warn('Faculty info fetch failed:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, facultyCode, initialFaculty]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy to clipboard helper
  const handleCopy = useCallback(async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  }, []);

  if (!isOpen || !facultyCode) return null;

  const currentFac = faculty || {
    code: (facultyCode || '').toUpperCase(),
    name: (facultyCode || '').toUpperCase(),
    department: 'CSE',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faculty-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all overflow-hidden p-5 sm:p-6 space-y-4">
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Optional Back to Section Button */}
        {returnSectionId && onBackToSection && (
          <div className="pr-8 -mb-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onBackToSection(returnSectionId);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Section {returnSectionId}</span>
            </button>
          </div>
        )}

        {/* Faculty Header: Avatar + Copyable Full Name + Designation + Dept. of CSE */}
        <div className="flex items-start gap-3.5 pr-6">
          {!imageError ? (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                src={`/api/faculty/image?code=${encodeURIComponent(currentFac.code)}`}
                alt={currentFac.name}
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover object-center rounded-full"
              />
            </div>
          ) : (
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <User className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 id="faculty-modal-title" className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white leading-tight select-all truncate">
                {currentFac.name}
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(currentFac.name, 'name')}
                title="Copy full name"
                aria-label="Copy full name"
                className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                {copiedKey === 'name' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
              {currentFac.designation || 'Faculty Member'}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {currentFac.department ? `Dept. of ${currentFac.department}` : 'Dept. of CSE'}
            </p>
          </div>
        </div>

          {/* Contact Details Grid (Room, Phone, Email — no duplicated full name, no find room button) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* 1. Assigned Room */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                Assigned Room
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 select-all">
                  {currentFac.room || (loading ? 'Loading...' : 'Not specified')}
                </span>
                {currentFac.room && (
                  <button
                    type="button"
                    onClick={() => handleCopy(currentFac.room!, 'room')}
                    title="Copy room number"
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedKey === 'room' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 2. Phone / Mobile */}
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                Phone / Mobile
              </div>
              <div className="flex items-center justify-between gap-2">
                {(() => {
                  const hasValidPhone = currentFac.phone && currentFac.phone.trim() !== '0' && currentFac.phone.trim().length > 4;
                  return (
                    <>
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 select-all truncate">
                        {hasValidPhone ? currentFac.phone : (loading ? 'Loading...' : 'Not listed')}
                      </span>
                      {hasValidPhone && (
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`tel:${currentFac.phone!.replace(/\s+/g, '')}`}
                            title="Call phone number"
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentFac.phone!, 'phone')}
                            title="Copy phone number"
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            {copiedKey === 'phone' ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 3. Official Email (spans full width on sm) */}
            <div className="sm:col-span-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-2.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                Email
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 select-all truncate">
                  {currentFac.email || (loading ? 'Loading...' : 'Not listed')}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {currentFac.email && (
                    <a
                      href={`mailto:${currentFac.email}`}
                      title="Send email"
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {currentFac.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(currentFac.email!, 'email')}
                      title="Copy email address"
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'email' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: Exactly the 3 requested buttons: Compare, Add Compare, and View */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2">
            {/* 1. Compare */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onCompareWithFaculty?.(currentFac);
              }}
              title={`Compare ${currentFac.name} with current routine`}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs truncate"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Compare</span>
            </button>

            {/* 2. Add Compare */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenComparePicker?.();
              }}
              title="Compare with another section or teacher routine"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs truncate"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Add</span>
            </button>

            {/* 3. View */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToFaculty?.(currentFac);
              }}
              title="View full routine for this faculty"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs truncate"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">View</span>
            </button>
          </div>
      </div>
    </div>
  );
}
