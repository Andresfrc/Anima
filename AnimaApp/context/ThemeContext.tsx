import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorsLight, ColorsDark, Colors } from '../constants/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeType;
  colors: typeof ColorsLight;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [mode, setMode] = useState<ThemeType>('system');
  const [activeScheme, setActiveScheme] = useState<'light' | 'dark'>('light');

  // Load saved theme
  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((saved) => {
      if (saved) setMode(saved as ThemeType);
    });
  }, []);

  // Determine active scheme
  useEffect(() => {
    if (mode === 'system') {
      setActiveScheme(systemScheme ?? 'light');
    } else {
      setActiveScheme(mode as 'light' | 'dark');
    }
  }, [mode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      let next: ThemeType;
      // If currently system, switch to the OPPOSITE of what is currently showing
      if (prev === 'system') {
        const current = systemScheme ?? 'light';
        next = current === 'light' ? 'dark' : 'light';
      } else {
        next = prev === 'light' ? 'dark' : 'light';
      }
      
      // Debug log removed (was leaking state info to console in production)
      AsyncStorage.setItem('themeMode', next);
      return next;
    });
  }, [systemScheme]);

  const setTheme = useCallback((newMode: ThemeType) => {
    setMode(newMode);
    AsyncStorage.setItem('themeMode', newMode);
  }, []);

  const value = React.useMemo(() => ({
    theme: activeScheme,
    mode,
    colors: activeScheme === 'dark' ? ColorsDark : ColorsLight,
    isDark: activeScheme === 'dark',
    toggleTheme,
    setTheme,
  }), [activeScheme, mode, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
