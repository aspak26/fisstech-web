import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "danger" | "warning" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-alt text-text-secondary border-border",
  success: "bg-success/12 text-success border-success/45",
  danger: "bg-danger/12 text-danger border-danger/45",
  warning: "bg-warning/15 text-text-primary border-warning/50",
  accent: "bg-accent-soft text-accent border-accent/45",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
