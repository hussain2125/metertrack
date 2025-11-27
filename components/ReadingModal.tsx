import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Meter } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meterId: string, value: number) => void;
  selectedMeter: Meter | null;
}

const ReadingModal: React.FC<ReadingModalProps> = ({ isOpen, onClose, onSubmit, selectedMeter }) => {
  const [reading, setReading] = useState<string>('');
  const [error, setError] = useState('');
  const { showConfirm } = useTheme();

  useEffect(() => {
    if (isOpen && selectedMeter) {
      // Pre-fill with empty to allow typing
      setReading(''); 
      setError('');
    }
  }, [isOpen, selectedMeter]);

  if (!isOpen || !selectedMeter) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(reading);
    if (isNaN(val)) {
      setError('Please enter a valid number');
      return;
    }
    
    // Strict Validation: Cannot be lower than the Baseline (Previous Month Reading)
    // because usage cannot be negative for the current bill.
    if (val < selectedMeter.lastMonthReading) {
        setError(`Reading cannot be lower than Previous Month's Reading (${selectedMeter.lastMonthReading})`);
        return;
    }
    
    if (val < 0) {
      setError('Reading cannot be negative');
      return;
    }

    const processSubmit = () => {
        onSubmit(selectedMeter.id, val);
        onClose();
    };

    // Soft Validation: Warning if lower than previous daily reading
    if (val < selectedMeter.latestReading) {
        showConfirm({
            title: 'Lower Reading Detected',
            message: `The new reading (${val}) is lower than the last recorded entry (${selectedMeter.latestReading}). Are you sure this is correct?`,
            variant: 'danger',
            confirmLabel: 'Yes, Save it',
            onConfirm: processSubmit
        });
        return;
    }

    processSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Update Reading</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Meter
            </label>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
              {selectedMeter.name} <span className="text-slate-400 dark:text-slate-600 font-normal mx-1">•</span> {selectedMeter.family}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Current Reading
            </label>
            <div className="text-sm text-slate-500 dark:text-slate-500 mb-2">
                Previous Month Baseline: <span className="font-mono font-medium text-slate-800 dark:text-slate-300">{selectedMeter.lastMonthReading}</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="Enter new value..."
              className="w-full text-2xl font-mono p-3 border-2 border-indigo-100 dark:border-indigo-900 rounded-lg focus:border-indigo-500 focus:ring-0 outline-none transition-colors text-center text-indigo-900 dark:text-indigo-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 bg-white dark:bg-slate-950"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Save className="w-5 h-5" />
              Save Reading
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReadingModal;