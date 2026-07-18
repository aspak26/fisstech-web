"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { CategoryBreakdownPoint } from "@/lib/data/analytics";

/** Donut with a centered total + a ranked list below — mirrors mobile's
 * `_DonutChart` (used for Kategori Dağılımı / Genel Kategoriler / Market
 * Analizi's own donut). */
export function DonutBreakdown({ data }: { data: CategoryBreakdownPoint[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const top = data.slice(0, 8);

  return (
    <div>
      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius="62%" outerRadius="85%" paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={`${entry.name}-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-text-primary)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-text-secondary">Toplam Tutar</p>
          <p className="font-display text-lg font-bold text-text-primary">{formatCurrency(total)}</p>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-border">
        {top.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="truncate text-text-primary">
                {entry.icon} {entry.name}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-text-secondary">{total > 0 ? Math.round((entry.total / total) * 100) : 0}%</span>
              <span className="font-medium text-text-primary">{formatCurrency(entry.total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
