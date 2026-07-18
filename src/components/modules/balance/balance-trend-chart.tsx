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

const successColor = "#2E7D32";
const dangerColor = "#C0392B";
const accentColor = "#B23A65";

export function BalanceTrendChart({ data }: { data: MonthlyBalancePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={0}
          />
          <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} strokeOpacity={0.9} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-text-primary)",
            }}
          />
          <Bar dataKey="income" name="Gelir" fill={successColor} radius={[4, 4, 0, 0]} barSize={18} />
          <Bar dataKey="expense" name="Gider" fill={dangerColor} radius={[4, 4, 0, 0]} barSize={18} />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke={accentColor}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
