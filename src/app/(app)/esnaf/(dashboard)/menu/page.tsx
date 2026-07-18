import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getMenuCategories, getMenuItems } from "@/lib/data/esnaf";
import { MenuList } from "@/components/modules/esnaf/menu-list";
import { ComingSoonPage } from "@/components/ui/coming-soon-page";

export default async function EsnafMenuPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  if (business.business_type !== "kafe") {
    return <ComingSoonPage title="Menü Yönetimi (sadece Yeme & İçme işletmeleri için)" />;
  }

  const supabase = await createClient();
  const [categories, items] = await Promise.all([
    getMenuCategories(supabase, business.id),
    getMenuItems(supabase, business.id),
  ]);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">
        Menü Yönetimi
      </h1>
      <MenuList business={business} categories={categories} items={items} />
    </div>
  );
}
