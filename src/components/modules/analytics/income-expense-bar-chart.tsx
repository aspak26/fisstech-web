"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { MonthlyBalancePoint } from "@/lib/data/balance";

const successColor = "#2E7D32";
const dangerColor = "#C0392B";

/** "Gelir — Gider Karşılaştırması" — grouped bars, one pair per month. */
export function IncomeExpenseBarChart({ data }: { data: MonthlyBalancePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-text-primary)",
            }}
          />
          <Bar dataKey="income" name="Gelir" fill={successColor} radius={[4, 4, 0, 0]} barSize={16} />
          <Bar dataKey="expense" name="Gider" fill={dangerColor} radius={[4, 4, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
