import Link from "next/link";
import { Repeat } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDateTR } from "@/lib/utils/date";
import { subscriptionMonthlyAmount, daysUntilRenewal } from "@/lib/subscriptions/helpers";
import { cn } from "@/lib/utils/cn";
import type { SubscriptionsRow } from "@/lib/types/database";

/** Dashboard'daki aktif abonelik özeti — mobildeki _FixedExpensesSection ile
 * aynı fikir (yenilenme tarihine göre urgent rozet), ancak burada "Abonelikler"
 * olarak etiketlendi: aynı sayfada gerçek fixed_expenses verisini gösteren ayrı
 * bir "Sabit Giderler" kartı zaten var, mobildeki başlık ("SABİT GİDERLER") ile
 * aynı ismi kullanmak kafa karıştırırdı. */
export function SubscriptionsSection({ subscriptions }: { subscriptions: SubscriptionsRow[] }) {
  if (subscriptions.length === 0) return null;

  const monthlyTotal = subscriptions.reduce((s, sub) => s + subscriptionMonthlyAmount(sub), 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-semibold text-text-primary">Abonelikler</h2>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
            {formatCurrency(monthlyTotal)} / ay
          </span>
        </div>
        <Link href="/subscriptions" className="text-sm font-medium text-accent hover:text-accent-hover">
          Tümünü Gör
        </Link>
      </div>

      <ul className="space-y-2">
        {subscriptions.map((sub) => {
          const days = daysUntilRenewal(sub.renewal_date);
          const isUrgent = days >= 0 && days <= 3;
          return (
            <li
              key={sub.id}
              className={cn(
                "flex items-center gap-3 rounded-card border bg-surface p-3",
                isUrgent ? "border-accent/40" : "border-border",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent/10 font-display text-lg font-bold text-accent">
                {sub.name ? sub.name[0].toUpperCase() : "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{sub.name}</p>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <Repeat className={cn("h-3 w-3", isUrgent && "text-accent")} strokeWidth={2} />
                  <span className={cn(isUrgent && "font-semibold text-accent")}>
                    {formatShortDateTR(sub.renewal_date)}
                  </span>
                  {isUrgent && (
                    <span className="font-bold text-accent">{days === 0 ? "(bugün!)" : `(${days} gün)`}</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 font-medium text-text-primary">
                {formatCurrency(Number(sub.amount))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
