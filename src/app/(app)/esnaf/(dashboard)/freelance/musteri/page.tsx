import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getFreelanceClients } from "@/lib/data/freelance";
import { FreelanceMusteriList } from "@/components/modules/esnaf/freelance-musteri-list";

export default async function FreelanceMusteriPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const clients = await getFreelanceClients(supabase, business.id);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Müşteriler</h1>
      <FreelanceMusteriList businessId={business.id} clients={clients} />
    </div>
  );
}
