import { createClient } from "@/lib/supabase/server";
import { getGoals, getSavingsPool } from "@/lib/data/goals";
import { GoalsList } from "@/components/modules/goals/goals-list";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [goals, pool] = await Promise.all([getGoals(supabase, user!.id), getSavingsPool(supabase, user!.id)]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Hedeflerim</h1>
      <GoalsList goals={goals} pool={pool} />
    </div>
  );
}
