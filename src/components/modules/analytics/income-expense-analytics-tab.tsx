import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseBarChart } from "./income-expense-bar-chart";
import { NetBalanceTrendChart } from "./net-balance-trend-chart";
import type { MonthlyBalancePoint } from "@/lib/data/balance";

export function IncomeExpenseAnalyticsTab({ trend }: { trend: MonthlyBalancePoint[] }) {
  return (
    <div className="space-y-6">
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
