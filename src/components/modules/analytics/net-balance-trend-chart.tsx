"use client";

import type { Key } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { MonthlyBalancePoint } from "@/lib/data/balance";

const successColor = "#2E7D32";
const dangerColor = "#C0392B";
const accentColor = "#B23A65";

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
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis hide domain={[-maxAbs, maxAbs]} />
          <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} strokeOpacity={0.8} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-text-primary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net"
            stroke={accentColor}
            strokeWidth={2.5}
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
                  r={3.5}
                  fill={payload.net >= 0 ? successColor : dangerColor}
                  stroke="none"
                />
              );
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
