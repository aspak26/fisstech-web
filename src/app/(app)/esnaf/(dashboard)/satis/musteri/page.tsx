import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getSaleCustomers } from "@/lib/data/satis";
import { SaleMusteriList } from "@/components/modules/esnaf/sale-musteri-list";

export default async function SatisMusteriPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const customers = await getSaleCustomers(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Müşteriler</h1>
      <SaleMusteriList businessId={business.id} customers={customers} />
    </div>
  );
}
