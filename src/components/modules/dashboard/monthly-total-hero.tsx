import { formatCurrency } from "@/lib/utils/currency";

export function MonthlyTotalHero({ total, count }: { total: number; count: number }) {
  return (
    <div className="rounded-card border-[1.5px] border-ink/80 bg-accent p-8 text-on-accent shadow-md">
      <p className="text-sm font-medium opacity-80">Bu ayki toplam harcama</p>
      <p className="mt-2 font-display text-hero font-bold tracking-tight">
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-sm opacity-80">{count} harcama kaydı</p>
    </div>
  );
}
