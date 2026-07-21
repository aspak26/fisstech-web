"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, CreditCard, HandCoins, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import type { PerakendeTransactionWithItems } from "@/lib/data/perakende";

const FILTERS = ["Tümü", "Bugün", "Bu Hafta", "Bu Ay"] as const;
type Filter = (typeof FILTERS)[number];

const PAYMENT_META: Record<string, { label: string; icon: typeof Banknote }> = {
  nakit: { label: "Nakit", icon: Banknote },
  kart: { label: "Kart", icon: CreditCard },
  veresiye: { label: "Veresiye", icon: HandCoins },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Ported from mobile's perakende_satis_gecmisi_screen.dart — period-filtered
 * list of past POS sales (perakende_transactions), expandable to show line
 * items. */
export function PerakendeSatisGecmisi({ transactions }: { transactions: PerakendeTransactionWithItems[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = (searchParams.get("filter") as Filter) ?? "Tümü";
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function setFilter(filter: Filter) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "Tümü") params.delete("filter");
    else params.set("filter", filter);
    router.push(`?${params.toString()}`);
  }

  const total = transactions.reduce((s, t) => s + Number(t.total_amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-control border px-3 py-1.5 text-sm font-medium",
              activeFilter === f ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-accent",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {transactions.length > 0 && (
        <Card className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{transactions.length} satış</span>
          <span className="font-display text-lg font-bold text-text-primary">{formatCurrency(total)}</span>
        </Card>
      )}

      {transactions.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} title="Bu dönemde satış yok" />
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => {
            const meta = PAYMENT_META[t.payment_method] ?? PAYMENT_META.nakit;
            const expanded = expandedId === t.id;
            return (
              <Card key={t.id} className="p-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <meta.icon className="h-4 w-4 shrink-0 text-text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {meta.label}
                        {t.is_ai_scanned && <span className="ml-1.5 text-xs text-accent">· AI tarama</span>}
                      </p>
                      <p className="text-xs text-text-secondary">{formatDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <span className="font-medium text-text-primary">{formatCurrency(Number(t.total_amount))}</span>
                </button>
                {expanded && t.perakende_transaction_items.length > 0 && (
                  <ul className="divide-y divide-border border-t border-border px-3">
                    {t.perakende_transaction_items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-text-secondary">
                          {item.quantity}x {item.product_name}
                          {item.variation_label ? ` (${item.variation_label})` : ""}
                        </span>
                        <span className="text-text-primary">{formatCurrency(Number(item.total_price))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
