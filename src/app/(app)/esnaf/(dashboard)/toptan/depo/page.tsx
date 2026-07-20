import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getInventory } from "@/lib/data/toptan";
import { InventoryList } from "@/components/modules/esnaf/inventory-list";

export default async function ToptanDepoPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const items = await getInventory(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Depo & Stok</h1>
      <InventoryList businessId={business.id} items={items} />
    </div>
  );
}
