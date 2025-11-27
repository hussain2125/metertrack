
import { Meter } from './types';

const now = new Date().toISOString();

export const INITIAL_METERS: Meter[] = [
  { id: 'm1', name: 'Meter 1', meterNumber: 'REF-001', family: 'A', isCurrent: true, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm2', name: 'Meter 2', meterNumber: 'REF-002', family: 'A', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm3', name: 'Meter 3', meterNumber: 'REF-003', family: 'A', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm4', name: 'Meter 4', meterNumber: 'REF-004', family: 'A', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm5', name: 'Meter 5', meterNumber: 'REF-005', family: 'B', isCurrent: true, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm6', name: 'Meter 6', meterNumber: 'REF-006', family: 'B', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm7', name: 'Meter 7', meterNumber: 'REF-007', family: 'B', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
  { id: 'm8', name: 'Meter 8', meterNumber: 'REF-008', family: 'B', isCurrent: false, lastMonthReading: 0, latestReading: 0, lastUpdated: now, history: [] },
];

export const INITIAL_FAMILIES = ['A', 'B'];

export const INITIAL_FAMILY_THEMES: Record<string, string> = {
  'A': 'indigo',
  'B': 'emerald'
};

export const AVAILABLE_COLORS = [
  'indigo', 'emerald', 'amber', 'rose', 'cyan', 'violet', 'orange', 'teal', 'fuchsia'
];
