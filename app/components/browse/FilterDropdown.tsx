"use client";

import { memo } from "react";

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
        className={`bg-gray-800 text-white pl-4 pr-10 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none ${className}`}
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
