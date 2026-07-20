import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getServiceCatalog } from "@/lib/data/hizmet";
import { ServiceCatalogList } from "@/components/modules/esnaf/service-catalog-list";

export default async function HizmetKatalogPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const items = await getServiceCatalog(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Hizmet Kataloğu</h1>
      <ServiceCatalogList businessId={business.id} items={items} />
    </div>
  );
}
