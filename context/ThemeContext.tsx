import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DialogOptions {
  title: string;
  message: React.ReactNode;
  variant?: 'info' | 'danger' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  dialogState: DialogState | null;
  showConfirm: (options: DialogOptions) => void;
  showAlert: (title: string, message: string) => void;
  closeDialog: () => void;
}

interface DialogState extends DialogOptions {
  isOpen: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check local storage or system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to light theme (false)
    return false;
  });

  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const showConfirm = (options: DialogOptions) => {
    setDialogState({
      ...options,
      isOpen: true,
      showCancel: options.showCancel ?? true,
      variant: options.variant || 'info'
    });
  };

  const showAlert = (title: string, message: string) => {
    setDialogState({
      title,
      message,
      isOpen: true,
      showCancel: false,
      confirmLabel: 'OK',
      variant: 'info'
    });
  };

  const closeDialog = () => {
    setDialogState(null);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, dialogState, showConfirm, showAlert, closeDialog }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};