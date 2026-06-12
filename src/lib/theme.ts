export type ThemeMode = "dark" | "light";
export type ThemeAccent = "saffron" | "indigo" | "emerald";

export const THEME_MODE_KEY = "np_theme_mode";
export const THEME_ACCENT_KEY = "np_accent";

export const DEFAULT_MODE: ThemeMode = "dark";
export const DEFAULT_ACCENT: ThemeAccent = "saffron";

export const ACCENT_COLORS: Record<ThemeAccent, string> = {
  saffron: "#f97316",
  indigo: "#6366f1",
  emerald: "#22c55e",
};

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function isThemeAccent(value: string | null): value is ThemeAccent {
  return value === "saffron" || value === "indigo" || value === "emerald";
}

export function readStoredTheme(): { mode: ThemeMode; accent: ThemeAccent } {
  if (typeof window === "undefined") {
    return { mode: DEFAULT_MODE, accent: DEFAULT_ACCENT };
  }
  const storedMode = localStorage.getItem(THEME_MODE_KEY);
  const storedAccent = localStorage.getItem(THEME_ACCENT_KEY);
  return {
    mode: isThemeMode(storedMode) ? storedMode : DEFAULT_MODE,
    accent: isThemeAccent(storedAccent) ? storedAccent : DEFAULT_ACCENT,
  };
}

export function applyThemeToDocument(mode: ThemeMode, accent: ThemeAccent): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  if (accent === DEFAULT_ACCENT) {
    root.removeAttribute("data-accent");
  } else {
    root.setAttribute("data-accent", accent);
  }
}
