"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const dayLabelFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" });

export function HizmetDayNav({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(delta: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams);
    params.set("date", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Önceki gün"
        onClick={() => go(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-primary hover:border-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-48 text-center font-display text-sm font-semibold capitalize tracking-wide text-text-secondary">
        {dayLabelFmt.format(new Date(`${date}T00:00:00`))}
      </span>
      <button
        type="button"
        aria-label="Sonraki gün"
        onClick={() => go(1)}
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-text-primary hover:border-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
