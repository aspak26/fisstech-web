import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getHizmetCustomers } from "@/lib/data/hizmet";
import { HizmetMusteriList } from "@/components/modules/esnaf/hizmet-musteri-list";

export default async function HizmetMusteriPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const customers = await getHizmetCustomers(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Müşteriler</h1>
      <HizmetMusteriList businessId={business.id} customers={customers} />
    </div>
  );
}
