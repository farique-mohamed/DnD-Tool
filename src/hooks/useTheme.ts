import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "dnd_theme";

export interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Internal hook used by ThemeProvider to manage theme state.
 */
export function useThemeState(): ThemeContextValue {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  // Apply CSS custom properties to <body> whenever theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (theme === "dark") {
      root.style.setProperty("--bg-primary", "#0d0d1a");
      root.style.setProperty("--bg-secondary", "#1a1a2e");
      root.style.setProperty("--bg-tertiary", "#16213e");
      root.style.setProperty("--bg-gradient", "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)");
      root.style.setProperty("--card-bg", "rgba(0,0,0,0.6)");
      root.style.setProperty("--card-bg-light", "rgba(0,0,0,0.4)");
      root.style.setProperty("--input-bg", "rgba(30,15,5,0.9)");
      root.style.setProperty("--text-primary", "#e8d5a3");
      root.style.setProperty("--text-secondary", "#a89060");
      root.style.setProperty("--text-dim", "rgba(232,213,163,0.6)");
      root.style.setProperty("--gold", "#c9a84c");
      root.style.setProperty("--gold-glow", "rgba(201,168,76,0.5)");
      root.style.setProperty("--gold-dark", "#8b6914");
      root.style.setProperty("--gold-bright", "#e8d5a3");
      root.style.setProperty("--gold-faded", "#d4b896");
      root.style.setProperty("--gold-muted", "#a89060");
      root.style.setProperty("--border-color", "rgba(201,168,76,0.3)");
      root.style.setProperty("--border-accent", "rgba(201,168,76,0.5)");
      root.style.setProperty("--nav-bg", "rgba(0,0,0,0.7)");
      root.style.setProperty("--overlay-bg", "linear-gradient(135deg, rgba(13,13,26,0.97) 0%, rgba(26,26,46,0.97) 50%, rgba(22,33,62,0.97) 100%)");
    } else {
      root.style.setProperty("--bg-primary", "#f5f0e8");
      root.style.setProperty("--bg-secondary", "#ede4d4");
      root.style.setProperty("--bg-tertiary", "#e8dcc8");
      root.style.setProperty("--bg-gradient", "linear-gradient(135deg, #f5f0e8 0%, #ede4d4 50%, #e8dcc8 100%)");
      root.style.setProperty("--card-bg", "rgba(255,248,235,0.95)");
      root.style.setProperty("--card-bg-light", "rgba(255,248,235,0.8)");
      root.style.setProperty("--input-bg", "rgba(255,248,235,0.9)");
      root.style.setProperty("--text-primary", "#2c1810");
      root.style.setProperty("--text-secondary", "#5c4033");
      root.style.setProperty("--text-dim", "rgba(44,24,16,0.5)");
      root.style.setProperty("--gold", "#8b6914");
      root.style.setProperty("--gold-glow", "rgba(139,105,20,0.3)");
      root.style.setProperty("--gold-dark", "#6b5010");
      root.style.setProperty("--gold-bright", "#2c1810");
      root.style.setProperty("--gold-faded", "#5c4033");
      root.style.setProperty("--gold-muted", "#7a6040");
      root.style.setProperty("--border-color", "rgba(139,105,20,0.3)");
      root.style.setProperty("--border-accent", "rgba(139,105,20,0.5)");
      root.style.setProperty("--nav-bg", "rgba(237,228,212,0.95)");
      root.style.setProperty("--overlay-bg", "linear-gradient(135deg, rgba(245,240,232,0.98) 0%, rgba(237,228,212,0.98) 50%, rgba(232,220,200,0.98) 100%)");
    }

    root.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, toggleTheme, setTheme };
}
