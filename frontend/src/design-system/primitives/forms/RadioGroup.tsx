import React from 'react';
import { cn } from '../../../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  error,
  className,
}) => {
  return (
    <fieldset className={cn('w-full space-y-3 font-sans', className)}>
      <legend className="text-sm font-bold text-neutral-900 mb-1 select-none">{label}</legend>

      <div className="space-y-2">
        {options.map((opt) => {
          const inputId = `radio-${name}-${opt.value}`;
          const isSelected = value !== undefined ? value === opt.value : defaultValue === opt.value;

          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              onClick={() => !opt.disabled && onChange?.(opt.value)}
              className={cn(
                'flex items-start gap-3 min-h-[54px] p-3.5 rounded-lg border transition-all cursor-pointer group select-none',
                isSelected
                  ? 'bg-primary-50/60 border-primary-600 shadow-sm ring-1 ring-primary-500'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60',
                opt.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="radio"
                  id={inputId}
                  name={name}
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled}
                  onChange={(e) => onChange?.(e.target.value)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center bg-white",
                  isSelected ? "border-primary-700 bg-primary-700" : "border-neutral-400 group-hover:border-neutral-500"
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className={cn("text-sm font-bold transition-colors", isSelected ? "text-primary-950" : "text-neutral-900")}>
                  {opt.label}
                </span>
                {opt.description && <span className="text-xs text-neutral-600 mt-1 leading-relaxed">{opt.description}</span>}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p role="alert" className="text-xs font-medium text-danger mt-1">{error}</p>}
    </fieldset>
  );
};
