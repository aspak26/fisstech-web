"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { MonthlyBalancePoint } from "@/lib/data/balance";
import { formatCurrency } from "@/lib/utils/currency";

import { PAPER_AXIS_LINE, PAPER_GRID, PAPER_LINE_WIDTH, PAPER_SHAPE_STROKE, PAPER_TOOLTIP_CURSOR, PAPER_TOOLTIP_STYLE } from "@/lib/utils/paper-chart";
const successColor = "var(--color-chart-income)";
const dangerColor = "var(--color-chart-expense)";
const accentColor = "var(--color-accent)";

export function BalanceTrendChart({ data }: { data: MonthlyBalancePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid {...PAPER_GRID} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={PAPER_AXIS_LINE}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={0}
          />
          <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} strokeOpacity={0.9} />
          <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={PAPER_TOOLTIP_STYLE}
          />
          <Bar dataKey="income" name="Gelir" fill={successColor} radius={[6, 6, 0, 0]} {...PAPER_SHAPE_STROKE} barSize={18} />
          <Bar dataKey="expense" name="Gider" fill={dangerColor} radius={[6, 6, 0, 0]} {...PAPER_SHAPE_STROKE} barSize={18} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke={accentColor}
            strokeWidth={PAPER_LINE_WIDTH}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
