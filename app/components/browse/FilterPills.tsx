"use client";

import { memo } from "react";
import type { GenreOption, FilterOption } from "@/types";

// Support both genre options (id/name) and filter options (value/label)
type PillOption = GenreOption | FilterOption<string>;

interface FilterPillsProps<T extends PillOption> {
  /** Array of options to display */
  options: readonly T[];
  /** Currently selected value (genre id or filter value) */
  selected: T extends GenreOption ? number | null : string;
  /** Callback when selection changes */
  onSelect: (value: T extends GenreOption ? number | null : string) => void;
  /** Label for the "All" option, if shown */
  allLabel?: string;
  /** Show "All" option at the beginning */
  showAllOption?: boolean;
  /** Active color class (e.g., "bg-blue-600", "bg-red-600") */
  activeColorClass?: string;
  /** Optional section label */
  label?: string;
}

/**
 * Reusable filter pills component for genre/language selection
 *
 * @example
 * ```tsx
 * // Genre pills
 * <FilterPills
 *   options={MOVIE_GENRES}
 *   selected={selectedGenre}
 *   onSelect={setSelectedGenre}
 *   showAllOption
 *   allLabel="All"
 *   activeColorClass="bg-blue-600"
 *   label="Genre"
 * />
 *
 * // Language pills with flags
 * <FilterPills
 *   options={COUNTRY_OPTIONS}
 *   selected={selectedLanguage}
 *   onSelect={setSelectedLanguage}
 *   activeColorClass="bg-blue-600"
 *   label="Country / Language"
 * />
 * ```
 */
function FilterPillsComponent<T extends PillOption>({
  options,
  selected,
  onSelect,
  allLabel = "All",
  showAllOption = false,
  activeColorClass = "bg-blue-600",
  label,
}: FilterPillsProps<T>) {
  // Type guard for genre options
  const isGenreOption = (opt: PillOption): opt is GenreOption => "id" in opt;

  // Get value and label from option
  const getOptionValue = (opt: PillOption): number | string =>
    isGenreOption(opt) ? opt.id : opt.value;

  const getOptionLabel = (opt: PillOption): string =>
    isGenreOption(opt) ? opt.name : opt.label;

  const getOptionFlag = (opt: PillOption): string | undefined =>
    !isGenreOption(opt) ? (opt as FilterOption).flag : undefined;

  // Check if option is selected
  const isSelected = (opt: PillOption): boolean => {
    const value = getOptionValue(opt);
    return value === selected;
  };

  // Handle click
  const handleClick = (opt: PillOption) => {
    const value = getOptionValue(opt);
    // Type assertion needed due to generic constraint
    onSelect(value as T extends GenreOption ? number | null : string);
  };

  // Handle "All" click
  const handleAllClick = () => {
    // For genres, null means "All"; for filters, empty string means "All"
    const allValue = (
      isGenreOption(options[0]) ? null : ""
    ) as T extends GenreOption ? number | null : string;
    onSelect(allValue);
  };

  // Check if "All" is selected
  const isAllSelected = selected === null || selected === "";

  return (
    <div>
      {label && <h3 className="text-gray-400 text-sm mb-2">{label}</h3>}
      <div className="flex flex-wrap gap-2">
        {showAllOption && (
          <button
            onClick={handleAllClick}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isAllSelected
                ? `${activeColorClass} text-white`
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {allLabel}
          </button>
        )}
        {options.map((option) => {
          const value = getOptionValue(option);
          const label = getOptionLabel(option);
          const flag = getOptionFlag(option);

          return (
            <button
              key={String(value)}
              onClick={() => handleClick(option)}
              className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                isSelected(option)
                  ? `${activeColorClass} text-white`
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {flag && <span>{flag}</span>}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Memo with generic type
export const FilterPills = memo(
  FilterPillsComponent
) as typeof FilterPillsComponent;
