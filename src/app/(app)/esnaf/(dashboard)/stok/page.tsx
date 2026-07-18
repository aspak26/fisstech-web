import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getStockItems } from "@/lib/data/esnaf";
import { StockList } from "@/components/modules/esnaf/stock-list";

export default async function EsnafStokPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const items = await getStockItems(supabase, business.id);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Stok</h1>
      <StockList business={business} items={items} />
    </div>
  );
}
