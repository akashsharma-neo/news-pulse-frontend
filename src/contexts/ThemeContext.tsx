"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeToDocument,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  readStoredTheme,
  THEME_ACCENT_KEY,
  THEME_MODE_KEY,
  type ThemeAccent,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: ThemeAccent;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [accent, setAccentState] = useState<ThemeAccent>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setModeState(stored.mode);
    setAccentState(stored.accent);
    applyThemeToDocument(stored.mode, stored.accent);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyThemeToDocument(mode, accent);
    localStorage.setItem(THEME_MODE_KEY, mode);
    localStorage.setItem(THEME_ACCENT_KEY, accent);
  }, [mode, accent, ready]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const setAccent = useCallback((next: ThemeAccent) => setAccentState(next), []);

  const value = useMemo(
    () => ({ mode, accent, setMode, setAccent }),
    [mode, accent, setMode, setAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
