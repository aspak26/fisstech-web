import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getFreelanceClients, getFreelanceProjects } from "@/lib/data/freelance";
import { FreelanceProjelerList } from "@/components/modules/esnaf/freelance-projeler-list";

export default async function FreelanceProjelerPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [projects, clients] = await Promise.all([
    getFreelanceProjects(supabase, business.id),
    getFreelanceClients(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Projeler</h1>
      <FreelanceProjelerList businessId={business.id} projects={projects} clients={clients} />
    </div>
  );
}
