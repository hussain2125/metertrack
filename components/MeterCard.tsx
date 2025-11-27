import React, { useState, useEffect } from 'react';
import { Meter } from '../types';
import { TrendingUp, Hash, Copy, Check, Star, Clock, AlertTriangle } from 'lucide-react';
import { useMeters } from '../context/MeterContext';

interface MeterCardProps {
  meter: Meter;
  onAddReading: (meterId: string) => void;
  colorTheme: string;
}

// Color definitions map including dark mode variants
const COLOR_STYLES: Record<string, any> = {
  indigo: { 
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
    border: 'border-indigo-100 dark:border-indigo-800', 
    text: 'text-indigo-900 dark:text-indigo-100', 
    badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300', 
    sub: 'text-indigo-600 dark:text-indigo-400', 
    btn: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50' 
  },
  emerald: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    border: 'border-emerald-100 dark:border-emerald-800', 
    text: 'text-emerald-900 dark:text-emerald-100', 
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300', 
    sub: 'text-emerald-600 dark:text-emerald-400', 
    btn: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
  },
  red: { 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-200 dark:border-red-800', 
    text: 'text-red-900 dark:text-red-100', 
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300', 
    sub: 'text-red-600 dark:text-red-400', 
    btn: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50' 
  },
  orange: { 
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    border: 'border-orange-200 dark:border-orange-800', 
    text: 'text-orange-900 dark:text-orange-100', 
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300', 
    sub: 'text-orange-600 dark:text-orange-400', 
    btn: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50' 
  },
};

// Helper for dynamic colors if not in map (using safe defaults or specific tailwind classes)
const getTheme = (color: string) => {
  if (COLOR_STYLES[color]) return COLOR_STYLES[color];
  // Generic fallback using dynamic class names logic is tricky in Tailwind without safelist
  // So we map the common ones explicitly
  const colors = ['amber', 'rose', 'cyan', 'violet', 'orange', 'teal', 'fuchsia'];
  if (colors.includes(color)) {
      return {
          bg: `bg-${color}-50 dark:bg-${color}-900/20`,
          border: `border-${color}-100 dark:border-${color}-800`,
          text: `text-${color}-900 dark:text-${color}-100`,
          badge: `bg-${color}-100 dark:bg-${color}-900/50 text-${color}-700 dark:text-${color}-300`,
          sub: `text-${color}-600 dark:text-${color}-400`,
          btn: `bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-300 hover:bg-${color}-100 dark:hover:bg-${color}-900/50`
      };
  }
  return COLOR_STYLES['indigo'];
};

const MeterCard: React.FC<MeterCardProps> = ({ meter, onAddReading, colorTheme }) => {
  const { setMeterAsCurrent } = useMeters();
  const [copied, setCopied] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  const unitsUsed = meter.latestReading - meter.lastMonthReading;
  const isPositiveUsage = unitsUsed >= 0;

  // Determine actual theme based on usage limits
  let activeThemeKey = colorTheme;
  if (unitsUsed >= 190) {
      activeThemeKey = 'red';
  } else if (unitsUsed >= 180) {
      activeThemeKey = 'orange';
  }
  
  const theme = getTheme(activeThemeKey);

  // Time ago calculator
  useEffect(() => {
    const calculateTimeAgo = () => {
        if (!meter.lastUpdated) {
            setTimeAgo('');
            return;
        }
        const diff = (new Date().getTime() - new Date(meter.lastUpdated).getTime()) / 1000;
        
        if (diff < 60) {
            setTimeAgo('Just now');
        } else if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            setTimeAgo(`${mins}m ago`);
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            setTimeAgo(`${hours}h ago`);
        } else {
            const days = Math.floor(diff / 86400);
            setTimeAgo(`${days}d ago`);
        }
    };

    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [meter.lastUpdated]);

  const handleCopy = () => {
    if (meter.meterNumber) {
      navigator.clipboard.writeText(meter.meterNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col ${
        meter.isCurrent ? 'ring-2 ring-offset-2 ring-yellow-400 dark:ring-yellow-500 dark:ring-offset-slate-900' : ''
      } ${theme.border} bg-white dark:bg-slate-900`}
    >
      {/* Header Band */}
      <div 
        className={`px-4 py-3 flex justify-between items-start cursor-pointer select-none group ${theme.bg}`}
        onClick={handleCopy}
        title="Click to copy Reference Number"
      >
        <div className="flex items-start gap-2">
           <div className={`p-1.5 rounded mt-0.5 ${theme.badge}`}>
             <Hash className="w-4 h-4" />
           </div>
           <div className="flex flex-col">
             <div className="flex items-center gap-1.5">
               <span className={`font-bold tracking-wide leading-tight ${theme.text}`}>
                 {meter.name}
               </span>
               {copied ? (
                 <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in" />
               ) : (
                 <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity text-slate-500 dark:text-slate-400" />
               )}
             </div>
             {meter.meterNumber && (
               <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{meter.meterNumber}</span>
             )}
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white dark:bg-slate-800 ${theme.sub} ${theme.border}`}>
            {meter.family}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); setMeterAsCurrent(meter.id); }}
            className={`transition-colors ${meter.isCurrent ? 'text-yellow-500' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`}
            title={meter.isCurrent ? "Current Running Meter" : "Set as Current Meter"}
          >
            <Star className={`w-4 h-4 ${meter.isCurrent ? 'fill-yellow-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Previous Month</span>
            <div className="text-lg font-mono font-medium text-slate-600 dark:text-slate-300">
              {meter.lastMonthReading.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Current</span>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
              {meter.latestReading.toLocaleString()}
            </div>
            {timeAgo && (
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-end">
             <div>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Usage this month</span>
                 {unitsUsed >= 180 && (
                     <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                         unitsUsed >= 190 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                     }`}>
                         <AlertTriangle className="w-3 h-3" />
                         {unitsUsed >= 190 ? 'High' : 'Warn'}
                     </span>
                 )}
               </div>
               <div className={`flex items-center gap-1 text-2xl font-bold ${isPositiveUsage ? 'text-slate-800 dark:text-slate-200' : 'text-red-500'}`}>
                 {unitsUsed.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">units</span>
               </div>
             </div>
             
             <button
               onClick={() => onAddReading(meter.id)}
               className={`p-2 rounded-full transition-colors ${theme.btn}`}
               aria-label="Add new reading"
             >
               <TrendingUp className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeterCard;