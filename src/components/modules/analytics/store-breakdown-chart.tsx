"use client";

import type { ReactNode } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import { CHART_COLORS, type StoreBreakdownPoint } from "@/lib/data/analytics";

import { PAPER_AXIS_LINE, PAPER_SHAPE_STROKE, PAPER_TOOLTIP_CURSOR, PAPER_TOOLTIP_STYLE } from "@/lib/utils/paper-chart";
/** "Market Analizi" — mağaza harcama donut'u + "Alışveriş Sıklığı" bar
 * chart, mobildeki `_StoreChart` ile aynı. */
export function StoreBreakdownChart({ stores }: { stores: StoreBreakdownPoint[] }) {
  const top = stores.slice(0, 6);
  const sum = top.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={top} dataKey="total" nameKey="name" innerRadius="50%" outerRadius="85%" label={(e) => `%${(e.percent! * 100).toFixed(1)}`}>
              {top.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--color-surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={PAPER_TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5">
        {top.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between py-1 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="truncate text-text-primary">{s.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-text-secondary">%{sum > 0 ? ((s.total / sum) * 100).toFixed(1) : "0.0"}</span>
              <span className="font-medium text-text-primary">{formatCurrency(s.total)}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mb-2 mt-5 text-sm font-semibold text-text-primary">Alışveriş Sıklığı</p>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              axisLine={PAPER_AXIS_LINE}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 7 ? `${v.slice(0, 7)}…` : v)}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
              formatter={(value) => [`${value} ziyaret`, ""]}
              contentStyle={PAPER_TOOLTIP_STYLE}
            />
            <Bar
              dataKey="count"
              name="Ziyaret"
              fill="var(--color-accent)"
              radius={[6, 6, 0, 0]} {...PAPER_SHAPE_STROKE}
              barSize={28}
              label={{
                position: "top",
                formatter: (v: ReactNode) => `${v}x`,
                fill: "var(--color-text-secondary)",
                fontSize: 11,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
