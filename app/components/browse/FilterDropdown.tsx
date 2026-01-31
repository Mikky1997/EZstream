"use client";

import { memo } from "react";

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  /** Label shown before the dropdown */
  label: string;
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
  // Generate a stable ID from the label
  const selectId = `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-gray-400 text-sm">{label}:</label>
      <select
        id={selectId}
        aria-label={`Select ${label.toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none ${className}`}
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
