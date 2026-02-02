'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  /** Optional custom class name for the trigger button wrapper */
  className?: string;
}

/**
 * Reusable custom dropdown filter (same behavior as season/episode: panel with
 * source-active for selected, dropdown-item-hover for hover).
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
  className = '',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label ?? value;

  useEffect(() => {
    if (open && triggerRef.current) {
      setPanelRect(triggerRef.current.getBoundingClientRect());
    } else {
      setPanelRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-gray-400 text-sm">{label}:</span>}
      <div ref={triggerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={label ? `Select ${label.toLowerCase()}` : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex items-center bg-gray-800 text-white pl-4 pr-12 py-2 rounded-lg border border-gray-700 focus:border-red-500 outline-none cursor-pointer bg-no-repeat min-h-[40px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px 16px',
          }}
        >
          <span className="text-sm truncate max-w-[140px] sm:max-w-[200px]">{displayLabel}</span>
        </button>
        {open &&
          panelRect &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={panelRef}
              role="listbox"
              className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999] min-w-[160px] max-w-[240px] max-h-60 overflow-y-auto"
              style={{
                top: panelRect.bottom + 4,
                left: panelRect.left,
              }}
            >
              {options.map(option => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-700 last:border-0 text-sm ${
                    option.value === value ? 'source-active' : 'text-white dropdown-item-hover'
                  }`}
                  onMouseDown={() => handleSelect(option.value)}
                >
                  <span className="flex-1 min-w-0 truncate">{option.label}</span>
                </div>
              ))}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
});
