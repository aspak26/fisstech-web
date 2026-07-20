import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getCustomerBalances, getPerakendeCustomers } from "@/lib/data/perakende";
import { VeresiyeList } from "@/components/modules/esnaf/veresiye-list";

export default async function PerakendeVeresiyePage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [customers, balances] = await Promise.all([
    getPerakendeCustomers(supabase, business.id),
    getCustomerBalances(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Veresiye Defteri</h1>
      <VeresiyeList businessId={business.id} customers={customers} balances={[...balances.entries()]} />
    </div>
  );
}
