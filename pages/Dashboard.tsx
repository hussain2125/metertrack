import React, { useState } from 'react';
import { useMeters } from '../context/MeterContext';
import MeterCard from '../components/MeterCard';
import ReadingModal from '../components/ReadingModal';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { meters, families, familyThemes, addReading } = useMeters();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

  const handleAddClick = (meterId: string) => {
    setSelectedMeterId(meterId);
    setIsModalOpen(true);
  };

  const handleSubmit = (meterId: string, value: number) => {
    addReading(meterId, value);
  };

  const selectedMeter = meters.find(m => m.id === selectedMeterId) || null;

  // Header Colors Map matching tailwind classes
  const HEADER_COLORS: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    fuchsia: 'bg-fuchsia-500'
  };

  return (
    <div className="space-y-10 pb-20">
      {families.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
           <p className="text-slate-500 dark:text-slate-400 mb-4">No families or meters configured.</p>
           <Link to="/setup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
             Go to Setup
           </Link>
        </div>
      )}

      {families.map(family => {
        const familyMeters = meters.filter(m => m.family === family);
        if (familyMeters.length === 0) return null;
        
        const themeColor = familyThemes[family] || 'indigo';
        const headerColorClass = HEADER_COLORS[themeColor] || 'bg-indigo-500';

        // Calculate total usage for the family
        const totalFamilyUsage = familyMeters.reduce((acc, meter) => {
          return acc + (meter.latestReading - meter.lastMonthReading);
        }, 0);

        return (
          <section key={family}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-1 rounded-full ${headerColorClass}`}></div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{family}</h2>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                 <Zap className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total:</span>
                 <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{totalFamilyUsage.toLocaleString()} units</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMeters.map(meter => (
                <MeterCard 
                    key={meter.id} 
                    meter={meter} 
                    onAddReading={handleAddClick} 
                    colorTheme={themeColor}
                />
              ))}
            </div>
          </section>
        );
      })}

      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        selectedMeter={selectedMeter}
      />
    </div>
  );
};

export default Dashboard;