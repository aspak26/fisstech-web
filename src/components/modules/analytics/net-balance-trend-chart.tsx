"use client";

import type { Key } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { MonthlyBalancePoint } from "@/lib/data/balance";

import { PAPER_AXIS_LINE, PAPER_LINE_WIDTH, PAPER_TOOLTIP_CURSOR, PAPER_TOOLTIP_STYLE, paperActiveDot } from "@/lib/utils/paper-chart";
const successColor = "var(--color-chart-income)";
const dangerColor = "var(--color-chart-expense)";
const accentColor = "var(--color-accent)";

/** "6 Aylık Net Bakiye Trendi" — zero-centered, sign-colored dots (yeşil
 * pozitif / kırmızı negatif), belirgin sıfır çizgisi. */
export function NetBalanceTrendChart({ data }: { data: MonthlyBalancePoint[] }) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.net))) * 1.3;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={PAPER_AXIS_LINE}
            tickLine={false}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis hide domain={[-maxAbs, maxAbs]} />
          <ReferenceLine y={0} stroke="var(--color-ink)" strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 4" />
          <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={PAPER_TOOLTIP_STYLE}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke={accentColor}
            strokeWidth={PAPER_LINE_WIDTH}
            isAnimationActive={false}
            dot={(props: unknown) => {
              const { cx, cy, payload, key } = props as {
                cx?: number;
                cy?: number;
                payload?: MonthlyBalancePoint;
                key?: Key;
              };
              if (cx === undefined || cy === undefined || !payload) return <g key={key} />;
              return (
                <circle
                  key={key}
                  cx={cx}
                  cy={cy}
                  r={4.2}
                  fill="var(--color-surface)"
                  stroke={payload.net >= 0 ? successColor : dangerColor}
                  strokeWidth={2.4}
                />
              );
            }}
            activeDot={paperActiveDot(accentColor)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
