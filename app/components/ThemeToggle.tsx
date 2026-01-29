"use client";

import { useMemo } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, cycleTheme, options } = useTheme();

  const { label, title, iconPath } = useMemo(() => {
    const current = options.find((option) => option.name === theme);
    const currentIndex = options.findIndex((option) => option.name === theme);
    const next = options[(currentIndex + 1) % options.length];

    const iconForTheme = (name: string) => {
      switch (name) {
        case "daylight":
          // Sun
          return "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m0-11.32L4.92 4.92m14.16 14.16-1.42-1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z";
        case "charcoal":
          // Moon
          return "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
        case "midnight":
        default:
          // Half moon
          return "M12 2a10 10 0 1 0 0 20V2Z";
      }
    };

    const currentLabel = current?.label ?? "Theme";
    const nextLabel = next?.label ?? "next";
    const computedTitle = `Theme: ${currentLabel}. Click to switch to ${nextLabel}.`;

    return {
      label: currentLabel,
      title: computedTitle,
      iconPath: iconForTheme(theme),
    };
  }, [options, theme]);

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex items-center gap-2 p-2 md:px-3 md:py-2 rounded-lg border border-gray-700 bg-gray-800/80 text-gray-100 hover:border-blue-500 hover:text-white transition-colors text-sm"
      title={title}
      aria-label={title}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d={iconPath} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
