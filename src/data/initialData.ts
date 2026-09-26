import { Employee, Task, WeeklyReport, WeekPeriod } from '../types';

export const WEEK_PERIODS: WeekPeriod[] = [
  {
    id: '2026-W38',
    code: 'Tuần 38',
    label: 'Tuần 38 · 14/09 – 20/09/2026',
    dateRange: '14/09 – 20/09/2026',
  },
  {
    id: '2026-W39',
    code: 'Tuần 39',
    label: 'Tuần 39 · 21/09 – 27/09/2026 (Tuần này)',
    dateRange: '21/09 – 27/09/2026',
    isCurrent: true,
  },
  {
    id: '2026-W40',
    code: 'Tuần 40',
    label: 'Tuần 40 · 28/09 – 04/10/2026',
    dateRange: '28/09 – 04/10/2026',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_WEEKLY_REPORTS: WeeklyReport[] = [];

