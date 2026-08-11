"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import type { CategoryBreakdownPoint } from "@/lib/data/analytics";

/** Kategori Bazlı Harcamalar ve Market Dağılımı kartlarının ikisi de
 * kullanıyor. recharts'ın kendi dahili Legend'ı yerine kendi HTML
 * legend'ımız var — yüzdelik dilim eklemek ve print'te sol/sağ hizalamayı
 * garanti etmek recharts Legend içinde çok kırılgan olurdu. */
export function ReportBreakdownChart({ data }: { data: CategoryBreakdownPoint[] }) {
  const sum = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center print:flex-row print:items-center print:gap-4">
      <div className="h-56 w-full shrink-0 sm:w-1/2 print:h-40 print:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} label={(e) => `%${(e.percent! * 100).toFixed(1)}`}>
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 min-w-0 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full print:border print:border-black/20"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate text-text-primary print:text-black">{d.name}</span>
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-text-secondary print:text-black">%{sum > 0 ? ((d.total / sum) * 100).toFixed(1) : "0.0"}</span>
              <span className="font-medium text-text-primary print:text-black">{formatCurrency(d.total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
