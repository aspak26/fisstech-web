import { formatCurrency } from "@/lib/utils/currency";

/** Kâğıt görünüm: mobil paneldeki gibi bantla yapıştırılmış bir fiş —
 * tırtıklı alt kenar (receipt-edge), çift çizgili toplam satırı ve el
 * yazısı not. Mask gölgeyi de kestiği için gölge dış sarmalayıcıda. */
export function MonthlyTotalHero({ total, count }: { total: number; count: number }) {
  return (
    <div className="relative drop-shadow-[2px_3px_0_var(--shadow-ink)]">
      <span aria-hidden="true" className="tape -top-3 left-8 z-10 -rotate-3" />
      <div className="receipt-edge relative bg-surface px-8 pb-10 pt-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
          Bu ayki toplam harcama
        </p>
        <div className="mt-3 border-t-[3px] border-double border-ink/50 pt-3">
          <p className="font-display text-hero font-extrabold tracking-tight tabular-nums text-accent">
            {formatCurrency(total)}
          </p>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{count} harcama kaydı</p>
        <p
          aria-hidden="true"
          className="absolute bottom-8 right-8 hidden rotate-[-5deg] font-hand sm:block text-2xl font-bold text-accent"
        >
          {count > 0 ? "her fiş kayıtlı ✓" : "ilk fişini tara!"}
        </p>
      </div>
    </div>
  );
}
