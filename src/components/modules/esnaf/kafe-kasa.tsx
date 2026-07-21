"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDateTR } from "@/lib/utils/date";
import type { ClosedOrderWithItems } from "@/lib/data/restaurant";

/** Ported from mobile's kafe_kasa_screen.dart — a restaurant-specific
 * revenue drill-down over closed restaurant_orders (source of truth:
 * order totals), distinct from the generic Kasa Defteri's business_incomes
 * view of the same payments — see PROGRESS.md for why these are two
 * independently-computed (but normally reconciling) numbers. */
export function KafeKasa({ date, orders }: { date: string; orders: ClosedOrderWithItems[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  function shiftDate(days: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    const next = d.toISOString().slice(0, 10);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", next);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => shiftDate(-1)} aria-label="Önceki gün" className="rounded-control p-1.5 hover:bg-bg">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">{formatShortDateTR(date)}</span>
        <button type="button" onClick={() => shiftDate(1)} aria-label="Sonraki gün" className="rounded-control p-1.5 hover:bg-bg">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-card bg-gradient-to-br from-accent to-accent-hover p-5 text-center text-on-accent shadow-lg shadow-accent/20">
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">Günlük Ciro</p>
        <p className="mt-1 font-display text-3xl font-bold">{formatCurrency(total)}</p>
        <p className="mt-1 text-sm opacity-80">{orders.length} masa/sipariş</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState icon={Calculator} title="Bu tarihte kapanan sipariş yok" />
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const expanded = expandedId === o.id;
            return (
              <Card key={o.id} className="p-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : o.id)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div>
                    <p className="font-medium text-text-primary">{o.table_name ?? (o.order_type === "delivery" ? "Kurye" : o.order_type === "takeaway" ? "Gel-Al" : "Paket")}</p>
                    <p className="text-xs text-text-secondary">
                      {o.closed_at && new Date(o.closed_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="font-medium text-text-primary">{formatCurrency(Number(o.total_amount))}</span>
                </button>
                {expanded && (
                  <ul className="divide-y divide-border border-t border-border px-3">
                    {o.order_items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-text-secondary">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-text-primary">{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
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
