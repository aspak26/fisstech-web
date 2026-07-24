"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import type { DailyTotals } from "@/lib/data/esnaf";
import { Calendar } from "lucide-react";

export function DailyTotalsCard({ totals, selectedDate }: { totals: DailyTotals, selectedDate: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between rounded-card bg-gradient-to-br from-accent to-accent-hover p-6 text-on-accent">
      <div>
        <div className="flex items-center gap-2 opacity-90">
          <Calendar className="h-4 w-4" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                router.push(`?date=${e.target.value}`);
              }
            }}
            className="bg-transparent font-medium border-none outline-none cursor-pointer focus:ring-0 appearance-none min-w-[120px]"
            style={{ colorScheme: "dark" }}
          />
        </div>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight">
          {formatCurrency(totals.income)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium opacity-80">Hesap</p>
        <p className="mt-1 font-display text-3xl font-bold">{totals.count}</p>
      </div>
    </div>
  );
}
