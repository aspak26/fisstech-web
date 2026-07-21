import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getClosedOrders, getMenuSalesBreakdown } from "@/lib/data/restaurant";
import { DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { KafeKasa } from "@/components/modules/esnaf/kafe-kasa";
import { KafeMenuAnalytics } from "@/components/modules/esnaf/kafe-menu-analytics";

export default async function KafeKasaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; menuPeriod?: string }>;
}) {
  const business = await getActiveBusiness();
  if (!business) return null;

  const { date: dateParam, menuPeriod: menuPeriodParam } = await searchParams;
  const date = dateParam ?? new Date().toISOString().slice(0, 10);
  const menuPeriod = menuPeriodParam ?? DEFAULT_BUDGET_PERIOD;

  const supabase = await createClient();
  const [orders, menuSales] = await Promise.all([
    getClosedOrders(supabase, business.id, `${date}T00:00:00`, `${date}T23:59:59`),
    getMenuSalesBreakdown(supabase, business.id, menuPeriod),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Restoran Kasa</h1>
      <KafeKasa date={date} orders={orders} />
      <KafeMenuAnalytics period={menuPeriod} sales={menuSales} />
    </div>
  );
}
