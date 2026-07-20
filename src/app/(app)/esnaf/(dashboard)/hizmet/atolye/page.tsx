import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getHizmetCustomers, getOpenServiceJobs, getServiceCatalog } from "@/lib/data/hizmet";
import { getEmployees } from "@/lib/data/esnaf";
import { HizmetAtolye } from "@/components/modules/esnaf/hizmet-atolye";

export default async function HizmetAtolyePage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [jobs, customers, employees, catalog] = await Promise.all([
    getOpenServiceJobs(supabase, business.id),
    getHizmetCustomers(supabase, business.id),
    getEmployees(supabase, business.id),
    getServiceCatalog(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Atölye</h1>
      <HizmetAtolye businessId={business.id} jobs={jobs} customers={customers} employees={employees} catalog={catalog} />
    </div>
  );
}
