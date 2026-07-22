"use client";

import type { ReactNode } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import { CHART_COLORS, type StoreBreakdownPoint } from "@/lib/data/analytics";

/** "Market Analizi" — mağaza harcama donut'u + "Alışveriş Sıklığı" bar
 * chart, mobildeki `_StoreChart` ile aynı. */
export function StoreBreakdownChart({ stores }: { stores: StoreBreakdownPoint[] }) {
  const top = stores.slice(0, 6);

  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={top} dataKey="total" nameKey="name" innerRadius="50%" outerRadius="85%" label={(e) => `%${Math.round(e.percent! * 100)}`}>
              {top.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
      </div>
      <ul className="mt-2 space-y-1.5">
        {top.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-text-primary">{s.name}</span>
            </div>
            <span className="font-medium text-text-primary">{formatCurrency(s.total)}</span>
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
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 7 ? `${v.slice(0, 7)}…` : v)}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              formatter={(value) => [`${value} ziyaret`, ""]}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-text-primary)",
              }}
            />
            <Bar
              dataKey="count"
              name="Ziyaret"
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
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
