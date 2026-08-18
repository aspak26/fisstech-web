"use client";

import { cn } from "@/lib/utils/cn";

interface TabOption {
  value: string;
  label: string;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ options, value, onChange, className }: TabsProps) {
  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar", className)}>
      <div
        role="tablist"
        className="inline-flex w-max rounded-full border border-border bg-bg p-1"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={opt.value === value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              opt.value === value
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
