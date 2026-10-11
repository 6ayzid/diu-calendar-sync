export interface DepartmentHoliday {
  id: string;
  name: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dates: string[];   // List of ISO dates YYYY-MM-DD
}

export const DEPARTMENT_HOLIDAYS: DepartmentHoliday[] = [
  {
    id: 'durga-puja-2026',
    name: 'Durga Puja',
    title: 'Durga Puja Vacation (University Closed)',
    description:
      'All classes of Daffodil International University (DIU) will remain closed from 19 October to 22 October on the occasion of Durga Puja. Official notice issued by Dr. Mohammed Nadir Bin Ali, Registrar, DIU.',
    startDate: '2026-10-19',
    endDate: '2026-10-22',
    dates: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'],
  },
];

/**
 * Returns active department holiday if given date falls within a holiday period.
 */
export function getDepartmentHoliday(isoDate: string): DepartmentHoliday | null {
  if (!isoDate) return null;
  const clean = isoDate.trim();
  for (const holiday of DEPARTMENT_HOLIDAYS) {
    if (holiday.dates.includes(clean)) {
      return holiday;
    }
  }
  return null;
}
