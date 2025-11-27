
export type Family = string;

export interface Reading {
  id: string;
  date: string;
  value: number;
}

export interface Meter {
  id: string;
  name: string;
  meterNumber: string; // Reference Number
  family: Family;
  isCurrent: boolean; // Active/Highlighted status
  lastMonthReading: number;
  latestReading: number;
  lastUpdated?: string; // ISO Date of last update
  history: Reading[];
  monthlyBaselines?: Record<string, number>;
}

export interface MeterContextType {
  meters: Meter[];
  families: string[];
  familyThemes: Record<string, string>; // Maps family name to color name
  addReading: (meterId: string, value: number) => void;
  updateLastMonthReading: (meterId: string, value: number, resetCurrent?: boolean) => void;
  resetAllLastMonthReadings: (readings: { [key: string]: number }, mode: 'reset' | 'correction') => void;
  updateMeterMonthlyBaseline: (meterId: string, monthYear: string, value: number) => void;
  submitMonthlyReading: (meterId: string, monthYear: string, value: number) => void;
  
  // Configuration methods
  addFamily: (name: string, color: string) => void;
  updateFamily: (oldName: string, newName: string, newColor: string) => void;
  deleteFamily: (name: string) => void;
  addMeter: (meter: Omit<Meter, 'history' | 'lastMonthReading' | 'latestReading' | 'isCurrent'>) => void;
  updateMeter: (id: string, updates: Partial<Meter>) => void;
  deleteMeter: (id: string) => void;
  setMeterAsCurrent: (meterId: string) => void;
}
