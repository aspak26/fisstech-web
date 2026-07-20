import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getProductCategories, getQuickProducts } from "@/lib/data/perakende";
import { PerakendeProductsList } from "@/components/modules/esnaf/perakende-products-list";

export default async function PerakendeUrunlerPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [categories, products] = await Promise.all([
    getProductCategories(supabase, business.id),
    getQuickProducts(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Ürünler</h1>
      <PerakendeProductsList businessId={business.id} categories={categories} products={products} />
    </div>
  );
}
