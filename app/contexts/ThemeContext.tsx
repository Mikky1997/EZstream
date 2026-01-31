"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

export type ThemeName = "charcoal";

type ThemeContextValue = {
  theme: ThemeName;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: ThemeName = "charcoal";

  // Apply dark theme to document on mount
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = theme;

    // Read theme color from CSS variable
    const themeColor = getComputedStyle(root).getPropertyValue("--bg-elevated").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && themeColor) {
      meta.setAttribute("content", themeColor);
    }
  }, [theme]);

  const value = useMemo(() => ({ theme }), [theme]);

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
