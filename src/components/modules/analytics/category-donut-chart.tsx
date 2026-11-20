"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { CategoryBreakdownPoint } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/utils/currency";

import { PAPER_TOOLTIP_CURSOR, PAPER_TOOLTIP_STYLE } from "@/lib/utils/paper-chart";
export function CategoryDonutChart({ data }: { data: CategoryBreakdownPoint[] }) {
  const sum = data.reduce((acc, curr) => acc + curr.total, 0);
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            label={(e) => `%${(e.percent! * 100).toFixed(1)}`}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip cursor={PAPER_TOOLTIP_CURSOR}
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={PAPER_TOOLTIP_STYLE}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 13, color: "var(--color-text-secondary)" }}
            formatter={(value, entry: any) => {
              const percent = sum > 0 ? ((entry.payload.total / sum) * 100).toFixed(1) : "0.0";
              return (
                <span className="ml-1">
                  <span className="text-text-primary">{value}</span>
                  <span className="ml-2 text-text-secondary">%{percent}</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
