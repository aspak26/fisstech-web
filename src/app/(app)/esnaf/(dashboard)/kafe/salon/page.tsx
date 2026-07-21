import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getTables } from "@/lib/data/restaurant";
import { KafeSalon } from "@/components/modules/esnaf/kafe-salon";

export default async function KafeSalonPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const tables = await getTables(supabase, business.id);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">Salon</h1>
      <KafeSalon businessId={business.id} tables={tables} />
    </div>
  );
}
