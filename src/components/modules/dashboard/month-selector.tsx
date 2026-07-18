"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, isCurrentOrFutureMonth, shiftMonth } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export function MonthSelector({ month }: { month: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCurrent = isCurrentOrFutureMonth(month);

  function go(delta: number) {
    const params = new URLSearchParams(searchParams);
    params.set("month", shiftMonth(month, delta));
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Önceki ay"
        onClick={() => go(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-primary hover:border-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-40 text-center font-display text-sm font-semibold tracking-wide text-text-secondary">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Sonraki ay"
        onClick={() => go(1)}
        disabled={isCurrent}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-primary hover:border-accent",
          isCurrent && "opacity-40 hover:border-border",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
