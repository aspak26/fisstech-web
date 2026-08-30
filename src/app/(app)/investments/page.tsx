import { createClient } from "@/lib/supabase/server";
import { getInvestments, getInvestmentPrices } from "@/lib/data/investments";
import { getPriceAlerts } from "@/lib/data/price-alerts";
import { InvestmentsList } from "@/components/modules/investments/investments-list";
import { PriceAlertsSection } from "@/components/modules/investments/price-alerts-section";

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [investments, prices, alerts] = await Promise.all([
    getInvestments(supabase, user!.id),
    getInvestmentPrices(supabase),
    getPriceAlerts(supabase, user!.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Yatırımlarım</h1>
        <InvestmentsList investments={investments} prices={prices} />
      </div>
      <PriceAlertsSection alerts={alerts} prices={prices} />
    </div>
  );
}
