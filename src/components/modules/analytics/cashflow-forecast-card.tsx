"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import type { CashFlowForecastDay } from "@/lib/data/forecast";

const dayMonthFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/** "30 Günlük Nakit Akışı" — mobildeki ForecastChartCard'ın web karşılığı.
 * get_cashflow_forecast RPC'sinden gelen günlük tahmini bakiyeyi çizer. */
export function CashflowForecastCard({ forecast }: { forecast: CashFlowForecastDay[] }) {
  if (forecast.length === 0) return null;

  const minBalance = Math.min(...forecast.map((d) => d.projectedBalance));
  const isCrisis = minBalance < 0;
  const endBalance = forecast[forecast.length - 1].projectedBalance;
  const chartColor = isCrisis ? "var(--color-danger)" : "var(--color-accent)";

  const data = forecast.map((d) => ({
    ...d,
    label: dayMonthFormatter.format(new Date(`${d.date}T00:00:00`)),
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>30 Günlük Nakit Akışı</CardTitle>
            {isCrisis && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-danger" style={{ backgroundColor: "color-mix(in srgb, var(--color-danger) 10%, transparent)" }}>
                KRİZ UYARISI
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold" style={{ color: chartColor }}>
            Tahmini Ay Sonu: {formatCurrency(endBalance)}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: isCrisis
              ? "color-mix(in srgb, var(--color-danger) 10%, transparent)"
              : "var(--color-accent-soft)",
          }}
        >
          {isCrisis ? (
            <AlertTriangle className="h-4 w-4 text-danger" />
          ) : (
            <TrendingUp className="h-4 w-4 text-accent" />
          )}
        </div>
      </CardHeader>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-text-secondary)", fontSize: 11 }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 3) - 1)}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => label as string}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-text-primary)",
              }}
            />
            <Area
              type="monotone"
              dataKey="projectedBalance"
              name="Tahmini Bakiye"
              stroke={chartColor}
              strokeWidth={2.5}
              fill="url(#forecastGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
