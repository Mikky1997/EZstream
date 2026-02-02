"use client";

import { memo } from "react";

// Custom dropdown arrow SVG as data URI
const DROPDOWN_ARROW = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E`;

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  /** Label shown before the dropdown (optional - if not provided, only dropdown shows) */
  label?: string;
  /** Array of options */
  options: readonly FilterDropdownOption[];
  /** Currently selected value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Optional custom class name for the select */
  className?: string;
}

/**
 * Reusable dropdown filter component
 *
 * @example
 * ```tsx
 * <FilterDropdown
 *   label="Year"
 *   options={YEAR_OPTIONS}
 *   value={selectedYear}
 *   onChange={setSelectedYear}
 * />
 * ```
 */
export const FilterDropdown = memo(function FilterDropdown({
  label,
  options,
  value,
  onChange,
  className = "",
}: FilterDropdownProps) {
  // Generate a stable ID from the label or use a fallback
  const selectId = label 
    ? `filter-${label.toLowerCase().replace(/\s+/g, '-')}` 
    : `filter-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label htmlFor={selectId} className="text-gray-400 text-sm">{label}:</label>
      )}
      <select
        id={selectId}
        aria-label={label ? `Select ${label.toLowerCase()}` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-gray-800 text-white pl-4 pr-12 py-2 rounded-lg border border-gray-700 focus:border-red-500 outline-none appearance-none cursor-pointer bg-no-repeat ${className}`}
        style={{
          backgroundImage: `url("${DROPDOWN_ARROW}")`,
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px 16px',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});
