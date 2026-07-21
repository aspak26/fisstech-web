"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PeriodSelector } from "@/components/ui/period-selector";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDateTR } from "@/lib/utils/date";
import type { MenuSalesPoint } from "@/lib/data/restaurant";

/** New (not on mobile, requested by user 21 Temmuz 2026): which menu items
 * sold how much revenue in the period, drill-down into a per-date breakdown
 * per item — click-based (Tabs/expand pattern), no swipe/carousel. */
export function KafeMenuAnalytics({ period, sales }: { period: string; sales: MenuSalesPoint[] }) {
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const top = sales.slice(0, 8);

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">Menü Analizi</h2>
        <PeriodSelector period={period} paramName="menuPeriod" />
      </div>

      {sales.length === 0 ? (
        <EmptyState icon={BarChart3} title="Bu dönem için satış verisi yok" />
      ) : (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--color-border)" }}
                  tickLine={false}
                  tickFormatter={(v: string) => (v.length > 8 ? `${v.slice(0, 8)}…` : v)}
                />
                <YAxis hide domain={[0, "dataMax"]} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-text-primary)",
                  }}
                />
                <Bar dataKey="totalRevenue" name="Ciro" fill="#B23A65" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {sales.map((item) => {
              const expanded = expandedName === item.name;
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => setExpandedName(expanded ? null : item.name)}
                    className="flex w-full items-center justify-between py-2.5 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">{item.totalQty} adet</p>
                    </div>
                    <span className="font-medium text-text-primary">{formatCurrency(item.totalRevenue)}</span>
                  </button>
                  {expanded && (
                    <ul className="mb-2 space-y-1 rounded-control bg-bg p-3">
                      {item.byDate.map((d) => (
                        <li key={d.date} className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">
                            {formatShortDateTR(d.date)} · {d.qty} adet
                          </span>
                          <span className="font-medium text-text-primary">{formatCurrency(d.revenue)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
