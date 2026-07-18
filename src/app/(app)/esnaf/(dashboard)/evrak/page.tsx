import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getInvoicesWithImage } from "@/lib/data/esnaf";
import { EvrakList } from "@/components/modules/esnaf/evrak-list";

export default async function EsnafEvrakPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const invoices = await getInvoicesWithImage(supabase, business.id);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Evrak Arşivi</h1>
      <EvrakList business={business} invoices={invoices} />
    </div>
  );
}
