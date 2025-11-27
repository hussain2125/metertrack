import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const GlobalDialog: React.FC = () => {
  const { dialogState, closeDialog } = useTheme();

  if (!dialogState || !dialogState.isOpen) return null;

  const handleConfirm = () => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    closeDialog();
  };

  const getIcon = () => {
    switch (dialogState.variant) {
      case 'danger': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-indigo-500" />;
    }
  };

  const getButtonClass = () => {
    switch (dialogState.variant) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none';
      default: return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
            {getIcon()}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {dialogState.title}
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {dialogState.message}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-center">
          {dialogState.showCancel && (
            <button
              onClick={closeDialog}
              className="px-4 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
            >
              {dialogState.cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex-1 ${getButtonClass()}`}
          >
            {dialogState.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalDialog;