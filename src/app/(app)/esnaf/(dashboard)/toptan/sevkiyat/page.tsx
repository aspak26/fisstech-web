import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getActiveWholesaleOrders, getB2bCustomers } from "@/lib/data/toptan";
import { SevkiyatKanban } from "@/components/modules/esnaf/sevkiyat-kanban";

export default async function ToptanSevkiyatPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [orders, customers] = await Promise.all([
    getActiveWholesaleOrders(supabase, business.id),
    getB2bCustomers(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Sevkiyat Takibi</h1>
      <SevkiyatKanban orders={orders} customers={customers} />
    </div>
  );
}
