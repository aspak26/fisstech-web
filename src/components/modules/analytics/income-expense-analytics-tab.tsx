import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseBarChart } from "./income-expense-bar-chart";
import { NetBalanceTrendChart } from "./net-balance-trend-chart";
import { CashflowForecastCard } from "./cashflow-forecast-card";
import type { MonthlyBalancePoint } from "@/lib/data/balance";
import type { CashFlowForecastDay } from "@/lib/data/forecast";

export function IncomeExpenseAnalyticsTab({
  trend,
  forecast,
}: {
  trend: MonthlyBalancePoint[];
  forecast: CashFlowForecastDay[];
}) {
  return (
    <div className="space-y-6">
      <CashflowForecastCard forecast={forecast} />

      <Card>
        <CardHeader>
          <CardTitle>Gelir — Gider Karşılaştırması</CardTitle>
        </CardHeader>
        <IncomeExpenseBarChart data={trend} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6 Aylık Net Bakiye Trendi</CardTitle>
        </CardHeader>
        <NetBalanceTrendChart data={trend} />
      </Card>
    </div>
  );
}
