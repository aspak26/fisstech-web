import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getPerakendeCustomers, getProductCategories, getQuickProducts } from "@/lib/data/perakende";
import { PerakendePos } from "@/components/modules/esnaf/perakende-pos";

export default async function PerakendeKasaPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [categories, products, customers] = await Promise.all([
    getProductCategories(supabase, business.id),
    getQuickProducts(supabase, business.id),
    getPerakendeCustomers(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Hızlı Kasa</h1>
      <PerakendePos businessId={business.id} categories={categories} products={products} customers={customers} />
    </div>
  );
}
