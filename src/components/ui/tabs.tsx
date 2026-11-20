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
        className="inline-flex w-max rounded-xl border-[1.5px] border-ink/70 bg-surface-alt p-1"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={opt.value === value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
              opt.value === value
                ? "bg-surface text-accent border-[1.5px] border-ink/70 shadow-xs"
                : "border-[1.5px] border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
