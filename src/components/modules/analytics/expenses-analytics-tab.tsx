import { PieChart } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCarousel } from "./chart-carousel";
import { DonutBreakdown } from "./donut-breakdown";
import { StoreBreakdownChart } from "./store-breakdown-chart";
import { TrendLineChart } from "./trend-line-chart";
import { BudgetLimitsCard } from "./budget-limits-card";
import type { CategoryBreakdownPoint, MonthlyTotalPoint, StoreBreakdownPoint } from "@/lib/data/analytics";
import type { CategoryLimitData } from "@/lib/data/limits";
import type { CategoriesRow } from "@/lib/types/database";

export function ExpensesAnalyticsTab({
  breakdown,
  parentBreakdown,
  storeBreakdown,
  monthlyTrend,
  limits,
  categories,
  currentMonth,
}: {
  breakdown: CategoryBreakdownPoint[];
  parentBreakdown: CategoryBreakdownPoint[];
  storeBreakdown: StoreBreakdownPoint[];
  monthlyTrend: MonthlyTotalPoint[];
  limits: CategoryLimitData[];
  categories: CategoriesRow[];
  currentMonth: string;
}) {
  const pages = [
    breakdown.length > 0 && { title: "Kategori Dağılımı", content: <DonutBreakdown data={breakdown} /> },
    parentBreakdown.length > 0 && {
      title: "Genel Kategoriler",
      content: <DonutBreakdown data={parentBreakdown} />,
    },
    storeBreakdown.length > 0 && { title: "Market Analizi", content: <StoreBreakdownChart stores={storeBreakdown} /> },
  ].filter(Boolean) as { title: string; content: React.ReactNode }[];

  return (
    <div className="space-y-6">
      <Card>
        {pages.length === 0 ? (
          <EmptyState icon={PieChart} title="Bu dönem için harcama verisi yok" />
        ) : (
          <ChartCarousel pages={pages} />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6 Aylık Trend</CardTitle>
        </CardHeader>
        <TrendLineChart data={monthlyTrend} />
      </Card>

      <BudgetLimitsCard limits={limits} categories={categories} currentMonth={currentMonth} />
    </div>
  );
}
