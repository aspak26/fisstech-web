"use client";

import { cn } from "@/lib/utils/cn";

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}) {
  const control = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border-[1.5px] border-ink/75 transition-colors disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-alt",
      )}
    >
      <span
        className={cn(
          "absolute left-[1px] top-[1px] h-[18px] w-[18px] rounded-full border-[1.5px] border-ink/75 bg-surface transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
      {control}
    </div>
  );
}
