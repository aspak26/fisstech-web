import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentMonthString } from "@/lib/utils/date";
import { getCategoryBreakdown } from "@/lib/data/analytics";
import { getMonthlyBalanceTrend } from "@/lib/data/balance";
import { MonthSelector } from "@/components/modules/dashboard/month-selector";
import { CategoryDonutChart } from "@/components/modules/analytics/category-donut-chart";
import { BalanceTrendChart } from "@/components/modules/balance/balance-trend-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonthString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [breakdown, trend] = await Promise.all([
    getCategoryBreakdown(supabase, userId, month),
    getMonthlyBalanceTrend(supabase, userId, 6),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Analizler & Raporlar
      </h1>

      <Suspense fallback={<div className="h-9" />}>
        <MonthSelector month={month} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Dağılımı</CardTitle>
        </CardHeader>
        {breakdown.length === 0 ? (
          <EmptyState icon={PieChart} title="Bu ay için harcama verisi yok" />
        ) : (
          <CategoryDonutChart data={breakdown} />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son 6 Ay Gelir-Gider</CardTitle>
        </CardHeader>
        <BalanceTrendChart data={trend} />
      </Card>

      {breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>En Çok Harcanan Kategoriler</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border">
            {breakdown.slice(0, 8).map((cat) => (
              <li key={cat.name} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-text-primary">{cat.name}</span>
                </div>
                <span className="font-medium text-text-primary">{formatCurrency(cat.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
