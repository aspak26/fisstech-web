import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getActiveTimeLog, getFreelanceProjects, getOpenTasksForBusiness, getRecentTimeLogs } from "@/lib/data/freelance";
import { FreelanceGorevler } from "@/components/modules/esnaf/freelance-gorevler";

export default async function FreelanceGorevlerPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const [projects, tasks, activeLog, recentLogs] = await Promise.all([
    getFreelanceProjects(supabase, business.id),
    getOpenTasksForBusiness(supabase, business.id),
    getActiveTimeLog(supabase, business.id),
    getRecentTimeLogs(supabase, business.id, 10),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Görevler</h1>
      <FreelanceGorevler businessId={business.id} projects={projects} tasks={tasks} activeLog={activeLog} recentLogs={recentLogs} />
    </div>
  );
}
