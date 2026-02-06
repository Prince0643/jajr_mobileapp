import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  isHydrated: boolean;
};

const STORAGE_KEY = 'theme_mode';

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const rnScheme = useRNColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } finally {
        if (!alive) return;
        setIsHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const resolvedTheme = useMemo(() => {
    const system = rnScheme === 'dark' ? 'dark' : 'light';
    if (mode === 'system') return system;
    return mode;
  }, [mode, rnScheme]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedTheme,
      isHydrated,
    }),
    [mode, setMode, resolvedTheme, isHydrated]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return ctx;
}
