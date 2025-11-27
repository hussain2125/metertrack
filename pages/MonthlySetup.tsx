import React, { useState, useEffect } from 'react';
import { useMeters } from '../context/MeterContext';
import { useTheme } from '../context/ThemeContext';
import { Save, RotateCcw, Settings, Plus, Trash2, Edit2, X, Check, Palette, Lock, Calendar, Unlock } from 'lucide-react';
import { Meter } from '../types';
import { AVAILABLE_COLORS } from '../constants';

const MonthlySetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'config'>('monthly');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 px-2 ${
            activeTab === 'monthly'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
           Monthly Readings
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 px-2 ${
            activeTab === 'config'
              ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
           Configuration (Meters & Families)
        </button>
      </div>

      {activeTab === 'monthly' ? <MonthlyReadingsPanel /> : <ConfigurationPanel />}
    </div>
  );
};

// --- Sub-Components ---

const MonthlyReadingsPanel: React.FC = () => {
  const { meters } = useMeters();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-20">
       <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-sm text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50">
          <strong>How it works:</strong> Select the month you want to close. Enter the reading from your bill. 
          Once saved, this reading becomes the <em>baseline</em> for the next month's usage calculation, and the record is <strong>locked</strong>.
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {meters.map(meter => (
              <MeterSetupCard key={meter.id} meter={meter} />
          ))}
      </div>
    </div>
  );
};

const MeterSetupCard: React.FC<{ meter: Meter }> = ({ meter }) => {
    const { submitMonthlyReading } = useMeters();
    const { showConfirm, showAlert } = useTheme();

    // Default to current month string YYYY-MM
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState<string>(getCurrentMonth);
    const [inputValue, setInputValue] = useState<string>('');
    const [isEditingLocked, setIsEditingLocked] = useState(false);

    // Check if this month is already saved/locked
    const savedValue = meter.monthlyBaselines?.[selectedDate];
    const isLocked = savedValue !== undefined;

    // Reset editing state when date changes
    useEffect(() => {
        setIsEditingLocked(false);
        setInputValue('');
    }, [selectedDate]);

    const handleSave = () => {
        if (!inputValue) return;
        const val = parseFloat(inputValue);
        if (isNaN(val)) {
            showAlert("Invalid Input", "Please enter a valid number.");
            return;
        }

        const dateObj = new Date(selectedDate + '-01');
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

        showConfirm({
            title: `Lock Reading for ${monthName}?`,
            message: `You are about to save ${val} as the reading for ${monthName}. This will update the usage counter.`,
            variant: 'success',
            confirmLabel: 'Lock & Save',
            onConfirm: () => {
                submitMonthlyReading(meter.id, selectedDate, val);
                setInputValue('');
                setIsEditingLocked(false);
            }
        });
    };

    const handleUnlock = () => {
        showConfirm({
            title: 'Edit Locked Reading',
            message: 'Are you sure you want to edit a locked reading? This may affect usage calculations for that month.',
            variant: 'danger',
            confirmLabel: 'Yes, Edit',
            onConfirm: () => {
                setIsEditingLocked(true);
                if (savedValue !== undefined) {
                    setInputValue(savedValue.toString());
                }
            }
        });
    };

    const fillCurrent = () => {
        setInputValue(meter.latestReading.toString());
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">{meter.name}</div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{meter.meterNumber}</div>
                </div>
                <div className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                    {meter.family}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Date Selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> Billing Month
                    </label>
                    <input 
                        type="month" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {isLocked && !isEditingLocked ? (
                    // LOCKED STATE
                    <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 animate-in fade-in">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full mb-2">
                            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Reading Locked</span>
                        <div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {savedValue?.toLocaleString()}
                        </div>
                        <button 
                            onClick={handleUnlock}
                            className="mt-3 text-xs flex items-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <Unlock className="w-3 h-3" /> Edit Reading
                        </button>
                    </div>
                ) : (
                    // EDIT STATE
                    <div className="flex-1 flex flex-col gap-4 animate-in fade-in">
                         <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">New Reading</label>
                                <button onClick={fillCurrent} className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                                    <RotateCcw className="w-3 h-3"/> Copy Live ({meter.latestReading})
                                </button>
                            </div>
                            <input 
                                type="number" 
                                placeholder="0.00"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full text-2xl font-mono p-3 border-2 border-indigo-100 dark:border-indigo-900 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-right bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="flex gap-2">
                             {isEditingLocked && (
                                 <button
                                    onClick={() => setIsEditingLocked(false)}
                                    className="px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                 >
                                     Cancel
                                 </button>
                             )}
                            <button 
                                onClick={handleSave}
                                disabled={!inputValue}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                    inputValue 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                }`}
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConfigurationPanel: React.FC = () => {
  const { meters, families, familyThemes, addFamily, updateFamily, deleteFamily, addMeter, updateMeter, deleteMeter } = useMeters();
  const { showConfirm, showAlert } = useTheme();
  
  const [editingFamily, setEditingFamily] = useState<{old: string, new: string, color: string} | null>(null);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyColor, setNewFamilyColor] = useState('indigo');
  
  const [editingMeter, setEditingMeter] = useState<Partial<Meter> | null>(null); 

  const handleAddFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if(newFamilyName.trim()) {
        addFamily(newFamilyName.trim(), newFamilyColor);
        setNewFamilyName('');
    }
  }

  const handleUpdateFamily = (oldName: string) => {
    if (editingFamily?.new.trim()) {
        updateFamily(oldName, editingFamily.new.trim(), editingFamily.color);
        setEditingFamily(null);
    }
  }
  
  const handleDeleteFamily = (name: string) => {
      const hasMeters = meters.some(m => m.family === name);
      if(hasMeters) {
          showAlert('Cannot Delete', `Family "${name}" cannot be deleted because it has meters attached. Please remove or reassign the meters first.`);
          return;
      }
      showConfirm({
          title: 'Delete Family',
          message: `Are you sure you want to delete family "${name}"?`,
          variant: 'danger',
          onConfirm: () => deleteFamily(name)
      });
  }

  const handleSaveMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeter || !editingMeter.name || !editingMeter.family) return;

    if (editingMeter.id) {
        updateMeter(editingMeter.id, editingMeter);
    } else {
        addMeter({
            id: `m-${Date.now()}`,
            name: editingMeter.name,
            meterNumber: editingMeter.meterNumber || '',
            family: editingMeter.family,
        });
    }
    setEditingMeter(null);
  };

  const handleDeleteMeter = (id: string) => {
      showConfirm({
          title: 'Delete Meter',
          message: 'Are you sure you want to delete this meter? This action cannot be undone.',
          variant: 'danger',
          onConfirm: () => deleteMeter(id)
      });
  }

  const ColorPicker = ({ selected, onSelect }: { selected: string, onSelect: (c: string) => void }) => (
      <div className="flex flex-wrap gap-2 mt-2">
          {AVAILABLE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => onSelect(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selected === color ? 'border-slate-600 dark:border-slate-200 scale-110' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: `var(--color-${color}-400)` }} 
              >
                 <div className={`w-full h-full rounded-full bg-${color}-500`} />
              </button>
          ))}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 pb-20">
        
        {/* Families Section */}
        <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-slate-400" />
                Manage Families
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Add New Family</h4>
                    <form onSubmit={handleAddFamily} className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Family Name (e.g. C)" 
                            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                        />
                        <div>
                             <label className="text-xs text-slate-400 font-medium">Theme Color</label>
                             <ColorPicker selected={newFamilyColor} onSelect={setNewFamilyColor} />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2 text-sm font-medium">
                            <Plus className="w-4 h-4" /> Create Family
                        </button>
                    </form>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                     <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Existing Families</h4>
                     <div className="space-y-2">
                         {families.map(family => (
                             <div key={family} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                 {editingFamily?.old === family ? (
                                     <div className="flex flex-col gap-2 flex-1">
                                         <div className="flex gap-2">
                                            <input 
                                                value={editingFamily.new} 
                                                onChange={(e) => setEditingFamily({...editingFamily, new: e.target.value})}
                                                className="flex-1 bg-white dark:bg-slate-700 border border-indigo-300 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateFamily(family)} className="text-indigo-600 dark:text-indigo-400 p-1"><Check className="w-4 h-4"/></button>
                                            <button onClick={() => setEditingFamily(null)} className="text-slate-400 p-1"><X className="w-4 h-4"/></button>
                                         </div>
                                         <div className="pb-1">
                                             <ColorPicker selected={editingFamily.color} onSelect={(c) => setEditingFamily({...editingFamily, color: c})} />
                                         </div>
                                     </div>
                                 ) : (
                                     <>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full bg-${familyThemes[family] || 'indigo'}-500`} />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{family}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => setEditingFamily({old: family, new: family, color: familyThemes[family] || 'indigo'})} 
                                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteFamily(family)} 
                                                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                     </>
                                 )}
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </section>

        {/* Meters Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    Manage Meters
                </h3>
                <button 
                    onClick={() => setEditingMeter({ name: '', meterNumber: '', family: families[0] || '' })}
                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Add Meter
                </button>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                 <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                         <tr>
                             <th className="px-4 py-3 font-medium">Name</th>
                             <th className="px-4 py-3 font-medium">Ref #</th>
                             <th className="px-4 py-3 font-medium">Family</th>
                             <th className="px-4 py-3 font-medium text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {meters.map(meter => (
                             <tr key={meter.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                 <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{meter.name}</td>
                                 <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{meter.meterNumber}</td>
                                 <td className="px-4 py-3">
                                     <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                                         {meter.family}
                                     </span>
                                 </td>
                                 <td className="px-4 py-3 text-right space-x-2">
                                     <button 
                                        onClick={() => setEditingMeter(meter)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1"
                                        title="Edit"
                                     >
                                         <Edit2 className="w-4 h-4" />
                                     </button>
                                     <button 
                                        onClick={() => handleDeleteMeter(meter.id)}
                                        className="text-red-400 hover:text-red-500 p-1"
                                        title="Delete"
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 </div>
             </div>
        </section>

        {/* Meter Edit Modal/Overlay */}
        {editingMeter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingMeter.id ? 'Edit Meter' : 'New Meter'}</h3>
                        <button onClick={() => setEditingMeter(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full"><X className="w-5 h-5"/></button>
                    </div>
                    <form onSubmit={handleSaveMeter} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Meter Name</label>
                            <input 
                                required
                                value={editingMeter.name || ''}
                                onChange={(e) => setEditingMeter({...editingMeter, name: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. Kitchen Meter"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Reference / Meter Number</label>
                            <input 
                                value={editingMeter.meterNumber || ''}
                                onChange={(e) => setEditingMeter({...editingMeter, meterNumber: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. 12345678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Family</label>
                            <select 
                                required
                                value={editingMeter.family || ''}
                                onChange={(e) => setEditingMeter({...editingMeter, family: e.target.value})}
                                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded-lg p-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                                <option value="" disabled>Select a Family</option>
                                {families.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                                Save Meter
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default MonthlySetup;