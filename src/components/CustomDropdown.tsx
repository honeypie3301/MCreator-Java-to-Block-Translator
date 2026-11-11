import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
  description?: string;
}

interface CustomDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  prefix?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  mono?: boolean;
}

export function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  prefix,
  icon,
  align = 'right',
  className = '',
  mono = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 bg-[#1F1C19] hover:bg-[#282420] active:bg-[#191715] border border-[#3B342E] hover:border-[#52463C] rounded-md px-2.5 py-1 text-xs text-[#FAF6F0] transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-[#CEB098]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {prefix && <span className="text-[10px] font-mono text-[#A39B8E]">{prefix}</span>}
        <span
          className={`font-semibold truncate max-w-[130px] sm:max-w-[200px] md:max-w-[280px] ${mono ? 'font-mono text-[#CEB098]' : 'text-[#FAF6F0]'}`}
          title={selectedOption ? selectedOption.label : value}
        >
          {selectedOption ? selectedOption.label : value}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#A39B8E] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#CEB098]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute mt-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 min-w-[180px] max-w-[340px] max-h-[320px] overflow-y-auto bg-[#1A1816] border border-[#423A33] rounded-lg shadow-2xl p-1 text-xs backdrop-blur-md`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#2A241F] text-[#CEB098] font-medium'
                    : 'text-[#FAF6F0] hover:bg-[#25211D] hover:text-[#FAF6F0]'
                }`}
              >
                <div className="flex flex-col pr-2">
                  <span className={mono ? 'font-mono font-semibold' : 'font-medium'}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-[10px] text-[#8C8478] leading-tight">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#CEB098] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
