import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import {
  getFreelanceClients,
  getFreelanceProject,
  getProjectExpenses,
  getProjectMilestones,
  getProjectTasks,
} from "@/lib/data/freelance";
import { FreelanceProjectDetail } from "@/components/modules/esnaf/freelance-project-detail";

export default async function FreelanceProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const project = await getFreelanceProject(supabase, id);
  if (!project) notFound();

  const [clients, milestones, tasks, expenses] = await Promise.all([
    getFreelanceClients(supabase, business.id),
    getProjectMilestones(supabase, id),
    getProjectTasks(supabase, id),
    getProjectExpenses(supabase, id),
  ]);

  const client = clients.find((c) => c.id === project.client_id) ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <FreelanceProjectDetail
        businessId={business.id}
        project={project}
        client={client}
        milestones={milestones}
        tasks={tasks}
        expenses={expenses}
      />
    </div>
  );
}
