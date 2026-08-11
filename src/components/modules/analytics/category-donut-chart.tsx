"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { CategoryBreakdownPoint } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/utils/currency";

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
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
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
