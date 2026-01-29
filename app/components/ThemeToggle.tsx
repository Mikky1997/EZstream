"use client";

import { useMemo } from "react";
import { useTheme, type ThemeName } from "@/app/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme, cycleTheme, options } = useTheme();

  const label = useMemo(() => {
    const current = options.find((option) => option.name === theme);
    return current?.label ?? "Theme";
  }, [options, theme]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={cycleTheme}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/80 text-gray-100 hover:border-blue-500 hover:text-white transition-colors text-sm"
        title="Cycle theme"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span>{label}</span>
      </button>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
        className="hidden lg:block px-2 py-2 rounded-lg border border-gray-700 bg-gray-800/80 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
        title="Select theme"
      >
        {options.map((option) => (
          <option key={option.name} value={option.name}>
            {option.label} — {option.description}
          </option>
        ))}
      </select>
    </div>
  );
}
