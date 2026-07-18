import { formatCurrency } from "@/lib/utils/currency";
import type { DailyTotals } from "@/lib/data/esnaf";

export function DailyTotalsCard({ totals }: { totals: DailyTotals }) {
  return (
    <div className="flex items-center justify-between rounded-card bg-gradient-to-br from-accent to-accent-hover p-6 text-on-accent">
      <div>
        <p className="text-sm font-medium opacity-80">Bugünkü Ciro</p>
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
