import { formatCurrency } from "@/lib/utils/currency";

export function MonthlyTotalHero({ total, count }: { total: number; count: number }) {
  return (
    <div className="rounded-card bg-gradient-to-br from-accent to-accent-hover p-8 text-on-accent">
      <p className="text-sm font-medium opacity-80">Bu ayki toplam harcama</p>
      <p className="mt-2 font-display text-hero font-bold tracking-tight">
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-sm opacity-80">{count} harcama kaydı</p>
    </div>
  );
}
