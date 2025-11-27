
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Meter, MeterContextType, Reading } from '../types';
import { INITIAL_METERS, INITIAL_FAMILIES, INITIAL_FAMILY_THEMES } from '../constants';
import { db, isConfigured } from '../firebaseConfig';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const MeterContext = createContext<MeterContextType | undefined>(undefined);

// We use a single document 'shared' in collection 'app-data' to keep it simple and atomic
const DOC_REF = doc(db, 'meter-track', 'shared-data');

export const MeterProvider = ({ children }: { children: ReactNode }) => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [familyThemes, setFamilyThemes] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. SYNC: Listen to Firestore changes in real-time
  useEffect(() => {
    if (!isConfigured) return;

    const unsubscribe = onSnapshot(DOC_REF, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Migration/Sanity check for data integrity
        const loadedMeters = (data.meters || []).map((m: any) => ({
             ...m,
             meterNumber: m.meterNumber || '',
             isCurrent: m.isCurrent ?? false,
             history: m.history || [],
             lastUpdated: m.lastUpdated || new Date().toISOString(),
             monthlyBaselines: m.monthlyBaselines || {}
        }));

        setMeters(loadedMeters);
        setFamilies(data.families || INITIAL_FAMILIES);
        setFamilyThemes(data.familyThemes || INITIAL_FAMILY_THEMES);
      } else {
        // First time initialization: Save default data to DB
        saveToDb(INITIAL_METERS, INITIAL_FAMILIES, INITIAL_FAMILY_THEMES);
      }
      setIsLoaded(true);
      setError(null);
    }, (err: any) => {
      // Avoid logging full err object to prevent "circular structure" errors in some envs
      console.error("Firebase Sync Error:", err.message || err);
      
      if (err.code === 'permission-denied' || (err.message && err.message.includes('permission-denied'))) {
        setError('Database Permissions Error. Did you create the Firestore Database in "Test Mode"?');
      } else {
        setError(err.message || 'Unknown sync error');
      }
      
      // Fallback to local defaults if offline/error so app doesn't crash visually
      if (!isLoaded) {
          setMeters(INITIAL_METERS);
          setFamilies(INITIAL_FAMILIES);
          setFamilyThemes(INITIAL_FAMILY_THEMES);
          setIsLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper to save entire state to Firestore
  const saveToDb = async (newMeters: Meter[], newFamilies: string[], newThemes: Record<string, string>) => {
    if (!isConfigured) return;
    try {
        await setDoc(DOC_REF, {
            meters: newMeters,
            families: newFamilies,
            familyThemes: newThemes,
            lastModified: new Date().toISOString()
        });
    } catch (e: any) {
        // Log only message/code to avoid circular structure JSON errors
        console.error("Error saving to DB:", e.code || e.message);
    }
  };

  const addReading = (meterId: string, value: number) => {
    const updatedMeters = meters.map((meter) => {
        if (meter.id !== meterId) return meter;

        const newReading: Reading = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          value: value,
        };

        return {
          ...meter,
          latestReading: value,
          lastUpdated: new Date().toISOString(),
          history: [newReading, ...meter.history],
        };
    });
    saveToDb(updatedMeters, families, familyThemes);
  };

  const updateLastMonthReading = (meterId: string, value: number, resetCurrent = false) => {
    const updatedMeters = meters.map((meter) => {
        if (meter.id !== meterId) return meter;
        return { 
             ...meter, 
             lastMonthReading: value,
             latestReading: resetCurrent ? value : meter.latestReading,
             lastUpdated: new Date().toISOString()
        };
    });
    saveToDb(updatedMeters, families, familyThemes);
  };

  // Deprecated usage in UI, but kept for type compatibility if needed
  const resetAllLastMonthReadings = (readings: { [key: string]: number }, mode: 'reset' | 'correction') => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const updatedMeters = meters.map((meter) => {
        const newValue = readings[meter.id] !== undefined ? readings[meter.id] : meter.lastMonthReading;
        
        // Note: We removed the logic that added to 'history' here to keep daily logs clean
        
        const newBaselines = { ...(meter.monthlyBaselines || {}) };
        if (readings[meter.id] !== undefined) {
            newBaselines[currentMonthKey] = newValue;
        }

        return {
          ...meter,
          lastMonthReading: newValue,
          latestReading: mode === 'reset' ? newValue : meter.latestReading,
          lastUpdated: new Date().toISOString(),
          monthlyBaselines: newBaselines
        };
    });
    
    saveToDb(updatedMeters, families, familyThemes);
  };

  const updateMeterMonthlyBaseline = (meterId: string, monthYear: string, value: number) => {
      const updatedMeters = meters.map(m => {
          if (m.id !== meterId) return m;
          const newBaselines = { ...(m.monthlyBaselines || {}), [monthYear]: value };
          return { ...m, monthlyBaselines: newBaselines };
      });
      saveToDb(updatedMeters, families, familyThemes);
  }

  const submitMonthlyReading = (meterId: string, monthYear: string, value: number) => {
    const updatedMeters = meters.map(m => {
      if (m.id !== meterId) return m;
      
      // 1. Add to monthly baselines (For History > Monthly Bills)
      const newBaselines = { ...(m.monthlyBaselines || {}), [monthYear]: value };
      
      // 2. Update lastMonthReading to reset the counter (For Dashboard > Usage)
      // We do NOT add to m.history (For History > Daily Logs)
      return { 
        ...m, 
        monthlyBaselines: newBaselines,
        lastMonthReading: value,
        lastUpdated: new Date().toISOString()
      };
    });
    saveToDb(updatedMeters, families, familyThemes);
  };

  // --- Configuration Methods ---

  const addFamily = (name: string, color: string) => {
    if (!families.includes(name)) {
      const newFamilies = [...families, name];
      const newThemes = { ...familyThemes, [name]: color };
      saveToDb(meters, newFamilies, newThemes);
    }
  };

  const updateFamily = (oldName: string, newName: string, newColor: string) => {
    const newFamilies = families.map(f => f === oldName ? newName : f);
    
    const newThemes = { ...familyThemes };
    delete newThemes[oldName];
    newThemes[newName] = newColor;

    let newMeters = meters;
    if (oldName !== newName) {
        newMeters = meters.map(m => m.family === oldName ? { ...m, family: newName } : m);
    }
    
    saveToDb(newMeters, newFamilies, newThemes);
  };

  const deleteFamily = (name: string) => {
    const newFamilies = families.filter(f => f !== name);
    const newThemes = { ...familyThemes };
    delete newThemes[name];
    saveToDb(meters, newFamilies, newThemes);
  };

  const addMeter = (newMeterData: Omit<Meter, 'history' | 'lastMonthReading' | 'latestReading' | 'isCurrent'>) => {
    const newMeter: Meter = {
      ...newMeterData,
      lastMonthReading: 0,
      latestReading: 0,
      history: [],
      isCurrent: false,
      lastUpdated: new Date().toISOString(),
    };
    saveToDb([...meters, newMeter], families, familyThemes);
  };

  const updateMeter = (id: string, updates: Partial<Meter>) => {
    const newMeters = meters.map(m => m.id === id ? { ...m, ...updates } : m);
    saveToDb(newMeters, families, familyThemes);
  };

  const deleteMeter = (id: string) => {
    const newMeters = meters.filter(m => m.id !== id);
    saveToDb(newMeters, families, familyThemes);
  };

  const setMeterAsCurrent = (meterId: string) => {
    const targetMeter = meters.find(m => m.id === meterId);
    if (!targetMeter) return;

    const newMeters = meters.map(m => {
      if (m.family === targetMeter.family) {
        return { ...m, isCurrent: m.id === meterId };
      }
      return m;
    });
    saveToDb(newMeters, families, familyThemes);
  };

  // --- Render Helpers ---

  if (!isConfigured) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-indigo-600 dark:border-indigo-400">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Firebase Setup Required</h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                      The app is currently using placeholder keys. To enable database syncing, you must configure your Firebase project.
                  </p>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700 dark:text-slate-300 mb-6 font-medium">
                      <li>Open <a href="https://console.firebase.google.com" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline">Firebase Console</a></li>
                      <li>Create a new project</li>
                      <li>Go to <strong>Project Settings</strong> to get your Config keys</li>
                      <li>Go to <strong>Build &gt; Firestore Database</strong> and click "Create Database" (Select <strong>Test Mode</strong>)</li>
                      <li>Update the file <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded">firebaseConfig.ts</code></li>
                  </ol>
                  <div className="text-center text-xs text-slate-400">
                      Error: Project ID is "your-project-id"
                  </div>
              </div>
          </div>
      );
  }

  return (
    <MeterContext.Provider
      value={{
        meters,
        families,
        familyThemes,
        addReading,
        updateLastMonthReading,
        resetAllLastMonthReadings,
        updateMeterMonthlyBaseline,
        submitMonthlyReading,
        addFamily,
        updateFamily,
        deleteFamily,
        addMeter,
        updateMeter,
        deleteMeter,
        setMeterAsCurrent,
      }}
    >
      {!isLoaded ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
           <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Syncing with database...</p>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg max-w-md mx-auto text-sm">
                    <strong>Connection Error:</strong> {error}
                </div>
              )}
           </div>
        </div>
      ) : (
        children
      )}
    </MeterContext.Provider>
  );
};

export const useMeters = () => {
  const context = useContext(MeterContext);
  if (context === undefined) {
    throw new Error('useMeters must be used within a MeterProvider');
  }
  return context;
};
