
import React, { useState } from 'react';
import { useMeters } from '../context/MeterContext';
import { Calendar, Clock, ArrowRight, Table, FileText, Activity } from 'lucide-react';
import { Meter } from '../types';

const History: React.FC = () => {
  const { meters } = useMeters();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">History & Reports</h2>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Daily Logs
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Monthly Bills
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meters.map((meter) => (
          activeTab === 'daily' 
            ? <DailyHistoryCard key={meter.id} meter={meter} />
            : <MonthlyBillCard key={meter.id} meter={meter} />
        ))}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const DailyHistoryCard: React.FC<{ meter: Meter }> = ({ meter }) => {
  // Group history by Month Year
  // NOTE: meter.history should ONLY contain daily logs now, not monthly resets
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, typeof meter.history> = {};
    meter.history.forEach(reading => {
      const date = new Date(reading.date);
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(reading);
    });
    return groups;
  }, [meter.history]);

  const sortedKeys = Object.keys(groupedHistory).sort((a, b) => {
     return new Date(groupedHistory[b][0].date).getTime() - new Date(groupedHistory[a][0].date).getTime();
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]">
      <MeterHeader meter={meter} colorClass={meter.family === 'A' ? 'indigo' : 'emerald'} />
      
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin dark:scrollbar-thumb-slate-700">
        {meter.history.length === 0 ? (
          <EmptyState message="No daily readings recorded yet" />
        ) : (
          <div className="text-sm">
            {sortedKeys.map(monthKey => (
              <div key={monthKey}>
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 border-y border-slate-100 dark:border-slate-700">
                  {monthKey}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {groupedHistory[monthKey].map(reading => (
                    <div key={reading.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(reading.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">
                             {new Date(reading.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      </div>
                      <div className="font-mono font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {reading.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MonthlyBillCard: React.FC<{ meter: Meter }> = ({ meter }) => {
  const monthlyData = React.useMemo(() => {
    if (!meter.monthlyBaselines) return [];

    const sortedMonths = Object.keys(meter.monthlyBaselines).sort();
    const result = [];

    for (let i = 0; i < sortedMonths.length - 1; i++) {
      const startMonth = sortedMonths[i];
      const endMonth = sortedMonths[i+1];
      
      const startReading = meter.monthlyBaselines[startMonth];
      const endReading = meter.monthlyBaselines[endMonth];
      const units = endReading - startReading;

      const dateObj = new Date(startMonth + '-02'); // Add day to avoid timezone shifts
      const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

      result.push({
        label,
        closingReading: endReading,
        units,
        isProjected: false
      });
    }

    if (sortedMonths.length > 0) {
        const lastMonthKey = sortedMonths[sortedMonths.length - 1];
        const lastBaseline = meter.monthlyBaselines[lastMonthKey];
        const currentUsage = meter.latestReading - lastBaseline;
        
        const dateObj = new Date(lastMonthKey + '-02');
        const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // This last entry is the "Running" month
        result.push({
            label: `${label} (Running)`,
            closingReading: meter.latestReading,
            units: currentUsage,
            isProjected: true
        });
    }

    return result.reverse();
  }, [meter.monthlyBaselines, meter.latestReading]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]">
      <MeterHeader meter={meter} colorClass={meter.family === 'A' ? 'indigo' : 'emerald'} isMonthly={true} />
      
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin dark:scrollbar-thumb-slate-700">
        {monthlyData.length === 0 ? (
          <EmptyState message="No monthly billing cycles recorded yet." />
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold text-right">Closing Reading</th>
                <th className="px-4 py-3 font-semibold text-right">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyData.map((row, idx) => (
                <tr key={idx} className={row.isProjected ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex flex-col">
                        <span>{row.label}</span>
                        {row.isProjected && <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase">Current Cycle</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                    {row.closingReading.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block min-w-[3rem] text-center px-2 py-1 rounded font-bold ${
                        row.isProjected 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                        {row.units.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const MeterHeader: React.FC<{ meter: Meter, colorClass: string, isMonthly?: boolean }> = ({ meter, colorClass, isMonthly }) => (
  <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900`}>
    <div>
       <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">{meter.name}</div>
       <div className="text-xs text-slate-400 font-mono">{meter.meterNumber}</div>
    </div>
    <div className="flex flex-col items-end gap-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-${colorClass}-50 dark:bg-${colorClass}-900/20 text-${colorClass}-600 dark:text-${colorClass}-400 border-${colorClass}-100 dark:border-${colorClass}-800`}>
            {meter.family}
        </span>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3 p-8 text-center">
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full">
        <Clock className="w-6 h-6 opacity-40" />
    </div>
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export default History;
