import { createClient } from "@/lib/supabase/server";
import { getMonthlyBalanceTrend } from "@/lib/data/balance";
import { SummaryTriple } from "@/components/modules/dashboard/summary-triple";
import { BalanceTrendChart } from "@/components/modules/balance/balance-trend-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BalancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const trend = await getMonthlyBalanceTrend(supabase, userId, 6);
  const current = trend[trend.length - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        Net Bakiye & Gelir-Gider
      </h1>

      <SummaryTriple income={current?.income ?? 0} expense={current?.expense ?? 0} />

      <Card>
        <CardHeader>
          <CardTitle>Son 6 Ay Trend</CardTitle>
        </CardHeader>
        <BalanceTrendChart data={trend} />
      </Card>
    </div>
  );
}
