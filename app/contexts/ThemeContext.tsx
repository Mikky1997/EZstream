"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "midnight" | "charcoal" | "daylight";

type ThemeOption = {
  name: ThemeName;
  label: string;
  description: string;
  themeColor: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    name: "daylight",
    label: "Light",
    description: "Light UI with soft grays",
    themeColor: "#f4f4f5",
  },
  {
    name: "midnight",
    label: "Mid",
    description: "Original theme balance",
    themeColor: "#111827",
  },
  {
    name: "charcoal",
    label: "Dark",
    description: "Extra dark, high contrast",
    themeColor: "#030305",
  },
];

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;
  options: ThemeOption[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "ezstream_theme";
const DEFAULT_THEME: ThemeName = "midnight";

function isThemeName(value: string): value is ThemeName {
  return THEME_OPTIONS.some((option) => option.name === value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  // Load stored theme
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (stored && isThemeName(stored)) {
      setTheme(stored);
    }
  }, []);

  // Apply theme to document + persist
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = theme;

    const themeColor = THEME_OPTIONS.find(
      (option) => option.name === theme,
    )?.themeColor;
    if (themeColor) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", themeColor);
      }
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const cycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex(
      (option) => option.name === theme,
    );
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setTheme(THEME_OPTIONS[nextIndex].name);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      cycleTheme,
      options: THEME_OPTIONS,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
