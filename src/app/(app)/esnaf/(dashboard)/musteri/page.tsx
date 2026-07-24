import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getUniversalCustomers } from "@/lib/data/customers";
import { MusteriList } from "@/components/modules/esnaf/musteri-list";

export default async function EsnafMusteriPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const customers = await getUniversalCustomers(supabase, business.id, business.business_type);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Müşteri Yönetimi</h1>
      <MusteriList business={business} customers={customers} />
    </div>
  );
}
