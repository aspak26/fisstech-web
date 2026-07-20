import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getB2bCustomers } from "@/lib/data/toptan";
import { BayilerList } from "@/components/modules/esnaf/bayiler-list";

export default async function ToptanBayilerPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const customers = await getB2bCustomers(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Bayiler</h1>
      <BayilerList businessId={business.id} customers={customers} />
    </div>
  );
}
