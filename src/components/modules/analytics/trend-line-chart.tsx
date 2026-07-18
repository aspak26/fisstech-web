"use client";

import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";

interface TrendPoint {
  label: string;
  total: number;
}

/** Single-series trend line with the Y-axis pinned to 0 and a soft area
 * fill under the curve, so the line visibly starts from its baseline value
 * instead of floating in extra headroom — used for "6 Aylık Trend" and
 * "Aylık Maliyet Trendi". */
export function TrendLineChart({ data, color = "#B23A65" }: { data: TrendPoint[]; color?: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis hide domain={[0, (max: number) => (max === 0 ? 100 : max * 1.2)]} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-text-primary)",
            }}
          />
          <Area type="monotone" dataKey="total" stroke="none" fill="url(#trendFill)" isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
