import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getClosedOrders } from "@/lib/data/restaurant";
import { KafeKasa } from "@/components/modules/esnaf/kafe-kasa";

export default async function KafeKasaPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const business = await getActiveBusiness();
  if (!business) return null;

  const { date: dateParam } = await searchParams;
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const orders = await getClosedOrders(supabase, business.id, `${date}T00:00:00`, `${date}T23:59:59`);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Restoran Kasa</h1>
      <KafeKasa date={date} orders={orders} />
    </div>
  );
}
