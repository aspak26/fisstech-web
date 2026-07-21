import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getOpenDeliveryOrders } from "@/lib/data/restaurant";
import { getMenuCategories, getMenuItems } from "@/lib/data/esnaf";
import { KafePaketServis } from "@/components/modules/esnaf/kafe-paket-servis";

export default async function KafePaketPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [orders, categories, items] = await Promise.all([
    getOpenDeliveryOrders(supabase, business.id),
    getMenuCategories(supabase, business.id),
    getMenuItems(supabase, business.id),
  ]);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Paket Servis</h1>
      <KafePaketServis businessId={business.id} orders={orders} categories={categories} items={items} />
    </div>
  );
}
