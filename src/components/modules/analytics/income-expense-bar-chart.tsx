"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { MonthlyBalancePoint } from "@/lib/data/balance";

import { PAPER_AXIS_LINE, PAPER_GRID, PAPER_SHAPE_STROKE, PAPER_TOOLTIP_CURSOR, PAPER_TOOLTIP_STYLE } from "@/lib/utils/paper-chart";
const successColor = "var(--color-chart-income)";
const dangerColor = "var(--color-chart-expense)";

/** "Gelir — Gider Karşılaştırması" — grouped bars, one pair per month. */
export function IncomeExpenseBarChart({ data }: { data: MonthlyBalancePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={4}>
          <CartesianGrid {...PAPER_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={PAPER_AXIS_LINE}
            tickLine={false}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={PAPER_TOOLTIP_STYLE}
          />
          <Bar dataKey="income" name="Gelir" fill={successColor} radius={[6, 6, 0, 0]} {...PAPER_SHAPE_STROKE} barSize={16} />
          <Bar dataKey="expense" name="Gider" fill={dangerColor} radius={[6, 6, 0, 0]} {...PAPER_SHAPE_STROKE} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
