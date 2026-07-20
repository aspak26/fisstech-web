import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getAllMilestonesForBusiness, getFreelanceClients, getFreelanceProjects } from "@/lib/data/freelance";
import { FreelanceFinans } from "@/components/modules/esnaf/freelance-finans";

export default async function FreelanceFinansPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [projects, clients, milestones] = await Promise.all([
    getFreelanceProjects(supabase, business.id),
    getFreelanceClients(supabase, business.id),
    getAllMilestonesForBusiness(supabase, business.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Finans & Faturalar</h1>
      <FreelanceFinans projects={projects} clients={clients} milestones={milestones} />
    </div>
  );
}
