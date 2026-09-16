'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'diu-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  if (resolved === 'dark') {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
    root.style.colorScheme = 'dark';
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
    root.style.colorScheme = 'light';
    root.setAttribute('data-theme', 'light');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    // Read initial preference asynchronously after mount to prevent hydration cascade
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
      const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;

      setThemeState(initialTheme);
      setResolvedTheme(initialResolved);
      applyThemeClass(initialResolved);
    }, 0);

    // Set up real-time listener for OS color scheme change
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentStored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (!currentStored || currentStored === 'system') {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyThemeClass(nextResolved);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }

    const nextResolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(nextResolved);
    applyThemeClass(nextResolved);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
