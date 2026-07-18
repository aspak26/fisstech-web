"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { calculatePeriodRange, QUICK_PERIOD_PRESETS, recentMonthOptions } from "@/lib/utils/period";
import { cn } from "@/lib/utils/cn";

/** "Dönem Seçin" filter — mirrors mobile's PeriodSelector bottom sheet:
 * quick presets, last-12-months grid, and a custom date-range picker.
 * Drives a `period` URL search param so Server Component pages can refetch. */
export function PeriodSelector({ period, paramName = "period" }: { period: string; paramName?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const range = calculatePeriodRange(period);
  const months = recentMonthOptions(12);

  function select(key: string) {
    const params = new URLSearchParams(searchParams);
    params.set(paramName, key);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
    setShowCustom(false);
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return;
    select(`range_${customStart}_${customEnd}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-control border border-accent bg-accent/8 px-3.5 py-2 text-sm font-medium text-accent"
      >
        <Calendar className="h-4 w-4" />
        {range.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Dönem Seçin" className="max-w-lg">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Hızlı Seçenekler
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PERIOD_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => select(p.key)}
                  className={cn(
                    "rounded-control border px-3 py-2.5 text-sm font-medium transition-colors",
                    p.key === period
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-bg text-text-primary hover:border-accent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Ay Seçimi
            </p>
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {months.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => select(m.key)}
                  className={cn(
                    "rounded-control border px-3 py-2.5 text-sm font-medium transition-colors",
                    m.key === period
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-bg text-text-primary hover:border-accent",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {showCustom ? (
            <div className="space-y-3 rounded-control border border-border bg-bg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="period-start">Başlangıç</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end">Bitiş</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={!customStart || !customEnd}
                onClick={applyCustomRange}
              >
                Uygula
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full rounded-control border border-dashed border-border px-3 py-2.5 text-sm font-medium text-accent hover:border-accent"
            >
              Özel Tarih Aralığı Seç…
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}
