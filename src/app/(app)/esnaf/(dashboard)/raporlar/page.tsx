import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getEsnafRaporlarBundle } from "@/lib/data/esnaf";
import { CHART_COLORS } from "@/lib/data/analytics";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceTrendChart } from "@/components/modules/balance/balance-trend-chart";
import { CategoryDonutChart } from "@/components/modules/analytics/category-donut-chart";
import { IncomeItemTrendChart } from "@/components/modules/esnaf/income-item-trend-chart";
import { formatCurrency } from "@/lib/utils/currency";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart, TrendingUp } from "lucide-react";
import { AiSummaryModal } from "@/components/modules/esnaf/ai-summary-modal";

export default async function EsnafRaporlarPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const { trend, vat, categories, incomeItemTrend } = await getEsnafRaporlarBundle(supabase, business.id, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-text-primary">İşletme Raporları</h1>
        <AiSummaryModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son 6 Ay Ciro/Gider Trend</CardTitle>
        </CardHeader>
        <BalanceTrendChart data={trend} />
      </Card>

      {business.vat_enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Bu Ay KDV Özeti</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-text-secondary">Tahsil Edilen</p>
              <p className="font-display text-lg font-semibold text-success">
                {formatCurrency(vat.collected)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Ödenen</p>
              <p className="font-display text-lg font-semibold text-danger">
                {formatCurrency(vat.paid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Net</p>
              <p className="font-display text-lg font-semibold text-text-primary">
                {formatCurrency(vat.net)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bu Ay Gider Kategorileri</CardTitle>
        </CardHeader>
        {categories.length === 0 ? (
          <EmptyState icon={PieChart} title="Bu ay gider yok" />
        ) : (
          <CategoryDonutChart
            data={categories.map((c, i) => ({
              name: c.category,
              total: c.total,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
          />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bu Ay Kalem Bazlı Gelir Trendi</CardTitle>
        </CardHeader>
        {incomeItemTrend.points.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Bu ay gelir yok" />
        ) : (
          <IncomeItemTrendChart data={incomeItemTrend} />
        )}
      </Card>
    </div>
  );
}
